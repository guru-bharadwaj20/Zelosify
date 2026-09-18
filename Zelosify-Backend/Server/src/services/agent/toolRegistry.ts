import { ToolContext } from "../../types/hiring.js";
import { downloadObjectAsBuffer } from "../../utils/aws/s3Downloader.js";
import { extractDocumentText } from "../../utils/parsing/documentText.js";
import { parseResumeText } from "./tools/resumeParsing.js";
import { normalizeSkills } from "./tools/skillNormalization.js";
import { matchCandidate } from "./tools/matchingEngine.js";
import { computeFinalScore } from "./tools/scoringEngine.js";
import { sanitizeText, sanitizeList, countInjectionAttempts } from "./sanitizer.js";
import { validateAgainstSchema } from "./schemaValidator.js";
import { logWarn } from "../../utils/logger/structuredLogger.js";

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  outputSchema: string;
  handler: (args: Record<string, any>, context: ToolContext) => Promise<any>;
}

const loadResumeText = async (s3Key: string): Promise<string> => {
  const buffer = await downloadObjectAsBuffer(s3Key);
  const rawText = await extractDocumentText(buffer, s3Key);
  const injectionAttempts = countInjectionAttempts(rawText);

  if (injectionAttempts > 0) {
    logWarn("agent.prompt_injection_filtered", {
      s3Key,
      occurrences: injectionAttempts,
    });
  }

  return sanitizeText(rawText);
};

export const agentTools: AgentTool[] = [
  {
    name: "parse_resume",
    description:
      "Fetch the candidate profile file from secure storage and extract structured resume data. Call this first when candidate details are not known yet.",
    parameters: {
      type: "object",
      properties: {
        purpose: {
          type: "string",
          description: "Short note on why the resume needs to be parsed.",
        },
      },
      required: [],
    },
    outputSchema: "resumeExtract",
    handler: async (_args, context) => {
      const startedAt = Date.now();
      const text = await loadResumeText(context.s3Key);
      const parsed = parseResumeText(text);

      context.timings.parsingMs = Date.now() - startedAt;
      context.state.resume = parsed;

      return parsed;
    },
  },
  {
    name: "normalize_skills",
    description:
      "Normalize raw skill names into their canonical form so they can be compared with the opening requirements.",
    parameters: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Raw skill names taken from the parsed resume.",
        },
      },
      required: ["skills"],
    },
    outputSchema: "normalizedSkills",
    handler: async (args, context) => {
      const input = sanitizeList(args.skills, 40);
      const source = input.length > 0 ? input : context.state.resume?.skills || [];
      const normalizedSkills = normalizeSkills(source);

      if (context.state.resume) {
        context.state.resume.normalizedSkills = normalizedSkills;
      }

      return { normalizedSkills };
    },
  },
  {
    name: "extract_features",
    description:
      "Build the comparison feature set for the candidate together with the requirements of the opening.",
    parameters: {
      type: "object",
      properties: {
        experienceYears: { type: "number" },
        skills: { type: "array", items: { type: "string" } },
        location: { type: "string" },
      },
      required: [],
    },
    outputSchema: "featureVector",
    handler: async (args, context) => {
      const resume = context.state.resume;
      const features = {
        experienceYears:
          resume?.experienceYears ?? (Number(args.experienceYears) || 0),
        skills: resume?.normalizedSkills?.length
          ? resume.normalizedSkills
          : sanitizeList(args.skills, 40),
        location: resume?.location || sanitizeText(String(args.location || ""), 60),
        requiredSkills: context.requirement.requiredSkills,
        experienceMin: context.requirement.experienceMin,
        experienceMax: context.requirement.experienceMax,
        openingLocation: context.requirement.location,
      };

      return features;
    },
  },
  {
    name: "match_candidate",
    description:
      "Run the deterministic matching engine and return the skill, experience and location match breakdown.",
    parameters: {
      type: "object",
      properties: {
        experienceYears: { type: "number" },
        skills: { type: "array", items: { type: "string" } },
        location: { type: "string" },
      },
      required: [],
    },
    outputSchema: "matchBreakdown",
    handler: async (args, context) => {
      const startedAt = Date.now();
      const resume = context.state.resume;

      const skills = resume?.normalizedSkills?.length
        ? resume.normalizedSkills
        : normalizeSkills(sanitizeList(args.skills, 40));
      const experienceYears =
        resume?.experienceYears ?? (Number(args.experienceYears) || 0);
      const location =
        resume?.location || sanitizeText(String(args.location || ""), 60);

      const match = matchCandidate(
        skills,
        experienceYears,
        location,
        context.requirement
      );

      context.timings.matchingMs = Date.now() - startedAt;
      context.state.match = match;

      return match;
    },
  },
  {
    name: "score_candidate",
    description:
      "Run the deterministic scoring engine on the match breakdown and return the weighted final score.",
    parameters: {
      type: "object",
      properties: {
        skillMatchScore: { type: "number" },
        experienceMatchScore: { type: "number" },
        locationMatchScore: { type: "number" },
      },
      required: [],
    },
    outputSchema: "scoreBreakdown",
    handler: async (args, context) => {
      const match = context.state.match;

      const score = computeFinalScore(
        match ? match.skillMatchScore : Number(args.skillMatchScore) || 0,
        match ? match.experienceMatchScore : Number(args.experienceMatchScore) || 0,
        match ? match.locationMatchScore : Number(args.locationMatchScore) || 0
      );

      context.state.score = score;

      return score;
    },
  },
];

export const getToolByName = (name: string): AgentTool | undefined =>
  agentTools.find((tool) => tool.name === name);

export const getToolDeclarations = () =>
  agentTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));

export const executeTool = async (
  name: string,
  args: Record<string, any>,
  context: ToolContext
): Promise<any> => {
  const tool = getToolByName(name);

  if (!tool) {
    throw new Error(`Unknown tool requested: ${name}`);
  }

  const output = await tool.handler(args || {}, context);
  return validateAgainstSchema(tool.outputSchema, output);
};

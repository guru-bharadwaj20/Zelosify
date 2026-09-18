import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true });

const stringArray = { type: "array", items: { type: "string" } };
const unitNumber = { type: "number", minimum: 0, maximum: 1 };

const schemas: Record<string, object> = {
  resumeExtract: {
    type: "object",
    properties: {
      experienceYears: { type: "number", minimum: 0, maximum: 60 },
      skills: stringArray,
      normalizedSkills: stringArray,
      location: { type: "string" },
      education: stringArray,
      keywords: stringArray,
    },
    required: [
      "experienceYears",
      "skills",
      "normalizedSkills",
      "location",
      "education",
      "keywords",
    ],
  },
  normalizedSkills: {
    type: "object",
    properties: { normalizedSkills: stringArray },
    required: ["normalizedSkills"],
  },
  featureVector: {
    type: "object",
    properties: {
      experienceYears: { type: "number", minimum: 0, maximum: 60 },
      skills: stringArray,
      location: { type: "string" },
      requiredSkills: stringArray,
      experienceMin: { type: "number", minimum: 0 },
      experienceMax: { type: ["number", "null"] },
      openingLocation: { type: "string" },
    },
    required: ["experienceYears", "skills", "location", "requiredSkills"],
  },
  matchBreakdown: {
    type: "object",
    properties: {
      skillMatchScore: unitNumber,
      experienceMatchScore: unitNumber,
      locationMatchScore: unitNumber,
      matchedSkills: stringArray,
      missingSkills: stringArray,
    },
    required: [
      "skillMatchScore",
      "experienceMatchScore",
      "locationMatchScore",
      "matchedSkills",
      "missingSkills",
    ],
  },
  scoreBreakdown: {
    type: "object",
    properties: {
      skillMatchScore: unitNumber,
      experienceMatchScore: unitNumber,
      locationMatchScore: unitNumber,
      finalScore: unitNumber,
    },
    required: [
      "skillMatchScore",
      "experienceMatchScore",
      "locationMatchScore",
      "finalScore",
    ],
  },
  agentDecision: {
    type: "object",
    properties: {
      recommended: { type: "boolean" },
      score: unitNumber,
      confidence: unitNumber,
      reason: { type: "string", minLength: 5, maxLength: 800 },
    },
    required: ["recommended", "score", "confidence", "reason"],
  },
};

const validators = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)])
);

export class SchemaValidationError extends Error {
  public readonly details: string;

  constructor(schemaName: string, details: string) {
    super(`Output failed ${schemaName} schema validation`);
    this.name = "SchemaValidationError";
    this.details = details;
  }
}

export const validateAgainstSchema = <T>(schemaName: string, payload: unknown): T => {
  const validate = validators[schemaName];

  if (!validate) {
    throw new Error(`Unknown validation schema: ${schemaName}`);
  }

  if (!validate(payload)) {
    const details = (validate.errors || [])
      .map((error) => `${error.instancePath || "root"} ${error.message}`)
      .join("; ");
    throw new SchemaValidationError(schemaName, details);
  }

  return payload as T;
};

export const isValidAgainstSchema = (
  schemaName: string,
  payload: unknown
): boolean => {
  const validate = validators[schemaName];
  return validate ? Boolean(validate(payload)) : false;
};

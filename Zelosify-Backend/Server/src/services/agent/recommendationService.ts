import prisma from "../../config/prisma/prisma.js";
import { AGENT_VERSION, runRecommendationAgent } from "./agentOrchestrator.js";
import { classifyScore } from "./decisionPolicy.js";
import { getModelName } from "./llm/geminiClient.js";
import { AgentRunResult, OpeningRequirement } from "../../types/hiring.js";
import { logError, logInfo } from "../../utils/logger/structuredLogger.js";

const buildRequirement = (opening: any): OpeningRequirement => ({
  openingId: opening.id,
  title: opening.title,
  location: opening.location || "",
  contractType: opening.contractType || "",
  requiredSkills: opening.requiredSkills || [],
  experienceMin: opening.experienceMin,
  experienceMax: opening.experienceMax,
});

export const generateRecommendation = async (
  profileId: number,
  force = false
): Promise<AgentRunResult | null> => {
  const profile = await prisma.hiringProfile.findFirst({
    where: { id: profileId, isDeleted: false },
    include: { opening: true },
  });

  if (!profile) {
    logError("recommendation.profile_not_found", { profileId });
    return null;
  }

  const alreadyScored =
    profile.recommendedAt !== null &&
    profile.recommendationVersion === AGENT_VERSION;

  if (alreadyScored && !force) {
    logInfo("recommendation.skipped", {
      profileId,
      reason: "already scored with the current agent version",
    });
    return null;
  }

  logInfo("recommendation.started", {
    profileId,
    openingId: profile.openingId,
    startTime: new Date().toISOString(),
    model: getModelName(),
  });

  try {
    const result = await runRecommendationAgent(
      profile.s3Key,
      buildRequirement(profile.opening)
    );

    await prisma.$transaction(async (tx) => {
      await tx.hiringProfile.update({
        where: { id: profile.id },
        data: {
          recommended: result.decision.recommended,
          recommendationScore: result.decision.score,
          recommendationReason: result.decision.reason,
          recommendationConfidence: result.decision.confidence,
          recommendationLatencyMs: result.latencyMs,
          recommendationVersion: result.version,
          recommendedAt: new Date(),
          tokensUsed: result.tokensUsed,
          reasoningTrace: {
            label: classifyScore(result.decision.score),
            featureVector: { ...result.featureVector },
            breakdown: { ...result.score },
            steps: result.steps.map((step) => ({ ...step })),
            parsingMs: result.parsingMs,
            matchingMs: result.matchingMs,
            fallbackUsed: result.fallbackUsed,
            model: getModelName(),
          },
        },
      });
    });

    logInfo("recommendation.persisted", {
      profileId,
      openingId: profile.openingId,
      finalScore: result.decision.score,
      recommended: result.decision.recommended,
      parsingMs: result.parsingMs,
      matchingMs: result.matchingMs,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
    });

    return result;
  } catch (error: any) {
    logError("recommendation.failed", {
      profileId,
      openingId: profile.openingId,
      error: error.message,
    });
    return null;
  }
};

export const queueRecommendations = (profileIds: number[]): void => {
  for (const profileId of profileIds) {
    setImmediate(() => {
      generateRecommendation(profileId).catch((error: any) => {
        logError("recommendation.queue_failed", {
          profileId,
          error: error.message,
        });
      });
    });
  }
};

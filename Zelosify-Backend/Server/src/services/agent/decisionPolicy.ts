import { AgentDecision, MatchBreakdown, ScoreBreakdown } from "../../types/hiring.js";
import { sanitizeText } from "./sanitizer.js";

export const RECOMMENDED_THRESHOLD = 0.75;
export const BORDERLINE_THRESHOLD = 0.5;

export type RecommendationLabel =
  | "RECOMMENDED"
  | "BORDERLINE"
  | "NOT_RECOMMENDED";

export const classifyScore = (score: number): RecommendationLabel => {
  if (score >= RECOMMENDED_THRESHOLD) return "RECOMMENDED";
  if (score >= BORDERLINE_THRESHOLD) return "BORDERLINE";
  return "NOT_RECOMMENDED";
};

export const buildFallbackReason = (
  score: ScoreBreakdown,
  match: MatchBreakdown
): string => {
  const skillPercent = Math.round(score.skillMatchScore * 100);
  const matched = match.matchedSkills.length;
  const total = matched + match.missingSkills.length;
  const experienceText =
    score.experienceMatchScore === 1
      ? "experience within the requested range"
      : score.experienceMatchScore === 0
      ? "experience below the minimum"
      : "experience above the requested range";

  return `Skill match ${skillPercent}% (${matched} of ${total} required skills), ${experienceText}, location score ${score.locationMatchScore}.`;
};

const defaultConfidence = (score: number): number => {
  const distance = Math.abs(score - RECOMMENDED_THRESHOLD);
  return Math.round(Math.min(0.95, 0.6 + distance) * 100) / 100;
};

export const applyDecisionPolicy = (
  score: ScoreBreakdown,
  match: MatchBreakdown,
  llmReason?: string,
  llmConfidence?: number
): AgentDecision => {
  const reason = sanitizeText(llmReason || "", 500).trim();
  const confidence =
    typeof llmConfidence === "number" && llmConfidence >= 0 && llmConfidence <= 1
      ? Math.round(llmConfidence * 100) / 100
      : defaultConfidence(score.finalScore);

  return {
    recommended: score.finalScore >= RECOMMENDED_THRESHOLD,
    score: score.finalScore,
    confidence,
    reason: reason || buildFallbackReason(score, match),
  };
};

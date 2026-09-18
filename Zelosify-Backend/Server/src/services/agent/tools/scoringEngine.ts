import { ScoreBreakdown } from "../../../types/hiring.js";

export const SKILL_WEIGHT = 0.5;
export const EXPERIENCE_WEIGHT = 0.3;
export const LOCATION_WEIGHT = 0.2;

const clamp = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const roundScore = (value: number): number =>
  Math.round(value * 100) / 100;

export const computeFinalScore = (
  skillMatchScore: number,
  experienceMatchScore: number,
  locationMatchScore: number
): ScoreBreakdown => {
  const skill = clamp(skillMatchScore);
  const experience = clamp(experienceMatchScore);
  const location = clamp(locationMatchScore);

  const finalScore =
    SKILL_WEIGHT * skill +
    EXPERIENCE_WEIGHT * experience +
    LOCATION_WEIGHT * location;

  return {
    skillMatchScore: skill,
    experienceMatchScore: experience,
    locationMatchScore: location,
    finalScore: roundScore(finalScore),
  };
};

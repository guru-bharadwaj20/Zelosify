import { MatchBreakdown, OpeningRequirement } from "../../../types/hiring.js";
import { normalizeSkills } from "./skillNormalization.js";

export const computeExperienceMatchScore = (
  candidateYears: number,
  experienceMin: number,
  experienceMax: number | null
): number => {
  if (candidateYears < experienceMin) return 0;
  if (experienceMax === null || experienceMax === undefined) return 1;
  if (candidateYears <= experienceMax) return 1;
  return 0.8;
};

export const computeSkillMatchScore = (
  candidateSkills: string[],
  requiredSkills: string[]
): number => {
  const required = normalizeSkills(requiredSkills);
  if (required.length === 0) return 0;

  const candidate = new Set(normalizeSkills(candidateSkills));
  const matched = required.filter((skill) => candidate.has(skill));

  return matched.length / required.length;
};

export const computeLocationMatchScore = (
  candidateLocation: string,
  openingLocation: string
): number => {
  const opening = String(openingLocation || "").toLowerCase().trim();
  const candidate = String(candidateLocation || "").toLowerCase().trim();

  if (opening.includes("remote") || candidate.includes("remote")) return 1;
  if (!opening || !candidate) return 0.5;
  if (opening.includes(candidate) || candidate.includes(opening)) return 1;

  return 0.5;
};

export const matchCandidate = (
  candidateSkills: string[],
  candidateYears: number,
  candidateLocation: string,
  requirement: OpeningRequirement
): MatchBreakdown => {
  const required = normalizeSkills(requirement.requiredSkills);
  const candidate = new Set(normalizeSkills(candidateSkills));

  return {
    skillMatchScore: computeSkillMatchScore(
      candidateSkills,
      requirement.requiredSkills
    ),
    experienceMatchScore: computeExperienceMatchScore(
      candidateYears,
      requirement.experienceMin,
      requirement.experienceMax
    ),
    locationMatchScore: computeLocationMatchScore(
      candidateLocation,
      requirement.location
    ),
    matchedSkills: required.filter((skill) => candidate.has(skill)),
    missingSkills: required.filter((skill) => !candidate.has(skill)),
  };
};

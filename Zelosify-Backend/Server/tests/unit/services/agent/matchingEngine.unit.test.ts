import { describe, it, expect } from "vitest";
import {
  computeExperienceMatchScore,
  computeSkillMatchScore,
  computeLocationMatchScore,
  matchCandidate,
} from "../../../../src/services/agent/tools/matchingEngine";
import type { OpeningRequirement } from "../../../../src/types/hiring";

const requirement: OpeningRequirement = {
  openingId: "opening-1",
  title: "Senior Backend Engineer",
  location: "Bangalore",
  contractType: "Full Time Contract",
  requiredSkills: ["node.js", "typescript", "postgresql", "aws"],
  experienceMin: 5,
  experienceMax: 9,
};

describe("experience matching", () => {
  it("returns 0 when the candidate is below the minimum", () => {
    expect(computeExperienceMatchScore(4, 5, 9)).toBe(0);
    expect(computeExperienceMatchScore(0, 5, 9)).toBe(0);
  });

  it("returns 1 on both range boundaries", () => {
    expect(computeExperienceMatchScore(5, 5, 9)).toBe(1);
    expect(computeExperienceMatchScore(9, 5, 9)).toBe(1);
  });

  it("returns 1 inside the range", () => {
    expect(computeExperienceMatchScore(7, 5, 9)).toBe(1);
  });

  it("returns 0.8 above the maximum", () => {
    expect(computeExperienceMatchScore(10, 5, 9)).toBe(0.8);
    expect(computeExperienceMatchScore(25, 5, 9)).toBe(0.8);
  });

  it("treats a missing maximum as an open range", () => {
    expect(computeExperienceMatchScore(30, 8, null)).toBe(1);
    expect(computeExperienceMatchScore(7, 8, null)).toBe(0);
  });
});

describe("skill matching", () => {
  it("returns the overlap ratio against the required skills", () => {
    expect(
      computeSkillMatchScore(["node.js", "typescript"], [
        "node.js",
        "typescript",
        "postgresql",
        "aws",
      ])
    ).toBe(0.5);
  });

  it("returns 1 when every required skill is present", () => {
    expect(
      computeSkillMatchScore(
        ["node.js", "typescript", "react"],
        ["node.js", "typescript"]
      )
    ).toBe(1);
  });

  it("returns 0 when nothing overlaps", () => {
    expect(computeSkillMatchScore(["php", "laravel"], ["node.js"])).toBe(0);
  });

  it("matches skills written in a different form", () => {
    expect(computeSkillMatchScore(["JS", "NodeJS"], ["javascript", "node.js"])).toBe(1);
  });

  it("ignores duplicate candidate skills", () => {
    expect(
      computeSkillMatchScore(["node.js", "node.js"], ["node.js", "aws"])
    ).toBe(0.5);
  });

  it("returns 0 when the opening lists no skills", () => {
    expect(computeSkillMatchScore(["node.js"], [])).toBe(0);
  });
});

describe("location matching", () => {
  it("returns 1 for a remote opening", () => {
    expect(computeLocationMatchScore("Chennai", "Remote")).toBe(1);
  });

  it("returns 1 for a remote candidate", () => {
    expect(computeLocationMatchScore("Remote", "Bangalore")).toBe(1);
  });

  it("returns 1 for an exact match", () => {
    expect(computeLocationMatchScore("bangalore", "Bangalore")).toBe(1);
  });

  it("returns 0.5 for an onsite mismatch", () => {
    expect(computeLocationMatchScore("Chennai", "Bangalore")).toBe(0.5);
  });

  it("returns 0.5 when the candidate location is unknown", () => {
    expect(computeLocationMatchScore("", "Bangalore")).toBe(0.5);
  });
});

describe("matchCandidate", () => {
  it("reports matched and missing skills", () => {
    const result = matchCandidate(
      ["node.js", "typescript", "docker"],
      7,
      "Bangalore",
      requirement
    );

    expect(result.matchedSkills).toEqual(["node.js", "typescript"]);
    expect(result.missingSkills).toEqual(["postgresql", "aws"]);
    expect(result.skillMatchScore).toBe(0.5);
    expect(result.experienceMatchScore).toBe(1);
    expect(result.locationMatchScore).toBe(1);
  });
});

import { describe, it, expect } from "vitest";
import {
  computeFinalScore,
  SKILL_WEIGHT,
  EXPERIENCE_WEIGHT,
  LOCATION_WEIGHT,
} from "../../../../src/services/agent/tools/scoringEngine";

describe("scoring engine", () => {
  it("uses the mandated weights", () => {
    expect(SKILL_WEIGHT).toBe(0.5);
    expect(EXPERIENCE_WEIGHT).toBe(0.3);
    expect(LOCATION_WEIGHT).toBe(0.2);
    expect(SKILL_WEIGHT + EXPERIENCE_WEIGHT + LOCATION_WEIGHT).toBe(1);
  });

  it("applies the weighted formula", () => {
    const result = computeFinalScore(0.8, 1, 1);
    expect(result.finalScore).toBe(0.9);
  });

  it("returns 1 for a perfect match", () => {
    expect(computeFinalScore(1, 1, 1).finalScore).toBe(1);
  });

  it("returns 0 when nothing matches", () => {
    expect(computeFinalScore(0, 0, 0).finalScore).toBe(0);
  });

  it("matches a manual calculation", () => {
    const skill = 0.5;
    const experience = 0.8;
    const location = 0.5;
    const expected =
      Math.round((0.5 * skill + 0.3 * experience + 0.2 * location) * 100) / 100;

    expect(computeFinalScore(skill, experience, location).finalScore).toBe(expected);
  });

  it("keeps the breakdown alongside the final score", () => {
    const result = computeFinalScore(0.75, 1, 0.5);

    expect(result.skillMatchScore).toBe(0.75);
    expect(result.experienceMatchScore).toBe(1);
    expect(result.locationMatchScore).toBe(0.5);
    expect(result.finalScore).toBe(0.78);
  });

  it("clamps values outside the allowed range", () => {
    const result = computeFinalScore(2, -1, 0.5);

    expect(result.skillMatchScore).toBe(1);
    expect(result.experienceMatchScore).toBe(0);
    expect(result.finalScore).toBe(0.6);
  });
});

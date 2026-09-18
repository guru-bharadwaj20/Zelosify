import { describe, it, expect } from "vitest";
import {
  validateAgainstSchema,
  isValidAgainstSchema,
  SchemaValidationError,
} from "../../../../src/services/agent/schemaValidator";

const validDecision = {
  recommended: true,
  score: 0.82,
  confidence: 0.91,
  reason: "Strong skill match, experience within range.",
};

describe("agent output validation", () => {
  it("accepts a well formed decision", () => {
    expect(() => validateAgainstSchema("agentDecision", validDecision)).not.toThrow();
  });

  it("rejects a decision with a missing field", () => {
    const { confidence, ...incomplete } = validDecision;

    expect(() => validateAgainstSchema("agentDecision", incomplete)).toThrow(
      SchemaValidationError
    );
  });

  it("rejects a score outside the 0 to 1 range", () => {
    expect(isValidAgainstSchema("agentDecision", { ...validDecision, score: 8 })).toBe(
      false
    );
  });

  it("rejects a decision with the wrong types", () => {
    expect(
      isValidAgainstSchema("agentDecision", {
        ...validDecision,
        recommended: "yes",
      })
    ).toBe(false);
  });

  it("rejects free text instead of a decision object", () => {
    expect(isValidAgainstSchema("agentDecision", "looks like a good fit")).toBe(false);
  });
});

describe("tool output validation", () => {
  it("accepts a complete resume extract", () => {
    const extract = {
      experienceYears: 6,
      skills: ["node.js"],
      normalizedSkills: ["node.js"],
      location: "Bangalore",
      education: ["B.Tech"],
      keywords: ["backend"],
    };

    expect(isValidAgainstSchema("resumeExtract", extract)).toBe(true);
  });

  it("rejects a resume extract without the skills list", () => {
    expect(
      isValidAgainstSchema("resumeExtract", {
        experienceYears: 6,
        normalizedSkills: [],
        location: "",
        education: [],
        keywords: [],
      })
    ).toBe(false);
  });

  it("rejects a score breakdown with an out of range value", () => {
    expect(
      isValidAgainstSchema("scoreBreakdown", {
        skillMatchScore: 1.4,
        experienceMatchScore: 1,
        locationMatchScore: 1,
        finalScore: 1,
      })
    ).toBe(false);
  });

  it("reports the failing field in the error details", () => {
    try {
      validateAgainstSchema("scoreBreakdown", { finalScore: 0.5 });
      throw new Error("validation should have failed");
    } catch (error: any) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect(error.details).toContain("skillMatchScore");
    }
  });
});

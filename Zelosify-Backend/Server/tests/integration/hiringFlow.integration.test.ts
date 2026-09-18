import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "stream";

vi.mock("axios", () => ({
  default: { put: vi.fn(), post: vi.fn() },
}));

vi.mock("../../src/config/prisma/prisma", () => ({
  default: {
    opening: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    hiringProfile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../src/services/storage/storageFactory", () => ({
  createStorageService: () => ({
    getUploadURL: vi.fn(async (key: string) => `https://s3.test/${key}`),
    getObjectURL: vi.fn(async (key: string) => `https://s3.test/preview/${key}`),
    getObjectStream: vi.fn(async () => Readable.from([Buffer.from("resume")])),
    putObject: vi.fn(),
    listObjects: vi.fn(),
  }),
}));

vi.mock("../../src/utils/parsing/documentText", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    extractDocumentText: vi.fn(async () => RESUME_TEXT),
  };
});

vi.mock("../../src/services/agent/recommendationService", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, queueRecommendations: vi.fn() };
});

const RESUME_TEXT = [
  "Priya Sharma",
  "Location: Bangalore",
  "7 years of experience building backend platforms",
  "Skills: Node.js, TypeScript, PostgreSQL, AWS, Docker",
  "Education: B.Tech in Computer Science",
].join("\n");

import axios from "axios";
import prisma from "../../src/config/prisma/prisma";
import {
  createUploadTokens,
  submitProfiles,
} from "../../src/services/hiring/profileService";
import {
  generateRecommendation,
  queueRecommendations,
} from "../../src/services/agent/recommendationService";
import {
  shortlistProfile,
  listOpeningProfiles,
} from "../../src/services/hiring/hiringManagerService";

const TENANT_ID = "tenant-wayne";
const OPENING_ID = "opening-1";
const VENDOR_ID = "vendor-1";
const MANAGER_ID = "manager-1";

const opening = {
  id: OPENING_ID,
  tenantId: TENANT_ID,
  title: "Senior Backend Engineer",
  description: "Backend platform work",
  location: "Bangalore",
  contractType: "Full Time Contract",
  hiringManagerId: MANAGER_ID,
  requiredSkills: ["node.js", "typescript", "postgresql", "aws"],
  experienceMin: 5,
  experienceMax: 9,
  status: "OPEN",
  postedDate: new Date(),
  expectedCompletionDate: null,
  actionDate: null,
};

const db = prisma as any;
const http = axios as any;

const llmReply = (parts: any[]) => ({
  data: {
    candidates: [{ content: { parts } }],
    usageMetadata: {
      promptTokenCount: 120,
      candidatesTokenCount: 40,
      totalTokenCount: 160,
    },
  },
});

const buildFile = (name: string) =>
  ({
    originalname: name,
    mimetype: "application/pdf",
    buffer: Buffer.from("pdf-bytes"),
  } as any);

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (arg: any) =>
    typeof arg === "function" ? arg(db) : Promise.all(arg)
  );
  db.opening.findFirst.mockResolvedValue(opening);
  http.put.mockResolvedValue({ status: 200 });
});

describe("upload, submit, recommend and shortlist", () => {
  it("runs the full flow for a vendor profile", async () => {
    const uploads = await createUploadTokens(TENANT_ID, OPENING_ID, [
      "priya_sharma.pdf",
    ]);

    expect(uploads).toHaveLength(1);
    expect(uploads[0].uploadToken).toBeTruthy();
    expect(uploads[0].uploadEndpoint).toContain(OPENING_ID);

    let storedKey = "";
    db.hiringProfile.create.mockImplementation(async ({ data }: any) => {
      storedKey = data.s3Key;
      return {
        id: 1,
        s3Key: data.s3Key,
        submittedAt: new Date(),
        status: "SUBMITTED",
      };
    });

    const submitted = await submitProfiles(
      TENANT_ID,
      VENDOR_ID,
      OPENING_ID,
      [buildFile("priya_sharma.pdf")],
      [uploads[0].uploadToken]
    );

    expect(http.put).toHaveBeenCalledTimes(1);
    expect(storedKey.startsWith(`${TENANT_ID}/${OPENING_ID}/`)).toBe(true);
    expect(submitted[0].fileName).toBe("priya_sharma.pdf");
    expect(submitted[0].status).toBe("SUBMITTED");
    expect(queueRecommendations).toHaveBeenCalledWith([1]);

    db.hiringProfile.findFirst.mockResolvedValue({
      id: 1,
      s3Key: storedKey,
      openingId: OPENING_ID,
      uploadedBy: VENDOR_ID,
      status: "SUBMITTED",
      recommendedAt: null,
      recommendationVersion: null,
      opening,
    });

    http.post
      .mockResolvedValueOnce(
        llmReply([{ functionCall: { name: "parse_resume", args: {} } }])
      )
      .mockResolvedValueOnce(
        llmReply([{ functionCall: { name: "match_candidate", args: {} } }])
      )
      .mockResolvedValueOnce(
        llmReply([{ functionCall: { name: "score_candidate", args: {} } }])
      )
      .mockResolvedValueOnce(
        llmReply([
          {
            text: '{"recommended": true, "score": 1, "confidence": 0.93, "reason": "All four required skills are present and the experience sits inside the range."}',
          },
        ])
      );

    let persisted: any = null;
    db.hiringProfile.update.mockImplementation(async ({ data }: any) => {
      persisted = data;
      return { id: 1, ...data };
    });

    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const result = await generateRecommendation(1);
    vi.unstubAllEnvs();

    expect(result).not.toBeNull();
    expect(http.post).toHaveBeenCalledTimes(4);
    expect(result?.fallbackUsed).toBe(false);
    expect(result?.tokensUsed).toBe(640);

    expect(persisted.recommended).toBe(true);
    expect(persisted.recommendationScore).toBe(1);
    expect(persisted.recommendationConfidence).toBe(0.93);
    expect(persisted.recommendationVersion).toBe("gemini-tool-agent-v1");
    expect(persisted.recommendationLatencyMs).toBeGreaterThanOrEqual(0);
    expect(persisted.reasoningTrace.label).toBe("RECOMMENDED");
    expect(persisted.reasoningTrace.featureVector.experienceYears).toBe(7);
    expect(
      persisted.reasoningTrace.steps.filter((step: any) =>
        step.action.startsWith("tool:")
      )
    ).toHaveLength(3);

    db.hiringProfile.findFirst.mockResolvedValue({
      id: 1,
      s3Key: storedKey,
      status: "SUBMITTED",
      opening: { hiringManagerId: MANAGER_ID },
    });
    db.hiringProfile.update.mockResolvedValue({
      id: 1,
      status: "SHORTLISTED",
      shortlistedAt: new Date(),
    });

    const shortlisted = await shortlistProfile(TENANT_ID, MANAGER_ID, 1);

    expect(shortlisted.status).toBe("SHORTLISTED");
    expect(db.hiringProfile.update.mock.calls.pop()[0].data.shortlistedBy).toBe(
      MANAGER_ID
    );
  });

  it("returns the recommendation details to the hiring manager", async () => {
    db.hiringProfile.findMany.mockResolvedValue([
      {
        id: 1,
        s3Key: `${TENANT_ID}/${OPENING_ID}/1700000000_priya_sharma.pdf`,
        submittedAt: new Date(),
        status: "SUBMITTED",
        recommended: true,
        recommendationScore: 0.9,
        recommendationConfidence: 0.93,
        recommendationReason: "Strong skill match",
        recommendationLatencyMs: 820,
        recommendationVersion: "gemini-tool-agent-v1",
        recommendedAt: new Date(),
      },
    ]);

    const data = await listOpeningProfiles(TENANT_ID, MANAGER_ID, OPENING_ID);

    expect(data.profiles[0]).toMatchObject({
      fileName: "priya_sharma.pdf",
      recommendationLabel: "RECOMMENDED",
      score: 0.9,
      confidence: 0.93,
      explanation: "Strong skill match",
      processingTimeMs: 820,
    });
  });

  it("does not score the same profile twice", async () => {
    db.hiringProfile.findFirst.mockResolvedValue({
      id: 1,
      s3Key: `${TENANT_ID}/${OPENING_ID}/1700000000_priya_sharma.pdf`,
      recommendedAt: new Date(),
      recommendationVersion: "gemini-tool-agent-v1",
      opening,
    });

    const result = await generateRecommendation(1);

    expect(result).toBeNull();
    expect(db.hiringProfile.update).not.toHaveBeenCalled();
  });

  it("rejects an upload token issued for another tenant", async () => {
    const uploads = await createUploadTokens(TENANT_ID, OPENING_ID, [
      "priya_sharma.pdf",
    ]);

    await expect(
      submitProfiles(
        "tenant-other",
        VENDOR_ID,
        OPENING_ID,
        [buildFile("priya_sharma.pdf")],
        [uploads[0].uploadToken]
      )
    ).rejects.toMatchObject({ status: 400 });

    expect(db.hiringProfile.create).not.toHaveBeenCalled();
  });

  it("rejects file types other than pdf and pptx", async () => {
    await expect(
      submitProfiles(
        TENANT_ID,
        VENDOR_ID,
        OPENING_ID,
        [buildFile("profile.docx")],
        ["token"]
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it("falls back to the deterministic engines when the model call fails", async () => {
    db.hiringProfile.findFirst.mockResolvedValue({
      id: 2,
      s3Key: `${TENANT_ID}/${OPENING_ID}/1700000000_priya_sharma.pdf`,
      openingId: OPENING_ID,
      recommendedAt: null,
      recommendationVersion: null,
      opening,
    });

    http.post.mockRejectedValue(new Error("model unavailable"));

    let persisted: any = null;
    db.hiringProfile.update.mockImplementation(async ({ data }: any) => {
      persisted = data;
      return { id: 2, ...data };
    });

    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const result = await generateRecommendation(2);
    vi.unstubAllEnvs();

    expect(result?.fallbackUsed).toBe(true);
    expect(persisted.recommendationScore).toBe(1);
    expect(persisted.recommendationReason).toContain("Skill match 100%");
  });
});

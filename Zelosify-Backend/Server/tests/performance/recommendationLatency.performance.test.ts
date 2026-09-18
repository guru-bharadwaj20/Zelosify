import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Readable } from "stream";

vi.mock("axios", () => ({
  default: { put: vi.fn(), post: vi.fn() },
}));

vi.mock("../../src/config/prisma/prisma", () => ({
  default: {
    opening: { findFirst: vi.fn() },
    hiringProfile: { findFirst: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../src/services/storage/storageFactory", () => ({
  createStorageService: () => ({
    getObjectStream: vi.fn(async () => Readable.from([Buffer.from("resume")])),
    getObjectURL: vi.fn(),
    getUploadURL: vi.fn(),
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

const RESUME_TEXT = [
  "Candidate Profile",
  "Location: Bangalore",
  "6 years of experience in backend engineering",
  "Skills: Node.js, TypeScript, PostgreSQL, Docker",
  "Education: B.Tech Computer Science",
].join("\n");

import axios from "axios";
import prisma from "../../src/config/prisma/prisma";
import { generateRecommendation } from "../../src/services/agent/recommendationService";

const PROFILE_COUNT = 100;
const CONCURRENCY = 10;
const LLM_CALL_DELAY_MS = 25;

const opening = {
  id: "opening-1",
  tenantId: "tenant-wayne",
  title: "Senior Backend Engineer",
  description: "Backend platform work",
  location: "Bangalore",
  contractType: "Full Time Contract",
  hiringManagerId: "manager-1",
  requiredSkills: ["node.js", "typescript", "postgresql", "aws"],
  experienceMin: 5,
  experienceMax: 9,
  status: "OPEN",
};

const db = prisma as any;
const http = axios as any;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const llmReply = (parts: any[]) => ({
  data: {
    candidates: [{ content: { parts } }],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 30,
      totalTokenCount: 130,
    },
  },
});

const percentile = (values: number[], fraction: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * fraction) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
};

beforeAll(() => {
  vi.stubEnv("GEMINI_API_KEY", "performance-test-key");

  db.$transaction.mockImplementation(async (arg: any) =>
    typeof arg === "function" ? arg(db) : Promise.all(arg)
  );

  db.hiringProfile.findFirst.mockImplementation(async ({ where }: any) => ({
    id: where.id,
    s3Key: `tenant-wayne/opening-1/17000000${where.id}_candidate.pdf`,
    openingId: "opening-1",
    uploadedBy: "vendor-1",
    status: "SUBMITTED",
    recommendedAt: null,
    recommendationVersion: null,
    opening,
  }));

  db.hiringProfile.update.mockImplementation(async ({ data }: any) => data);

  const toolOrder = ["parse_resume", "match_candidate", "score_candidate"];
  const callCounts = new Map<string, number>();

  http.post.mockImplementation(async (_url: string, body: any) => {
    await wait(LLM_CALL_DELAY_MS);

    const key = JSON.stringify(body.contents[0]);
    const turn = callCounts.get(key) || 0;
    callCounts.set(key, turn + 1);

    if (turn < toolOrder.length) {
      return llmReply([{ functionCall: { name: toolOrder[turn], args: {} } }]);
    }

    return llmReply([
      {
        text: '{"recommended": true, "score": 0.9, "confidence": 0.9, "reason": "Required skills are covered and the experience fits the range."}',
      },
    ]);
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("recommendation latency under load", () => {
  it("keeps p95 below 2000ms for 100 profiles", async () => {
    const latencies: number[] = [];
    const profileIds = Array.from(
      { length: PROFILE_COUNT },
      (_, index) => index + 1
    );

    for (let start = 0; start < profileIds.length; start += CONCURRENCY) {
      const batch = profileIds.slice(start, start + CONCURRENCY);

      const results = await Promise.all(
        batch.map(async (profileId) => {
          const startedAt = Date.now();
          const result = await generateRecommendation(profileId);
          return { elapsed: Date.now() - startedAt, result };
        })
      );

      for (const item of results) {
        expect(item.result).not.toBeNull();
        latencies.push(item.elapsed);
      }
    }

    const p95 = percentile(latencies, 0.95);
    const max = Math.max(...latencies);
    const average = Math.round(
      latencies.reduce((total, value) => total + value, 0) / latencies.length
    );

    console.log(
      JSON.stringify({
        event: "performance.summary",
        profiles: latencies.length,
        averageMs: average,
        p95Ms: p95,
        maxMs: max,
      })
    );

    expect(latencies).toHaveLength(PROFILE_COUNT);
    expect(p95).toBeLessThan(2000);
    expect(max).toBeLessThan(2000);
  });
});

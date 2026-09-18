import { describe, it, expect, beforeAll, vi } from "vitest";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

let authorizeRole: any;

const signToken = (roles: string[]) =>
  jwt.sign({ sub: "user-1", realm_access: { roles } }, privateKey, {
    algorithm: "RS256",
    expiresIn: "1h",
  });

const buildResponse = () => {
  const res: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: any) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

const runMiddleware = (token: string | null, requiredRole: string) =>
  new Promise<{ res: any; nextCalled: boolean }>((resolve) => {
    const res = buildResponse();
    const req: any = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      cookies: {},
      user: { id: "user-1" },
    };

    const next = vi.fn(() => resolve({ res, nextCalled: true }));

    const originalJson = res.json;
    res.json = (payload: any) => {
      originalJson.call(res, payload);
      resolve({ res, nextCalled: false });
      return res;
    };

    authorizeRole(requiredRole)(req, res, next);
  });

beforeAll(async () => {
  process.env.KEYCLOAK_RS256_SIG = publicKey;
  const module = await import(
    "../../../src/middlewares/auth/authorizeMiddleware"
  );
  authorizeRole = module.authorizeRole;
});

describe("role based access control", () => {
  it("allows a vendor to reach a vendor route", async () => {
    const { nextCalled } = await runMiddleware(
      signToken(["IT_VENDOR"]),
      "IT_VENDOR"
    );

    expect(nextCalled).toBe(true);
  });

  it("blocks a vendor from a hiring manager route", async () => {
    const { res, nextCalled } = await runMiddleware(
      signToken(["IT_VENDOR"]),
      "HIRING_MANAGER"
    );

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("HIRING_MANAGER");
  });

  it("blocks a hiring manager from a vendor route", async () => {
    const { res, nextCalled } = await runMiddleware(
      signToken(["HIRING_MANAGER"]),
      "IT_VENDOR"
    );

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("rejects a request without a token", async () => {
    const { res, nextCalled } = await runMiddleware(null, "IT_VENDOR");

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("rejects a token signed with another key", async () => {
    const otherKey = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    }).privateKey;

    const forged = jwt.sign(
      { sub: "user-1", realm_access: { roles: ["HIRING_MANAGER"] } },
      otherKey,
      { algorithm: "RS256", expiresIn: "1h" }
    );

    const { res, nextCalled } = await runMiddleware(forged, "HIRING_MANAGER");

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("rejects an unknown role name", async () => {
    const { res, nextCalled } = await runMiddleware(
      signToken(["IT_VENDOR"]),
      "SUPER_ADMIN"
    );

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });
});

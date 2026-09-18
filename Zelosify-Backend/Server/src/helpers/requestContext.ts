import { HttpError } from "./httpError.js";
import type { AuthenticatedRequest } from "../types/typeIndex.js";

export const getAuthContext = (req: AuthenticatedRequest) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenant?.tenantId;

  if (!userId || !tenantId) {
    throw new HttpError(401, "Authenticated user is missing tenant information");
  }

  return { userId, tenantId };
};

export const parseProfileId = (value: string): number => {
  const profileId = Number(value);

  if (!Number.isInteger(profileId) || profileId <= 0) {
    throw new HttpError(400, "Invalid profile id");
  }

  return profileId;
};

export const parseUploadTokens = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((token) => String(token));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((token) => String(token));
      }
    } catch {
      return [value];
    }
  }

  throw new HttpError(400, "uploadTokens is required");
};

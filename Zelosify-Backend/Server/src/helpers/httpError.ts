import type { Response } from "express";
import { logError } from "../utils/logger/structuredLogger.js";

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const sendErrorResponse = (
  res: Response,
  error: any,
  context: string
): void => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ status: "error", error: error.message });
    return;
  }

  logError("request.failed", { context, error: error?.message });
  res.status(500).json({ status: "error", error: "Internal server error" });
};

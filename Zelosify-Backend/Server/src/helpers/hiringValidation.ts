import Ajv from "ajv";
import { SUPPORTED_PROFILE_EXTENSIONS, getFileExtension } from "../utils/parsing/documentText.js";

const ajv = new Ajv({ allErrors: true });

const presignSchema = {
  type: "object",
  properties: {
    filenames: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: { type: "string", minLength: 3, maxLength: 200 },
    },
  },
  required: ["filenames"],
  additionalProperties: false,
};

const validatePresign = ajv.compile(presignSchema);

export interface ValidationOutcome {
  isValid: boolean;
  message?: string;
}

export const validatePresignBody = (body: any): ValidationOutcome => {
  const payload = body as { filenames?: string[] };

  if (!validatePresign(body)) {
    const message = (validatePresign.errors || [])
      .map((error) => `${error.instancePath || "body"} ${error.message}`)
      .join("; ");
    return { isValid: false, message };
  }

  const filenames = payload.filenames || [];
  const unsupported = filenames.filter(
    (name: string) => !SUPPORTED_PROFILE_EXTENSIONS.includes(getFileExtension(name))
  );

  if (unsupported.length > 0) {
    return {
      isValid: false,
      message: `Only PDF and PPTX profiles are allowed: ${unsupported.join(", ")}`,
    };
  }

  return { isValid: true };
};

export const parsePagination = (query: any) => {
  const page = Number(query?.page);
  const limit = Number(query?.limit);

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit > 0 && limit <= 50 ? limit : 10,
  };
};

export const getFileNameFromKey = (s3Key: string): string => {
  const lastSegment = s3Key.split("/").pop() || s3Key;
  return lastSegment.replace(/^\d+_/, "");
};

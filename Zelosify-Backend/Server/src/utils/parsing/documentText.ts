import pdfExtraction from "pdf-extraction";
import { extractTextFromPptx } from "./pptxReader.js";

export const SUPPORTED_PROFILE_EXTENSIONS = ["pdf", "pptx"];

export const getFileExtension = (name: string): string => {
  const parts = name.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
};

export const isSupportedProfileFile = (name: string): boolean =>
  SUPPORTED_PROFILE_EXTENSIONS.includes(getFileExtension(name));

export const extractDocumentText = async (
  buffer: Buffer,
  fileName: string
): Promise<string> => {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") {
    const parsed = await pdfExtraction(buffer);
    return (parsed?.text || "").trim();
  }

  if (extension === "pptx") {
    return extractTextFromPptx(buffer);
  }

  throw new Error(`Unsupported profile file type: ${extension || "unknown"}`);
};

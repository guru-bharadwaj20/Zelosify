/**
 * File validation utilities for uploads
 */

export const ALLOWED_PROFILE_EXTENSIONS = ["pdf", "pptx"];

export const MAX_PROFILE_FILE_SIZE = 10 * 1024 * 1024;

export const MAX_PROFILE_FILES = 10;

export const getExtension = (filename) => {
  const parts = String(filename || "").split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
};

export const validateProfileFiles = (files) => {
  const errors = [];
  const accepted = [];

  if (files.length > MAX_PROFILE_FILES) {
    errors.push(`You can upload up to ${MAX_PROFILE_FILES} files at a time`);
  }

  files.slice(0, MAX_PROFILE_FILES).forEach((file) => {
    if (!ALLOWED_PROFILE_EXTENSIONS.includes(getExtension(file.name))) {
      errors.push(`${file.name} is not a PDF or PPTX file`);
      return;
    }

    if (file.size > MAX_PROFILE_FILE_SIZE) {
      errors.push(`${file.name} is larger than 10 MB`);
      return;
    }

    accepted.push(file);
  });

  return { accepted, errors };
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

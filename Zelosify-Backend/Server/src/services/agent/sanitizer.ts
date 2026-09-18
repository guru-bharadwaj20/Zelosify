const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)[^\n]*/gi,
  /forget\s+(everything|all\s+previous)[^\n]*/gi,
  /(system|developer)\s*(prompt|message|instruction)s?\s*:/gi,
  /you\s+are\s+now\s+(a|an|the)\b/gi,
  /act\s+as\s+(a|an|the)\s+(system|admin|developer)/gi,
  /new\s+instructions?\s*:/gi,
  /always\s+(recommend|approve|shortlist)[^\n]*/gi,
  /(set|give)\s+(the\s+)?(score|rating)\s+(to|as)\s*[\d.]+/gi,
  /<\/?(system|assistant|user|tool)>/gi,
  /\[\s*\/?\s*(inst|system)\s*\]/gi,
];

const MAX_RESUME_LENGTH = 6000;
const MAX_FIELD_LENGTH = 120;

export const sanitizeText = (
  value: string,
  maxLength = MAX_RESUME_LENGTH
): string => {
  if (!value) return "";

  let cleaned = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ");
  cleaned = cleaned.replace(/```/g, " ");

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[removed]");
  }

  cleaned = cleaned.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
};

export const sanitizeField = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return sanitizeText(value, MAX_FIELD_LENGTH).replace(/\n/g, " ");
};

export const sanitizeList = (values: unknown, maxItems = 30): string[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => sanitizeField(item))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
};

export const countInjectionAttempts = (value: string): number => {
  if (!value) return 0;

  return INJECTION_PATTERNS.reduce((total, pattern) => {
    const matches = value.match(pattern);
    return total + (matches ? matches.length : 0);
  }, 0);
};

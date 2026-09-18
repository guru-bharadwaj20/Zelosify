import axios from "axios";

export interface LlmFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface LlmPart {
  text?: string;
  functionCall?: LlmFunctionCall;
  thoughtSignature?: string;
}

export interface LlmResult {
  parts: LlmPart[];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmRequest {
  systemInstruction: string;
  contents: any[];
  toolDeclarations: any[];
  timeoutMs: number;
}

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const getModelName = (): string =>
  process.env.GEMINI_MODEL || "gemini-3.6-flash";

export const isLlmConfigured = (): boolean =>
  Boolean(process.env.GEMINI_API_KEY);

export const callGemini = async ({
  systemInstruction,
  contents,
  toolDeclarations,
  timeoutMs,
}: LlmRequest): Promise<LlmResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await axios.post(
    `${BASE_URL}/${getModelName()}:generateContent`,
    {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      tools: [{ functionDeclarations: toolDeclarations }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 512,
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    {
      params: { key: apiKey },
      headers: { "Content-Type": "application/json" },
      timeout: timeoutMs,
    }
  );

  const candidate = response.data?.candidates?.[0];
  const usage = response.data?.usageMetadata || {};

  return {
    parts: candidate?.content?.parts || [],
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
    totalTokens:
      usage.totalTokenCount ||
      (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
  };
};

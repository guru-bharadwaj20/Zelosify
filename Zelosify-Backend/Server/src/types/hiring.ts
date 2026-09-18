export interface OpeningRequirement {
  openingId: string;
  title: string;
  location: string;
  contractType: string;
  requiredSkills: string[];
  experienceMin: number;
  experienceMax: number | null;
}

export interface ResumeExtract {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
}

export interface FeatureVector {
  experienceYears: number;
  skills: string[];
  location: string;
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
}

export interface MatchBreakdown {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ScoreBreakdown {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

export interface AgentDecision {
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
}

export interface AgentStep {
  step: number;
  action: string;
  durationMs: number;
  ok: boolean;
  error?: string;
}

export interface AgentState {
  resume?: ResumeExtract;
  features?: FeatureVector;
  match?: MatchBreakdown;
  score?: ScoreBreakdown;
}

export interface ToolContext {
  s3Key: string;
  requirement: OpeningRequirement;
  state: AgentState;
  timings: { parsingMs: number; matchingMs: number };
}

export interface AgentRunResult {
  decision: AgentDecision;
  score: ScoreBreakdown;
  featureVector: FeatureVector;
  steps: AgentStep[];
  tokensUsed: number;
  latencyMs: number;
  parsingMs: number;
  matchingMs: number;
  version: string;
  fallbackUsed: boolean;
}

export interface VendorOpeningRow {
  id: string;
  title: string;
  location: string | null;
  contractType: string | null;
  postedDate: Date;
  status: string;
  hiringManagerName: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

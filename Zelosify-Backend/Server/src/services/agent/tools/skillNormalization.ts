const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  ecmascript: "javascript",
  ts: "typescript",
  node: "node.js",
  nodejs: "node.js",
  "node js": "node.js",
  reactjs: "react",
  "react.js": "react",
  "react js": "react",
  nextjs: "next.js",
  "next js": "next.js",
  expressjs: "express",
  "express.js": "express",
  postgres: "postgresql",
  psql: "postgresql",
  mongo: "mongodb",
  "aws s3": "aws",
  "amazon web services": "aws",
  gcp: "google cloud",
  k8s: "kubernetes",
  "c sharp": "c#",
  dotnet: ".net",
  "asp.net": ".net",
  golang: "go",
  py: "python",
  restapi: "rest",
  "rest api": "rest",
  "rest apis": "rest",
  ci: "ci/cd",
  cd: "ci/cd",
  cicd: "ci/cd",
  ml: "machine learning",
  ai: "artificial intelligence",
  tf: "terraform",
  rdbms: "sql",
};

export const normalizeSkill = (skill: string): string => {
  const cleaned = String(skill || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return SKILL_ALIASES[cleaned] || cleaned;
};

export const normalizeSkills = (skills: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const skill of skills || []) {
    const normalized = normalizeSkill(skill);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
};

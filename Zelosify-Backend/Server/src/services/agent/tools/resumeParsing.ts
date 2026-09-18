import { ResumeExtract } from "../../../types/hiring.js";
import { normalizeSkills } from "./skillNormalization.js";

const KNOWN_SKILLS = [
  "javascript", "typescript", "python", "java", "go", "rust", "php", "ruby",
  "c++", "c#", ".net", "kotlin", "swift", "scala", "react", "angular", "vue",
  "next.js", "node.js", "express", "nestjs", "django", "flask", "fastapi",
  "spring boot", "spring", "graphql", "rest", "grpc", "postgresql", "mysql",
  "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "sql",
  "prisma", "sequelize", "hibernate", "aws", "azure", "google cloud", "docker",
  "kubernetes", "terraform", "jenkins", "ci/cd", "linux", "nginx", "kafka",
  "rabbitmq", "microservices", "html", "css", "tailwind", "sass", "redux",
  "jest", "vitest", "cypress", "selenium", "pytest", "junit", "machine learning",
  "deep learning", "artificial intelligence", "tensorflow", "pytorch", "pandas",
  "numpy", "spark", "hadoop", "airflow", "tableau", "power bi", "figma",
  "salesforce", "sap", "servicenow", "jira", "agile", "scrum", "devops",
  "security", "oauth", "jwt", "keycloak", "git", "github actions", "gitlab",
];

const KNOWN_LOCATIONS = [
  "remote", "bangalore", "bengaluru", "hyderabad", "chennai", "mumbai", "pune",
  "delhi", "new delhi", "noida", "gurgaon", "kolkata", "ahmedabad", "kochi",
  "coimbatore", "jaipur", "indore", "london", "new york", "san francisco",
  "seattle", "austin", "chicago", "toronto", "berlin", "amsterdam", "dublin",
  "singapore", "sydney", "dubai",
];

const EDUCATION_KEYWORDS = [
  "bachelor", "master", "b.tech", "btech", "b.e", "be ", "m.tech", "mtech",
  "mca", "bca", "b.sc", "m.sc", "mba", "phd", "diploma", "graduate",
];

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "has", "was",
  "were", "are", "into", "over", "using", "used", "work", "worked", "working",
  "team", "teams", "project", "projects", "experience", "years", "year",
  "responsible", "including", "role", "company", "client", "clients", "also",
  "developed", "built", "created", "managed", "based", "across", "within",
]);

export const extractExperienceYears = (text: string): number => {
  const lowered = text.toLowerCase();
  const values: number[] = [];

  const rangePattern = /(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*\+?\s*(?:years|yrs)/g;
  let rangeMatch = rangePattern.exec(lowered);
  while (rangeMatch) {
    values.push(Number(rangeMatch[2]));
    rangeMatch = rangePattern.exec(lowered);
  }

  const singlePattern = /(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years|yrs)/g;
  let singleMatch = singlePattern.exec(lowered);
  while (singleMatch) {
    values.push(Number(singleMatch[1]));
    singleMatch = singlePattern.exec(lowered);
  }

  if (values.length === 0) return 0;

  const highest = Math.max(...values.filter((value) => value <= 45));
  return Number.isFinite(highest) ? highest : 0;
};

export const extractSkills = (text: string): string[] => {
  const lowered = text.toLowerCase();
  const found = KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(lowered);
  });

  const sectionMatch = lowered.match(
    /(?:technical\s+)?skills?\s*[:\-]([^\n]{0,400})/
  );

  if (sectionMatch) {
    sectionMatch[1]
      .split(/[,|/•;]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1 && item.length < 30)
      .forEach((item) => found.push(item));
  }

  return Array.from(new Set(found)).slice(0, 40);
};

export const extractLocation = (text: string): string => {
  const lowered = text.toLowerCase();

  const labelled = lowered.match(/location\s*[:\-]\s*([a-z .,-]{2,40})/);
  if (labelled) {
    const value = labelled[1].split(",")[0].trim();
    if (value) return value;
  }

  const match = KNOWN_LOCATIONS.find((city) => lowered.includes(city));
  return match || "";
};

export const extractEducation = (text: string): string[] => {
  const lines = text.split(/\n+/);

  const matches = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 3 && line.length < 160)
    .filter((line) =>
      EDUCATION_KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword))
    );

  return Array.from(new Set(matches)).slice(0, 5);
};

export const extractKeywords = (text: string): string[] => {
  const counts = new Map<string, number>();

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
};

export const parseResumeText = (text: string): ResumeExtract => {
  const skills = extractSkills(text);

  return {
    experienceYears: extractExperienceYears(text),
    skills,
    normalizedSkills: normalizeSkills(skills),
    location: extractLocation(text),
    education: extractEducation(text),
    keywords: extractKeywords(text),
  };
};

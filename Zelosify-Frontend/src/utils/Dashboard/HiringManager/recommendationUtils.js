export const RECOMMENDATION_BADGES = {
  RECOMMENDED: {
    label: "Recommended",
    dotClass: "bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
    chipClass: "bg-green-50 dark:bg-green-900",
  },
  BORDERLINE: {
    label: "Borderline",
    dotClass: "bg-yellow-500",
    textClass: "text-yellow-700 dark:text-yellow-400",
    chipClass: "bg-yellow-50 dark:bg-yellow-900",
  },
  NOT_RECOMMENDED: {
    label: "Not Recommended",
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-400",
    chipClass: "bg-red-50 dark:bg-red-900",
  },
  NEEDS_REVIEW: {
    label: "Needs manual review",
    dotClass: "bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-400",
    chipClass: "bg-orange-50 dark:bg-orange-900",
  },
  PENDING: {
    label: "Scoring in progress",
    dotClass: "bg-gray-400",
    textClass: "text-gray-600 dark:text-gray-300",
    chipClass: "bg-gray-100 dark:bg-gray-800",
  },
};

export const getRecommendationBadge = (label) =>
  RECOMMENDATION_BADGES[label] || RECOMMENDATION_BADGES.PENDING;

export const toPercent = (value) => {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value * 100)}%`;
};

export const formatProcessingTime = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined) return "-";
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(2)} s`;
};

export const countByLabel = (profiles) =>
  profiles.reduce(
    (totals, profile) => {
      const key = profile.recommendationLabel || "PENDING";
      totals[key] = (totals[key] || 0) + 1;
      return totals;
    },
    { RECOMMENDED: 0, BORDERLINE: 0, NOT_RECOMMENDED: 0, NEEDS_REVIEW: 0, PENDING: 0 }
  );

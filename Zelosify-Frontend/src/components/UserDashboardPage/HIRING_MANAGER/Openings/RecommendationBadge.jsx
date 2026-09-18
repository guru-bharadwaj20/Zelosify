import { getRecommendationBadge } from "@/utils/Dashboard/HiringManager/recommendationUtils";

export default function RecommendationBadge({ label }) {
  const badge = getRecommendationBadge(label);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${badge.chipClass} ${badge.textClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
      {badge.label}
    </span>
  );
}

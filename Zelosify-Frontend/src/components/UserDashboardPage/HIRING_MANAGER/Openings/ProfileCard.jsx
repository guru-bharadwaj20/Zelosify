"use client";
import { Check, Eye, FileText, X } from "lucide-react";
import { formatDate } from "@/utils/Common/date";
import {
  toPercent,
  formatProcessingTime,
} from "@/utils/Dashboard/HiringManager/recommendationUtils";
import { formatStatusLabel } from "@/utils/Dashboard/Vendor/openingUtils";
import RecommendationBadge from "./RecommendationBadge";

export default function ProfileCard({
  profile,
  isPending,
  onShortlist,
  onReject,
  onPreview,
}) {
  const isDecided = profile.status !== "SUBMITTED";

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-secondary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {profile.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              Uploaded on {formatDate(profile.submittedAt)}
            </p>
          </div>
        </div>

        <RecommendationBadge label={profile.recommendationLabel} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="text-sm text-foreground">{toPercent(profile.score)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="text-sm text-foreground">
            {toPercent(profile.confidence)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Processing time</p>
          <p className="text-sm text-foreground">
            {formatProcessingTime(profile.processingTimeMs)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm text-foreground">
            {formatStatusLabel(profile.status)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground">
        {profile.explanation || "The recommendation is still being generated."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending || isDecided}
          onClick={() => onShortlist(profile.id)}
          className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Shortlist
        </button>

        <button
          type="button"
          disabled={isPending || isDecided}
          onClick={() => onReject(profile.id)}
          className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Reject
        </button>

        <button
          type="button"
          onClick={() => onPreview(profile.id)}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>
    </div>
  );
}

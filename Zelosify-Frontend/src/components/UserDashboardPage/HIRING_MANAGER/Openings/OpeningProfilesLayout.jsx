"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import useHiringManager from "@/hooks/Dashboard/HiringManager/useHiringManager";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ErrorComponent from "@/components/common/ErrorComponent";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/UI/shadcn/skeleton";
import {
  countByLabel,
  getRecommendationBadge,
} from "@/utils/Dashboard/HiringManager/recommendationUtils";
import { formatExperienceRange } from "@/utils/Dashboard/Vendor/openingUtils";
import VirtualProfileList from "./VirtualProfileList";

const FILTERS = ["ALL", "RECOMMENDED", "BORDERLINE", "NOT_RECOMMENDED"];

export default function OpeningProfilesLayout({ openingId }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const {
    selectedOpening,
    profiles,
    isProfilesLoading,
    pendingProfileId,
    error,
    handleFetchProfiles,
    handleShortlist,
    handleReject,
    handlePreviewProfile,
    handleClearError,
  } = useHiringManager();

  useEffect(() => {
    handleFetchProfiles(openingId);
  }, [openingId, handleFetchProfiles]);

  const retry = () => {
    handleClearError();
    handleFetchProfiles(openingId);
  };

  if (isProfilesLoading) {
    return (
      <div className="w-full space-y-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 lg:px-6">
        <ErrorComponent message={error} onRetry={retry} />
      </div>
    );
  }

  const totals = countByLabel(profiles);
  const visibleProfiles =
    filter === "ALL"
      ? profiles
      : profiles.filter((profile) => profile.recommendationLabel === filter);

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <button
        type="button"
        onClick={() => router.push("/hiring-manager/openings")}
        className="mb-4 flex items-center gap-2 text-sm text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my openings
      </button>

      <ErrorBoundary title="These profiles could not be displayed">
        {selectedOpening && (
          <div className="rounded-lg border border-border p-4">
            <h1 className="text-2xl font-bold text-foreground">
              {selectedOpening.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedOpening.location || "Location not specified"} ·{" "}
              {formatExperienceRange(
                selectedOpening.experienceRange?.min,
                selectedOpening.experienceRange?.max
              )}
            </p>

            {selectedOpening.requiredSkills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedOpening.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent px-3 py-1 text-xs text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((option) => {
              const badge = getRecommendationBadge(option);
              const count =
                option === "ALL" ? profiles.length : totals[option] || 0;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    filter === option
                      ? "border-ring text-foreground bg-accent"
                      : "border-border text-secondary"
                  }`}
                >
                  {option === "ALL" ? "All" : badge.label} ({count})
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-4">
          {visibleProfiles.length === 0 ? (
            <EmptyState
              title="No profiles to review"
              message="Profiles submitted by vendors for this opening will appear here."
            />
          ) : (
            <VirtualProfileList
              profiles={visibleProfiles}
              pendingProfileId={pendingProfileId}
              onShortlist={handleShortlist}
              onReject={handleReject}
              onPreview={handlePreviewProfile}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}

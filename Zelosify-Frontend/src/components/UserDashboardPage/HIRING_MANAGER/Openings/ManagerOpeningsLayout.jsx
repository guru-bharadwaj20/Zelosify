"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useHiringManager from "@/hooks/Dashboard/HiringManager/useHiringManager";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ErrorComponent from "@/components/common/ErrorComponent";
import EmptyState from "@/components/common/EmptyState";
import OpeningsTableSkeleton from "@/components/UserDashboardPage/IT_VENDOR/Openings/OpeningsTableSkeleton";
import { formatDate } from "@/utils/Common/date";
import {
  formatExperienceRange,
  formatStatusLabel,
  getStatusClasses,
} from "@/utils/Dashboard/Vendor/openingUtils";

export default function ManagerOpeningsLayout() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const {
    openings,
    pagination,
    isLoading,
    error,
    handleFetchOpenings,
    handleClearError,
  } = useHiringManager();

  useEffect(() => {
    handleFetchOpenings({ page, limit: 10 });
  }, [page, handleFetchOpenings]);

  const retry = () => {
    handleClearError();
    handleFetchOpenings({ page, limit: 10 });
  };

  const openProfiles = (openingId) => {
    router.push(`/hiring-manager/openings/${openingId}`);
  };

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Openings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the profiles submitted for the openings you own.
        </p>
      </div>

      <ErrorBoundary title="Your openings could not be displayed">
        {isLoading && <OpeningsTableSkeleton />}

        {!isLoading && error && (
          <ErrorComponent message={error} onRetry={retry} />
        )}

        {!isLoading && !error && openings.length === 0 && (
          <EmptyState
            title="No openings assigned"
            message="You do not own any contract openings at the moment."
          />
        )}

        {!isLoading && !error && openings.length > 0 && (
          <>
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-tableHeader">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Posted Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Profiles
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openings.map((opening) => (
                    <tr
                      key={opening.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open profiles for ${opening.title}`}
                      className="border-b border-border hover:bg-tableHeader cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                      onClick={() => openProfiles(opening.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") openProfiles(opening.id);
                      }}
                    >
                      <td className="px-4 py-4 text-sm text-foreground">
                        {opening.title}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {opening.location || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {formatExperienceRange(
                          opening.experienceMin,
                          opening.experienceMax
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {formatDate(opening.postedDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {opening.profilesCount}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(
                            opening.status
                          )}`}
                        >
                          {formatStatusLabel(opening.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} openings
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </ErrorBoundary>
    </div>
  );
}

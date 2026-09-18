"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useVendorOpenings from "@/hooks/Dashboard/Vendor/useVendorOpenings";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ErrorComponent from "@/components/common/ErrorComponent";
import EmptyState from "@/components/common/EmptyState";
import OpeningsTable from "./OpeningsTable";
import OpeningsTableSkeleton from "./OpeningsTableSkeleton";

export default function OpeningsLayout() {
  const [page, setPage] = useState(1);
  const {
    openings,
    pagination,
    isLoading,
    error,
    handleFetchOpenings,
    handleClearError,
  } = useVendorOpenings();

  useEffect(() => {
    handleFetchOpenings({ page, limit: 10 });
  }, [page, handleFetchOpenings]);

  const retry = () => {
    handleClearError();
    handleFetchOpenings({ page, limit: 10 });
  };

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Contract Openings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the openings published by your organisation and submit
          candidate profiles.
        </p>
      </div>

      <ErrorBoundary title="The openings list could not be displayed">
        {isLoading && <OpeningsTableSkeleton />}

        {!isLoading && error && (
          <ErrorComponent message={error} onRetry={retry} />
        )}

        {!isLoading && !error && openings.length === 0 && (
          <EmptyState
            title="No openings yet"
            message="There are no contract openings published for your tenant right now."
          />
        )}

        {!isLoading && !error && openings.length > 0 && (
          <>
            <OpeningsTable openings={openings} />

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

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import useVendorOpenings from "@/hooks/Dashboard/Vendor/useVendorOpenings";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ErrorComponent from "@/components/common/ErrorComponent";
import { Skeleton } from "@/components/UI/shadcn/skeleton";
import { formatDate } from "@/utils/Common/date";
import {
  formatExperienceRange,
  formatStatusLabel,
  getStatusClasses,
} from "@/utils/Dashboard/Vendor/openingUtils";
import ProfileUploader from "./ProfileUploader";
import UploadedProfiles from "./UploadedProfiles";

export default function OpeningDetailsLayout({ openingId }) {
  const router = useRouter();
  const {
    selectedOpening,
    isDetailsLoading,
    isUploading,
    error,
    uploadError,
    handleFetchOpeningDetails,
    handleUploadProfiles,
    handleDeleteProfile,
    handlePreviewProfile,
    handleClearError,
  } = useVendorOpenings();

  useEffect(() => {
    handleFetchOpeningDetails(openingId);
  }, [openingId, handleFetchOpeningDetails]);

  const retry = () => {
    handleClearError();
    handleFetchOpeningDetails(openingId);
  };

  const uploadProfiles = (files) => handleUploadProfiles(openingId, files);

  if (isDetailsLoading) {
    return (
      <div className="w-full space-y-4 px-4 py-6 lg:px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
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

  if (!selectedOpening) {
    return null;
  }

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <button
        type="button"
        onClick={() => router.push("/vendor/openings")}
        className="mb-4 flex items-center gap-2 text-sm text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to openings
      </button>

      <ErrorBoundary title="This opening could not be displayed">
        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {selectedOpening.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Hiring manager: {selectedOpening.hiringManagerName}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(
                selectedOpening.status
              )}`}
            >
              {formatStatusLabel(selectedOpening.status)}
            </span>
          </div>

          {selectedOpening.description && (
            <p className="mt-4 text-sm text-foreground">
              {selectedOpening.description}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="text-sm text-foreground">
                {selectedOpening.location || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Contract type</dt>
              <dd className="text-sm text-foreground">
                {selectedOpening.contractType || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Experience</dt>
              <dd className="text-sm text-foreground">
                {formatExperienceRange(
                  selectedOpening.experienceRange?.min,
                  selectedOpening.experienceRange?.max
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Posted on</dt>
              <dd className="text-sm text-foreground">
                {formatDate(selectedOpening.postedDate)}
              </dd>
            </div>
          </dl>

          {selectedOpening.requiredSkills?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Required skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedOpening.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent px-3 py-1 text-xs text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProfileUploader
            onUpload={uploadProfiles}
            isUploading={isUploading}
            uploadError={uploadError}
          />

          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Your submitted profiles ({selectedOpening.profilesCount || 0})
            </h2>
            <UploadedProfiles
              profiles={selectedOpening.profiles || []}
              onPreview={handlePreviewProfile}
              onDelete={handleDeleteProfile}
            />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

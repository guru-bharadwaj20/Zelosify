"use client";
import { Eye, Trash2, FileText } from "lucide-react";
import { formatDate } from "@/utils/Common/date";
import {
  formatStatusLabel,
  getProfileStatusClasses,
} from "@/utils/Dashboard/Vendor/openingUtils";
import EmptyState from "@/components/common/EmptyState";

export default function UploadedProfiles({ profiles, onPreview, onDelete }) {
  if (profiles.length === 0) {
    return (
      <EmptyState
        title="No profiles submitted"
        message="Profiles you submit for this opening will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {profile.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted on {formatDate(profile.submittedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getProfileStatusClasses(
                profile.status
              )}`}
            >
              {formatStatusLabel(profile.status)}
            </span>

            <button
              type="button"
              aria-label={`Preview ${profile.fileName}`}
              onClick={() => onPreview(profile.id)}
              className="rounded p-1.5 text-secondary hover:bg-accent"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label={`Remove ${profile.fileName}`}
              onClick={() => onDelete(profile.id)}
              className="rounded p-1.5 cancel-red hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

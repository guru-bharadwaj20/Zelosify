"use client";
import { useEffect } from "react";
import ErrorComponent from "@/components/common/ErrorComponent";

export default function HiringManagerError({ error, reset }) {
  useEffect(() => {
    console.error("Hiring manager route error:", error);
  }, [error]);

  return (
    <div className="w-full px-4 py-6 lg:px-6">
      <ErrorComponent
        title="This page could not be loaded"
        message={error?.message || "Please try again."}
        onRetry={reset}
      />
    </div>
  );
}

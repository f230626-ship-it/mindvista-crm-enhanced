"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portal error:", error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Failed to load page"
      message={error.message || "We couldn't load this page. Your data is safe — please try again."}
      reset={reset}
    />
  );
}

"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <ErrorDisplay
          title="Application error"
          message={error.message || "A critical error occurred. Please refresh the page."}
          reset={reset}
        />
      </body>
    </html>
  );
}

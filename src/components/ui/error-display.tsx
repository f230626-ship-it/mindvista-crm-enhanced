"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  reset,
}: {
  title?: string;
  message?: string;
  reset?: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 animate-fade-in">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-center gap-3">
            {reset && (
              <Button onClick={reset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
            <Link href="/dashboard" className="inline-flex">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

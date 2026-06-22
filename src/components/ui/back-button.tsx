"use client";

import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={cn(buttonVariants({ variant: "outline" }))}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Go Back
    </button>
  );
}

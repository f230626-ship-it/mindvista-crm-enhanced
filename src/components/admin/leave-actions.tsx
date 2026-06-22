"use client";

import { useState } from "react";
import { reviewLeave } from "@/actions/leaves";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function LeaveActions({ leaveId }: { leaveId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleReview(status: "approved" | "rejected") {
    setLoading(status === "approved" ? "approve" : "reject");
    const result = await reviewLeave(leaveId, status);
    setLoading(null);

    if (result.error) toast.error(result.error);
    else toast.success(`Leave ${status}`);
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-green-600"
        onClick={() => handleReview("approved")}
        disabled={loading !== null}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600"
        onClick={() => handleReview("rejected")}
        disabled={loading !== null}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

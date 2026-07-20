"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { autoCalculateGoals } from "@/actions/performance";
import { toast } from "sonner";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    const result = await autoCalculateGoals();
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Recalculated ${result.updated} goals (${result.metrics} from live data)`);
      window.location.reload();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={loading}
      className="gap-1.5 text-xs"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing..." : "Refresh metrics"}
    </Button>
  );
}

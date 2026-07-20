"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { autoCalculateGoals } from "@/actions/performance";
import { toast } from "sonner";

export function AdminRefreshButton() {
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
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={loading}
      className="gap-1.5"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing..." : "Recalculate all"}
    </Button>
  );
}

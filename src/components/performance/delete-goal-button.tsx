"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteGoal } from "@/actions/performance";
import { toast } from "sonner";

export function DeleteGoalButton({ goalId }: { goalId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this goal?")) return;
    setLoading(true);
    const result = await deleteGoal(goalId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Goal deleted");
      window.location.reload();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

"use client";

import { useState } from "react";
import { deleteHoliday } from "@/actions/holidays";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteHolidayButton({ holidayId }: { holidayId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this holiday?")) return;
    setLoading(true);
    const result = await deleteHoliday(holidayId);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else toast.success("Holiday deleted");
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

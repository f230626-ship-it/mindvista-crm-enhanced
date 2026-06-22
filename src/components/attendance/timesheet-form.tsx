"use client";

import { useState } from "react";
import { addTimesheet } from "@/actions/attendance";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export function TimesheetForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await addTimesheet(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Timesheet entry added");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        <Plus className="mr-2 h-4 w-4" />
        Log Time
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Task Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task_description">Task Description</Label>
            <Textarea id="task_description" name="task_description" rows={2} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input id="hours" name="hours" type="number" step="0.5" min="0.5" max="24" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Add Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

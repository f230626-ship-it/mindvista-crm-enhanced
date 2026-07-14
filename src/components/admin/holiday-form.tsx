"use client";

import { useState } from "react";
import { createHoliday } from "@/actions/holidays";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, CalendarDays } from "lucide-react";

export function HolidayForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createHoliday(new FormData(e.currentTarget));
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Holiday added successfully");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "gap-2")}>
        <Plus className="h-4 w-4" />
        Add Holiday
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add Company Holiday</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This will be excluded from leave calculations
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
              Holiday Name
            </Label>
            <Input id="name" name="name" placeholder="e.g. Independence Day" required className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">
              Date
            </Label>
            <Input id="date" name="date" type="date" required className="h-9 font-mono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea id="description" name="description" rows={2} placeholder="Brief description of the holiday..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-9 gap-2">
              {loading ? "Adding..." : "Add Holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

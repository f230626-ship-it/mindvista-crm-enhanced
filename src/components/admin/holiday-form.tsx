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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

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
      toast.success("Holiday added");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add Holiday
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Company Holiday</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Holiday Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Holiday"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { createGoal, submitReview } from "@/actions/performance";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Star } from "lucide-react";
import type { Employee } from "@/types/database";

export function GoalForm({ employees }: { employees: Pick<Employee, "id" | "full_name">[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("employee_id", employeeId);
    const result = await createGoal(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Goal created");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        <Plus className="mr-2 h-4 w-4" />
        Add Goal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Performance Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input id="target_date" name="target_date" type="date" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !employeeId}>
            {loading ? "Creating..." : "Create Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewForm({ employees }: { employees: Pick<Employee, "id" | "full_name">[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [rating, setRating] = useState("3");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("employee_id", employeeId);
    formData.set("rating", rating);
    const result = await submitReview(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Review submitted");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Star className="mr-2 h-4 w-4" />
        Submit Review
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Performance Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review_period">Review Period</Label>
            <Input id="review_period" name="review_period" placeholder="Q1 2026" required />
          </div>
          <div className="space-y-2">
            <Label>Rating (1-5)</Label>
            <Select value={rating} onValueChange={(v) => setRating(v ?? "3")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} - {["Poor", "Below Average", "Average", "Good", "Excellent"][n - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strengths">Strengths</Label>
            <Textarea id="strengths" name="strengths" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weaknesses">Weaknesses</Label>
            <Textarea id="weaknesses" name="weaknesses" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="improvement_areas">Improvement Areas</Label>
            <Textarea id="improvement_areas" name="improvement_areas" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !employeeId}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

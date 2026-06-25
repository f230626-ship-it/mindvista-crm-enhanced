"use client";

import { useState } from "react";
import { assignResource } from "@/actions/projects";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import type { Employee, ProjectResource } from "@/types/database";

interface ResourceAssignmentDialogProps {
  projectId: string;
  employees: Employee[];
  existingAssignment?: ProjectResource;
}

const RESOURCE_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Designer",
  "QA",
  "AI Engineer",
  "DevOps",
  "Project Manager",
];

export function ResourceAssignmentDialog({
  projectId,
  employees,
  existingAssignment,
}: ResourceAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [employeeId, setEmployeeId] = useState(existingAssignment?.employee_id || "");
  const [role, setRole] = useState(existingAssignment?.role || RESOURCE_ROLES[0]);
  const [allocation, setAllocation] = useState(existingAssignment?.allocation_percentage || 100);
  const [startDate, setStartDate] = useState(existingAssignment?.start_date || "");
  const [endDate, setEndDate] = useState(existingAssignment?.end_date || "");

  const isEditing = !!existingAssignment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!employeeId || !role || !startDate || !endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await assignResource(projectId, {
        employeeId,
        role,
        allocationPercentage: Number(allocation),
        startDate,
        endDate,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Allocation updated!" : "Resource assigned successfully!");
        setOpen(false);
        if (!isEditing) {
          // Clear form for next insert
          setEmployeeId("");
          setStartDate("");
          setEndDate("");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          isEditing
            ? "flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted cursor-pointer transition-colors"
            : cn(buttonVariants({ size: "sm" }), "pm-btn-primary text-primary-foreground cursor-pointer")
        }
      >
        {isEditing ? (
          <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
        ) : (
          <>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign Resource
          </>
        )}
      </DialogTrigger>
      <DialogContent className="pm-glass-dialog sm:max-w-md">
        <DialogHeader className="pb-2 border-b border-border/40">
          <DialogTitle className="text-lg font-bold">{isEditing ? "Edit Assignment" : "Assign Resource"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Employee selection (disabled if editing) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Employee</Label>
            {isEditing ? (
              <Input
                value={employees.find((e) => e.id === employeeId)?.full_name || ""}
                disabled
                className="pm-input"
              />
            ) : (
              <Select value={employeeId} onValueChange={(val) => setEmployeeId(val || "")}>
                <SelectTrigger className="pm-select-trigger">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Allocation Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val || RESOURCE_ROLES[0])}>
              <SelectTrigger className="pm-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allocation Percentage */}
          <div className="space-y-1.5">
            <Label htmlFor="allocation" className="text-xs font-semibold text-muted-foreground">Allocation Percentage (%)</Label>
            <Input
              id="allocation"
              type="number"
              min="1"
              max="100"
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              required
              className="pm-input font-mono"
            />
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date" className="text-xs font-semibold text-muted-foreground">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="pm-input text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date" className="text-xs font-semibold text-muted-foreground">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="pm-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="pm-btn-outline">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="pm-btn-primary text-primary-foreground">
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Assign Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

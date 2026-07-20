"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignResource, updateResource } from "@/actions/projects";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { Employee, ProjectResource } from "@/types/database";

interface TeamMember {
  employee_id: string;
  employee?: { full_name: string; email: string; designation?: string } | null;
}

interface Team {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  members?: TeamMember[];
}

interface ResourceAssignmentDialogProps {
  projectId: string;
  employees: Employee[];
  existingAssignment?: ProjectResource;
  teams?: Team[];
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
  teams = [],
}: ResourceAssignmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"individual" | "team">("individual");

  const [employeeId, setEmployeeId] = useState(existingAssignment?.employee_id || "");
  const [role, setRole] = useState(existingAssignment?.role || RESOURCE_ROLES[0]);
  const [allocation, setAllocation] = useState(existingAssignment?.allocation_percentage || 100);
  const [startDate, setStartDate] = useState(existingAssignment?.start_date || "");
  const [endDate, setEndDate] = useState(existingAssignment?.end_date || "");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const isEditing = !!existingAssignment;

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp?.full_name || emp?.email || emp?.employee_code || "Unknown";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mode === "team") {
      if (!selectedTeamId || !role || !startDate || !endDate) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const team = teams.find((t) => t.id === selectedTeamId);
      if (!team?.members?.length) {
        toast.error("Selected team has no members.");
        return;
      }

      setLoading(true);
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const member of team.members) {
          const result = await assignResource(projectId, {
            employeeId: member.employee_id,
            role,
            allocationPercentage: Number(allocation),
            startDate,
            endDate,
          });
          if (result.error) {
            errorCount++;
          } else {
            successCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} team member${successCount !== 1 ? "s" : ""} assigned!${errorCount > 0 ? ` (${errorCount} failed)` : ""}`);
          setOpen(false);
          router.refresh();
        } else {
          toast.error("Failed to assign team members. They may already be assigned.");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!employeeId || !role || !startDate || !endDate) {
        toast.error("Please fill in all required fields.");
        return;
      }

      setLoading(true);
      try {
        let result;
        if (isEditing && existingAssignment) {
          result = await updateResource(existingAssignment.id, {
            role,
            allocationPercentage: Number(allocation),
            startDate,
            endDate,
          });
        } else {
          result = await assignResource(projectId, {
            employeeId,
            role,
            allocationPercentage: Number(allocation),
            startDate,
            endDate,
          });
        }

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(isEditing ? "Assignment updated!" : "Resource assigned successfully!");
          setOpen(false);
          router.refresh();
          if (!isEditing) {
            setEmployeeId("");
            setStartDate("");
            setEndDate("");
            setAllocation(100);
          }
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
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

        {/* Mode toggle */}
        {!isEditing && teams.length > 0 && (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant={mode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("individual")}
              className="flex-1"
            >
              Individual
            </Button>
            <Button
              type="button"
              variant={mode === "team" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("team")}
              className="flex-1"
            >
              <UsersRound className="mr-1 h-3.5 w-3.5" />
              Assign Team
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {mode === "team" && !isEditing ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Team</Label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                className="pm-select-trigger flex w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                style={{ colorScheme: "dark" }}
              >
                <option value="" disabled className="bg-background text-muted-foreground">Select Team</option>
                {teams.filter((t) => t.members && t.members.length > 0).map((t) => (
                  <option key={t.id} value={t.id} className="bg-background text-foreground">
                    {t.name} ({t.members?.length ?? 0} members)
                  </option>
                ))}
              </select>
              {selectedTeamId && (
                <p className="text-xs text-muted-foreground mt-1">
                  All team members will be assigned to this project.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Employee</Label>
              {isEditing ? (
                <Input
                  value={getEmployeeName(employeeId)}
                  disabled
                  className="pm-input"
                />
              ) : (
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  className="pm-select-trigger flex w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" disabled className="bg-background text-muted-foreground">Select Employee</option>
                  {employees
                    .filter((emp) => emp.status === "active")
                    .map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-background text-foreground">
                        {emp.full_name || emp.email || emp.employee_code || "Unknown"}
                      </option>
                    ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="pm-select-trigger flex w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              style={{ colorScheme: "dark" }}
            >
              {RESOURCE_ROLES.map((r) => (
                <option key={r} value={r} className="bg-background text-foreground">{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="allocation" className="text-xs font-semibold text-muted-foreground">Allocation %</Label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {loading ? "Saving..." : isEditing ? "Save Changes" : mode === "team" ? "Assign Team" : "Assign Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

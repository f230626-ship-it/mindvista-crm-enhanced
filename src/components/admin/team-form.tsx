"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createTeam, updateTeam } from "@/actions/teams";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Search, X, Users, UserCheck } from "lucide-react";
import { TEAM_STATUS_LABELS } from "@/lib/constants";
import type { Team, Employee } from "@/types/database";

interface TeamFormProps {
  team?: Team & { members?: { employee_id: string; role: string }[] };
  employees: Pick<
    Employee,
    | "id"
    | "full_name"
    | "email"
    | "designation"
    | "employee_code"
    | "profile_photo_url"
    | "department_id"
    | "role"
    | "status"
  >[];
}

const TEAM_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

export function TeamForm({ team, employees }: TeamFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [leadId, setLeadId] = useState(team?.lead_id ?? "");
  const [status, setStatus] = useState<string>(team?.status ?? "active");
  const [color, setColor] = useState(team?.color ?? TEAM_COLORS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(team?.members?.map((m) => m.employee_id) ?? [])
  );
  const [memberSearch, setMemberSearch] = useState("");

  const isEdit = !!team;

  const filteredEmployees = useMemo(() => {
    if (!memberSearch.trim()) return employees;
    const q = memberSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q)
    );
  }, [employees, memberSearch]);

  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedMemberIds.has(e.id)),
    [employees, selectedMemberIds]
  );

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function removeMember(id: string) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (leadId === id) setLeadId("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Team name must be at least 2 characters.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("description", description.trim());
      formData.set("lead_id", leadId);
      formData.set("status", status);
      formData.set("color", color);
      selectedMemberIds.forEach((id) => formData.append("member_ids", id));

      const result = isEdit
        ? await updateTeam(team!.id, formData)
        : await createTeam(formData);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      toast.success(isEdit ? "Team updated successfully" : "Team created successfully");
      router.push("/admin/teams");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)} disabled={isPending}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Team Color</Label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={leadId}
            onValueChange={(v) => setLeadId(v ?? "")}
            disabled={isPending}
            items={employees
              .filter((e) => e.status === "active")
              .map((emp) => ({ value: emp.id, label: `${emp.full_name} — ${emp.designation}` }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a team lead (optional)" />
            </SelectTrigger>
            <SelectContent>
              {employees
                .filter((e) => e.status === "active")
                .map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} — {emp.designation}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            The team lead is automatically added as a member.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
            {selectedMemberIds.size > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {selectedMemberIds.size} selected
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, designation, or employee code..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9"
              disabled={isPending}
            />
          </div>

          {/* Selected members */}
          {selectedEmployees.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <UserCheck className="inline h-4 w-4 mr-1" />
                Selected Members
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium">{emp.full_name}</span>
                    {leadId === emp.id && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold">
                        LEAD
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMember(emp.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee list */}
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No employees found
              </div>
            ) : (
              <div className="divide-y">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedMemberIds.has(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleMember(emp.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(emp.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.designation} {emp.employee_code ? `• #${emp.employee_code}` : ""}
                        </p>
                      </div>
                      {leadId === emp.id && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold">
                          LEAD
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              {isEdit ? "Updating..." : "Creating..."}
            </span>
          ) : isEdit ? (
            "Update Team"
          ) : (
            "Create Team"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/teams")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

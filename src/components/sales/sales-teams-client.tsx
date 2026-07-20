"use client";

import { useState } from "react";
import { createSalesTeam, addTeamMember, removeTeamMember, archiveSalesTeam } from "@/actions/sales-teams";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, UserMinus, Archive, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { SalesTeam, SalesTeamMember } from "@/types/database";

type Employee = { id: string; full_name: string; email: string; designation: string; employee_code: string; pm_role: string };

interface TeamWithMembers extends Omit<SalesTeam, "members"> {
  members?: (SalesTeamMember & {
    employee?: { id: string; full_name: string; email: string; designation: string; employee_code: string };
  })[];
}

export function SalesTeamsClient({
  teams: initialTeams,
  employees,
  error,
}: {
  teams: TeamWithMembers[];
  employees: Employee[];
  error: string | null;
}) {
  const [teams, setTeams] = useState(initialTeams);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", team_lead_id: "", member_ids: [] as string[] });

  function toggleMember(employeeId: string) {
    setNewTeam((t) => ({
      ...t,
      member_ids: t.member_ids.includes(employeeId)
        ? t.member_ids.filter((id) => id !== employeeId)
        : [...t.member_ids, employeeId],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("name", newTeam.name);
    formData.set("description", newTeam.description);
    formData.set("team_lead_id", newTeam.team_lead_id);
    formData.set("member_ids", JSON.stringify(newTeam.member_ids));
    const result = await createSalesTeam(formData);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Team created");
      setCreateOpen(false);
      setNewTeam({ name: "", description: "", team_lead_id: "", member_ids: [] });
      window.location.reload();
    }
  }

  async function handleAddMember(teamId: string, employeeId: string) {
    if (!employeeId) return;
    const result = await addTeamMember(teamId, employeeId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Member added");
      window.location.reload();
    }
  }

  async function handleRemoveMember(teamId: string, employeeId: string) {
    const result = await removeTeamMember(teamId, employeeId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Member removed");
      window.location.reload();
    }
  }

  async function handleArchive(teamId: string) {
    const result = await archiveSalesTeam(teamId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Team archived");
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    }
  }

  function getMemberIds(team: TeamWithMembers) {
    return new Set(team.members?.map((m) => m.employee_id) ?? []);
  }

  function getAvailableEmployees(team: TeamWithMembers) {
    const memberIds = getMemberIds(team);
    return employees.filter((e) => !memberIds.has(e.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sales Teams</h2>
          <p className="text-sm text-muted-foreground">
            {teams.length} team{teams.length !== 1 ? "s" : ""} · {employees.length} employees available
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Team
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-card/50">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No sales teams yet. Create your first team.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]">
          {teams.map((team) => {
            const available = getAvailableEmployees(team);
            return (
              <Card key={team.id} className="border-border/60 bg-card/70">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>{team.description || "No description"}</CardDescription>
                    </div>
                    <Badge variant={team.status === "active" ? "default" : "outline"}>
                      {team.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Lead: <span className="font-medium text-foreground">{team.team_lead?.full_name ?? "None"}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {team.members?.length ?? 0} member{(team.members?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {team.members && team.members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map((m) => (
                        <Badge key={m.id} variant="outline" className="text-xs gap-1 pr-1">
                          {m.employee?.full_name ?? "Unknown"}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(team.id, m.employee_id)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <UserMinus className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {available.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(v) => v && handleAddMember(team.id, v)}
                      items={available.map((e) => ({ value: e.id, label: `${e.full_name} — ${e.designation}` }))}
                    >
                      <SelectTrigger className="h-9 text-xs w-full">
                        <SelectValue placeholder="Add member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((e) => (
                          <SelectItem key={e.id} value={e.id} className="text-xs">
                            {e.full_name} — {e.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(team.id)}
                      className="gap-1"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sales Team</DialogTitle>
            <DialogDescription>Add a new outreach team and assign a lead.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team name *</Label>
              <Input
                id="team-name"
                value={newTeam.name}
                onChange={(e) => setNewTeam((t) => ({ ...t, name: e.target.value }))}
                placeholder="e.g. Enterprise Outreach"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">Description</Label>
              <Textarea
                id="team-desc"
                value={newTeam.description}
                onChange={(e) => setNewTeam((t) => ({ ...t, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Team Lead</Label>
              <Select
                value={newTeam.team_lead_id}
                onValueChange={(v) => setNewTeam((t) => ({ ...t, team_lead_id: v ?? "" }))}
                items={[{ value: "", label: "None" }, ...employees.map((e) => ({ value: e.id, label: `${e.full_name} — ${e.designation}` }))]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} — {e.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {employees.filter((e) => e.id !== newTeam.team_lead_id).map((e) => (
                  <label
                    key={e.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newTeam.member_ids.includes(e.id)}
                      onChange={() => toggleMember(e.id)}
                      className="rounded border-input"
                    />
                    <span className="flex-1">{e.full_name}</span>
                    <span className="text-xs text-muted-foreground">{e.designation}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{newTeam.member_ids.length} member{newTeam.member_ids.length !== 1 ? "s" : ""} selected</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

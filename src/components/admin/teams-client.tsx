"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Crown,
  Archive,
  Trash2,
  RotateCcw,
  Eye,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import {
  TEAM_STATUS_LABELS,
  TEAM_STATUS_COLORS,
} from "@/lib/constants";
import { archiveTeam, restoreTeam, deleteTeam } from "@/actions/teams";

interface TeamWithCount {
  id: string;
  name: string;
  code: string;
  description: string | null;
  lead_id: string | null;
  status: string;
  color: string | null;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead?: { id: string; full_name: string; email: string; profile_photo_url: string | null } | null;
  creator?: { id: string; full_name: string } | null;
  member_count?: number;
  members?: { employee?: { status?: string } | null; role?: string; employee_id?: string }[];
}

export function TeamsClient({ teams }: { teams: TeamWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamWithCount | null>(null);

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teams, search, statusFilter]);

  function handleArchive(team: TeamWithCount) {
    startTransition(async () => {
      const result = await archiveTeam(team.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${team.name}" archived`);
        router.refresh();
      }
    });
  }

  function handleRestore(team: TeamWithCount) {
    startTransition(async () => {
      const result = await restoreTeam(team.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${team.name}" restored`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!teamToDelete) return;
    startTransition(async () => {
      const result = await deleteTeam(teamToDelete.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${teamToDelete.name}" deleted`);
        setDeleteDialogOpen(false);
        setTeamToDelete(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive", "archived"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : TEAM_STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <Card className="pt-0">
          <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 py-(--card-spacing) px-4 rounded-t-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <Circle className="h-3 w-3 fill-green-500" />
              Active Teams
            </div>
          </div>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold">
              {teams.filter((t) => t.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="pt-0">
          <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 py-(--card-spacing) px-4 rounded-t-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
              <Archive className="h-3 w-3" />
              Archived
            </div>
          </div>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold">
              {teams.filter((t) => t.status === "archived").length}
            </p>
          </CardContent>
        </Card>
        <Card className="pt-0">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 py-(--card-spacing) px-4 rounded-t-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <Users className="h-3 w-3" />
              Total Members
            </div>
          </div>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold">
              {teams.reduce((sum, t) => sum + (t.member_count ?? 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No teams found</h3>
                <p className="text-sm text-muted-foreground">
                  {teams.length === 0
                    ? "Create your first team to get started"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
              {teams.length === 0 && (
                <Link href="/admin/teams/new">
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
          {filtered.map((team) => (
            <Card
              key={team.id}
              className={`group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
                team.status === "archived" ? "opacity-60" : ""
              }`}
            >
              {/* Color bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: team.color || "#3B82F6" }}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {team.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {team.code}
                    </p>
                  </div>
                  <Badge
                    className={TEAM_STATUS_COLORS[team.status] ?? ""}
                  >
                    {TEAM_STATUS_LABELS[team.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Lead */}
                {team.lead && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span className="font-medium truncate">
                      {team.lead.full_name}
                    </span>
                  </div>
                )}

                {/* Member avatars */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.members
                      ?.filter((m) => m.employee?.status === "active")
                      .slice(0, 5)
                      .map((m, i) => {
                        const emp = m.employee as any;
                        const initials = emp?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                        return (
                          <Avatar
                            key={i}
                            className="h-8 w-8 border-2 border-background"
                          >
                            <AvatarImage src={emp?.profile_photo_url} />
                            <AvatarFallback className="text-[10px]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {team.member_count ?? 0} members
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/teams/${team.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  {team.status !== "archived" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchive(team)}
                      disabled={isPending}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(team)}
                      disabled={isPending}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setTeamToDelete(team);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{teamToDelete?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

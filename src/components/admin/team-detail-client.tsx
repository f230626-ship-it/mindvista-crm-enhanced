"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Crown,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Mail,
  Briefcase,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  TEAM_STATUS_LABELS,
  TEAM_STATUS_COLORS,
  ROLE_LABELS,
} from "@/lib/constants";
import {
  archiveTeam,
  restoreTeam,
  deleteTeam,
} from "@/actions/teams";

interface TeamDetailProps {
  team: any;
}

export function TeamDetailClient({ team }: TeamDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleArchive() {
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

  function handleRestore() {
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
    startTransition(async () => {
      const result = await deleteTeam(team.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${team.name}" deleted`);
        router.push("/admin/teams");
      }
    });
  }

  const members = team.members ?? [];
  const lead = team.lead;

  return (
    <div className="space-y-6">
      {/* Team Info Card */}
      <Card className="pt-0">
        <div
          className="h-2 w-full rounded-t-xl"
          style={{ backgroundColor: team.color || "#3B82F6" }}
        />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{team.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {team.code}
              </p>
            </div>
            <Badge className={TEAM_STATUS_COLORS[team.status] ?? ""}>
              {TEAM_STATUS_LABELS[team.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {team.description && (
            <p className="text-sm text-muted-foreground">{team.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {new Date(team.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span className="font-medium">
                {new Date(team.updated_at).toLocaleDateString()}
              </span>
            </div>
            {team.creator && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium">{team.creator.full_name}</span>
              </div>
            )}
          </div>

          {/* Admin actions */}
          <div className="flex gap-2 pt-4 border-t">
            {team.status !== "archived" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="mr-1 h-4 w-4" />
                Archive
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={isPending}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Restore
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Lead */}
      {lead && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-yellow-500" />
              Team Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={lead.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 text-yellow-700 font-bold text-lg">
                  {lead.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{lead.full_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No members in this team
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              {members.map((member: any) => {
                const emp = member.employee;
                if (!emp) return null;
                const initials = emp.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                const isLead = member.role === "lead";

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                      isLead ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={emp.profile_photo_url} />
                      <AvatarFallback className="text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-sm">
                          {emp.full_name}
                        </p>
                        {isLead && (
                          <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {emp.designation}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {isLead ? "Lead" : ROLE_LABELS[emp.role] ?? "Member"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{team.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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

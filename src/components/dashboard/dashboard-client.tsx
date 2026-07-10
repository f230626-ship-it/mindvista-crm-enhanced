"use client";

import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Package, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import {
  LEAVE_STATUS_LABELS,
  STATUS_COLORS,
  ASSET_TYPE_LABELS,
} from "@/lib/constants";
import type { HierarchyNode } from "@/lib/hierarchy";
import type { LeaveBalance, Leave, AssetAssignment, Asset } from "@/types/database";

type ModalType = "annual" | "sick" | "assets" | "team" | null;

// ─── Tree Node ───────────────────────────────────────────────────────────────

function TreeNode({ node }: { node: HierarchyNode }) {
  const initials = node.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasChildren = node.children.length > 0;

  return (
    <div className="relative flex flex-col items-center">
      {/* Node card */}
      <div className="relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 sm:px-4 py-3 shadow-sm min-w-[120px] sm:min-w-[140px] max-w-full sm:max-w-[160px] text-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={node.profile_photo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-tight truncate w-full">{node.full_name}</p>
            {node.designation && (
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate w-full">
                {node.designation}
              </p>
            )}
            {node.employee_code && (
              <p className="text-[10px] text-primary font-mono mt-0.5">
                {node.employee_code}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {node.relationship}
          </Badge>
        </div>
      </div>

      {/* Children */}
      {hasChildren && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical connector down */}
          <div className="w-px h-10 bg-border" />
          {/* Horizontal bar across children */}
          <div className="flex items-start gap-0">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLastChild = idx === node.children.length - 1;
              const isOnly = node.children.length === 1;
              return (
                <div key={child.id} className="flex flex-col items-center px-4">
                  <div className="flex items-center w-full">
                    {/* Left arm */}
                    {!isOnly && (
                      <div
                        className={`h-px bg-border ${isFirst ? "w-1/2 ml-auto" : "w-full"}`}
                        style={{ width: isFirst ? "50%" : isLastChild ? "50%" : "100%" }}
                      />
                    )}
                    {/* Vertical down */}
                    <div className="w-px h-10 bg-border" />
                    {/* Right arm */}
                    {!isOnly && (
                      <div
                        className={`h-px bg-border ${isLastChild ? "w-1/2 mr-auto" : "w-full"}`}
                        style={{ width: isFirst ? "50%" : isLastChild ? "50%" : "100%" }}
                      />
                    )}
                  </div>
                  <TreeNode node={child} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamTree({ tree }: { tree: HierarchyNode[] }) {
  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
        <Users className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">No team members in your hierarchy yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto py-4">
      <div className="flex gap-8 justify-center flex-wrap">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}

// ─── Leave Progress Bar ───────────────────────────────────────────────────────

function LeaveBar({ label, used, quota }: { label: string; used: number; quota: number }) {
  const remaining = quota - used;
  const pct = quota > 0 ? (remaining / quota) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {remaining} remaining / {quota} total
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
        <span>Used: <strong className="text-foreground">{used}</strong></span>
        <span>Remaining: <strong className="text-primary">{remaining}</strong></span>
      </div>
    </div>
  );
}

// ─── Main DashboardClient ─────────────────────────────────────────────────────

export function DashboardClient({
  leaveBalance,
  recentLeaves,
  assignedAssets,
  hierarchyTree,
  teamSize,
  annualRemaining,
  sickRemaining,
  casualRemaining,
}: {
  leaveBalance: LeaveBalance | null;
  recentLeaves: Leave[] | null;
  assignedAssets: (AssetAssignment & { asset?: Asset | null })[] | null;
  hierarchyTree: HierarchyNode[];
  teamSize: number;
  annualRemaining: number;
  sickRemaining: number;
  casualRemaining: number;
}) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const annualLeaves = recentLeaves?.filter((l) => l.leave_type === "annual") ?? [];
  const sickLeaves = recentLeaves?.filter((l) => l.leave_type === "sick") ?? [];

  function openModal(type: ModalType) {
    setActiveModal(type);
  }
  function closeModal() {
    setActiveModal(null);
  }

  return (
    <>
      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => openModal("annual")}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View annual leave details"
        >
          <StatCard
            title="Annual Leave"
            value={annualRemaining}
            description={`${leaveBalance?.annual_used ?? 0} used of ${leaveBalance?.annual_quota ?? 0}`}
            icon={CalendarDays}
            delay={0}
            className="hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
          />
        </button>

        <button
          onClick={() => openModal("sick")}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View sick leave details"
        >
          <StatCard
            title="Sick Leave"
            value={sickRemaining}
            description={`${leaveBalance?.sick_used ?? 0} used of ${leaveBalance?.sick_quota ?? 0}`}
            icon={CalendarDays}
            delay={60}
            className="hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
          />
        </button>

        <button
          onClick={() => openModal("assets")}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View assigned assets"
        >
          <StatCard
            title="Assigned Assets"
            value={assignedAssets?.length ?? 0}
            description="Company equipment"
            icon={Package}
            delay={120}
            className="hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
          />
        </button>

        <button
          onClick={() => openModal("team")}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View my team hierarchy"
        >
          <StatCard
            title="My Team"
            value={teamSize}
            description="Direct reports & lead team"
            icon={Users}
            delay={180}
            className="hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200"
          />
        </button>
      </div>

      {/* ── Annual Leave Modal ── */}
      <Dialog open={activeModal === "annual"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Annual Leave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <LeaveBar
              label="Annual Leave Balance"
              used={leaveBalance?.annual_used ?? 0}
              quota={leaveBalance?.annual_quota ?? 0}
            />
            <div>
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-[11px]">
                Annual Leave Requests
              </p>
              {annualLeaves.length > 0 ? (
                <div className="space-y-2">
                  {annualLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.days_count} day{leave.days_count !== 1 ? "s" : ""}
                          {leave.reason ? ` · ${leave.reason}` : ""}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                        {LEAVE_STATUS_LABELS[leave.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No annual leave requests yet
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sick Leave Modal ── */}
      <Dialog open={activeModal === "sick"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Sick Leave
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <LeaveBar
              label="Sick Leave Balance"
              used={leaveBalance?.sick_used ?? 0}
              quota={leaveBalance?.sick_quota ?? 0}
            />
            <div>
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-[11px]">
                Sick Leave Requests
              </p>
              {sickLeaves.length > 0 ? (
                <div className="space-y-2">
                  {sickLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {leave.days_count} day{leave.days_count !== 1 ? "s" : ""}
                          {leave.reason ? ` · ${leave.reason}` : ""}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[leave.status]} variant="secondary">
                        {LEAVE_STATUS_LABELS[leave.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No sick leave requests yet
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assets Modal ── */}
      <Dialog open={activeModal === "assets"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Assigned Assets
            </DialogTitle>
          </DialogHeader>
          <div className="pt-1">
            {assignedAssets && assignedAssets.length > 0 ? (
              <div className="space-y-2">
                {assignedAssets.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border/60 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{a.asset?.name ?? "—"}</p>
                      <Badge variant="outline" className="text-xs">
                        {a.asset?.asset_type
                          ? ASSET_TYPE_LABELS[a.asset.asset_type] ?? a.asset.asset_type
                          : "—"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      {a.asset?.serial_number && (
                        <span>S/N: {a.asset.serial_number}</span>
                      )}
                      <span>Assigned: {formatDate(a.assigned_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No assets currently assigned
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── My Team Modal ── */}
      <Dialog open={activeModal === "team"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              My Team Hierarchy
            </DialogTitle>
          </DialogHeader>
          <div className="pt-1">
            <TeamTree tree={hierarchyTree} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

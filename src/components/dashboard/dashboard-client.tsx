"use client";

import { useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Stethoscope, MonitorSmartphone, UsersRound } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import {
  LEAVE_STATUS_LABELS,
  STATUS_COLORS,
  ASSET_TYPE_LABELS,
} from "@/lib/constants";
import type { LeaveBalance, Leave, AssetAssignment, Asset } from "@/types/database";

type ModalType = "annual" | "sick" | "assets" | null;

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
  teamSize,
  annualRemaining,
  sickRemaining,
  casualRemaining,
}: {
  leaveBalance: LeaveBalance | null;
  recentLeaves: Leave[] | null;
  assignedAssets: (AssetAssignment & { asset?: Asset | null })[] | null;
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
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <button
          onClick={() => openModal("annual")}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View annual leave details"
        >
          <StatCard
            title="Annual Leave"
            value={annualRemaining}
            description={`${leaveBalance?.annual_used ?? 0} used of ${leaveBalance?.annual_quota ?? 0}`}
            icon={CalendarClock}
            delay={0}
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
            icon={Stethoscope}
            delay={60}
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
            icon={MonitorSmartphone}
            delay={120}
          />
        </button>

        <Link
          href="/team/hierarchy"
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl cursor-pointer"
          aria-label="View my team hierarchy"
        >
          <StatCard
            title="My Team"
            value={teamSize}
            description="Direct reports & lead team"
            icon={UsersRound}
            delay={180}
          />
        </Link>
      </div>

      {/* ── Annual Leave Modal ── */}
      <Dialog open={activeModal === "annual"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
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
              <Stethoscope className="h-4 w-4 text-primary" />
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
              <MonitorSmartphone className="h-4 w-4 text-primary" />
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
    </>
  );
}

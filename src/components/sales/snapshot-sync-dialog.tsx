"use client";

import { useState } from "react";
import { upsertSheetSnapshot } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { RefreshCw, Save } from "lucide-react";
import type { SalesProfile, SalesSheetSnapshot } from "@/types/database";

interface ProfileWithSnapshot extends SalesProfile {
  snapshot?: SalesSheetSnapshot | null;
}

export function SnapshotSyncDialog({
  profiles,
  open,
  onOpenChange,
}: {
  profiles: ProfileWithSnapshot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]?.id ?? "");
  const [form, setForm] = useState({
    active_leads: 0,
    follow_up: 0,
    intro_call: 0,
    trying_to_call: 0,
    won_mtd: 0,
  });

  const current = profiles.find((p) => p.id === selectedProfile);
  const snap = current?.snapshot;

  function handleProfileChange(id: string) {
    setSelectedProfile(id);
    const s = profiles.find((p) => p.id === id)?.snapshot;
    setForm({
      active_leads: s?.active_leads ?? 0,
      follow_up: s?.follow_up ?? 0,
      intro_call: s?.intro_call ?? 0,
      trying_to_call: s?.trying_to_call ?? 0,
      won_mtd: s?.won_mtd ?? 0,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProfile) {
      toast.error("Select a profile");
      return;
    }
    setLoading(true);
    const result = await upsertSheetSnapshot(selectedProfile, form);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Snapshot updated");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Pipeline Snapshot
          </DialogTitle>
          <DialogDescription>
            Manually enter the latest Google Sheet pipeline data for a profile. This will be saved as today&apos;s snapshot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Select profile</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProfileChange(p.id)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    selectedProfile === p.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.platform}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedProfile && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "active_leads" as const, label: "Active Leads", desc: "Current pipeline" },
                { key: "follow_up" as const, label: "Follow-up", desc: "In follow-up stage" },
                { key: "intro_call" as const, label: "Intro Call", desc: "Intro calls booked" },
                { key: "trying_to_call" as const, label: "Trying to Call", desc: "Attempting contact" },
                { key: "won_mtd" as const, label: "Won MTD", desc: "Closed this month" },
              ].map((field) => (
                <div key={field.key} className="space-y-1 rounded-xl border border-border/60 p-3">
                  <Label htmlFor={`snap-${field.key}`} className="text-sm font-semibold">
                    {field.label}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">{field.desc}</p>
                  <Input
                    id={`snap-${field.key}`}
                    type="number"
                    min="0"
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [field.key]: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="text-lg font-semibold tabular-nums"
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedProfile} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save snapshot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

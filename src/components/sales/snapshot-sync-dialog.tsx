"use client";

import { useState } from "react";
import {
  upsertSheetSnapshot,
  fetchAndSyncProfileSheet,
  testProfileSheetConnection,
} from "@/actions/sales";
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
import { RefreshCw, Save, Download, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
  const [fetching, setFetching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState(
    profiles[0]?.id ?? ""
  );
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
    setTestResult(null);
    const s = profiles.find((p) => p.id === id)?.snapshot;
    setForm({
      active_leads: s?.active_leads ?? 0,
      follow_up: s?.follow_up ?? 0,
      intro_call: s?.intro_call ?? 0,
      trying_to_call: s?.trying_to_call ?? 0,
      won_mtd: s?.won_mtd ?? 0,
    });
  }

  async function handleTestConnection() {
    if (!selectedProfile) return;
    setTesting(true);
    setTestResult(null);
    const result = await testProfileSheetConnection(selectedProfile);
    setTesting(false);
    if (result.error) {
      setTestResult({ success: false, message: result.error });
    } else {
      const preview = result.preview;
      const headers = preview?.[0]?.join(", ") ?? "No headers";
      setTestResult({
        success: true,
        message: `Connected! Headers: ${headers}`,
      });
    }
  }

  async function handleFetchFromSheet() {
    if (!selectedProfile) return;
    setFetching(true);
    setTestResult(null);
    const result = await fetchAndSyncProfileSheet(selectedProfile);
    setFetching(false);

    if (result.error) {
      toast.error(result.error);
      setTestResult({ success: false, message: result.error });
    } else if (result.data) {
      setForm({
        active_leads: result.data.active_leads,
        follow_up: result.data.follow_up,
        intro_call: result.data.intro_call,
        trying_to_call: result.data.trying_to_call,
        won_mtd: result.data.won_mtd,
      });
      toast.success(
        `Fetched ${result.data.total_rows} rows from ${result.profileName}'s sheet`
      );
      setTestResult({
        success: true,
        message: `Loaded: ${result.data.active_leads} active, ${result.data.follow_up} follow-up, ${result.data.intro_call} intro, ${result.data.trying_to_call} calling, ${result.data.won_mtd} won`,
      });
    }
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
            Fetch data directly from Google Sheets, or enter numbers manually.
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
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.platform}
                  </p>
                  {p.google_sheet_id && (
                    <p className="mt-1 text-[10px] text-green-500 font-medium">
                      Sheet configured
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {current && !current.google_sheet_id && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-600">
              No Google Sheet ID configured for this profile. Edit the profile to
              add one, or enter data manually below.
            </div>
          )}

          {current && current.google_sheet_id && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
                className="gap-1"
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleFetchFromSheet}
                disabled={fetching}
                className="gap-1"
              >
                {fetching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {fetching ? "Fetching..." : "Fetch from Sheet & Save"}
              </Button>
            </div>
          )}

          {testResult && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                testResult.success
                  ? "border-green-500/30 bg-green-500/5 text-green-600"
                  : "border-red-500/30 bg-red-500/5 text-red-600"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="inline h-4 w-4 mr-1" />
              ) : (
                <XCircle className="inline h-4 w-4 mr-1" />
              )}
              {testResult.message}
            </div>
          )}

          {selectedProfile && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  key: "active_leads" as const,
                  label: "Active Leads",
                  desc: "Current pipeline",
                },
                {
                  key: "follow_up" as const,
                  label: "Follow-up",
                  desc: "In follow-up stage",
                },
                {
                  key: "intro_call" as const,
                  label: "Intro Call",
                  desc: "Intro calls booked",
                },
                {
                  key: "trying_to_call" as const,
                  label: "Trying to Call",
                  desc: "Attempting contact",
                },
                {
                  key: "won_mtd" as const,
                  label: "Won MTD",
                  desc: "Closed this month",
                },
              ].map((field) => (
                <div
                  key={field.key}
                  className="space-y-1 rounded-xl border border-border/60 p-3"
                >
                  <Label
                    htmlFor={`snap-${field.key}`}
                    className="text-sm font-semibold"
                  >
                    {field.label}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {field.desc}
                  </p>
                  <Input
                    id={`snap-${field.key}`}
                    type="number"
                    min="0"
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [field.key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="text-lg font-semibold tabular-nums"
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedProfile}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save snapshot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

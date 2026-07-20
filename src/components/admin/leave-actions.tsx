"use client";

import { useState } from "react";
import { reviewLeave } from "@/actions/leaves";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";

export function LeaveActions({ leaveId }: { leaveId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleApprove() {
    setLoading("approve");
    const result = await reviewLeave(leaveId, "approved");
    setLoading(null);
    if (result.error) toast.error(result.error);
    else toast.success("Leave approved successfully");
  }

  async function handleReject() {
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      toast.error("A rejection reason is required.");
      return;
    }
    setLoading("reject");
    const result = await reviewLeave(leaveId, "rejected", trimmed);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Leave request rejected");
      setRejectOpen(false);
      setRejectionReason("");
    }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-500/70 transition-colors"
          onClick={handleApprove}
          disabled={loading !== null}
          title="Approve leave"
        >
          {loading === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-500/70 transition-colors"
          onClick={() => setRejectOpen(true)}
          disabled={loading !== null}
          title="Reject leave"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Rejection reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={(v) => { setRejectOpen(v); if (!v) setRejectionReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Reject Leave Request</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">This action will notify the employee</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 pt-1">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Reason for Rejection <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Critical project deadline this week, please reschedule for next month..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be visible to the employee in their leave history.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRejectOpen(false); setRejectionReason(""); }}
              disabled={loading === "reject"}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={loading === "reject" || !rejectionReason.trim()}
              className="gap-1.5"
            >
              {loading === "reject" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

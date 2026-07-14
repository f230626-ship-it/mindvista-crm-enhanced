"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGlobalLeaveQuota } from "@/actions/leaves";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { toast } from "sonner";

interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_quota: number;
  sick_quota: number;
  casual_quota: number;
  annual_used: number;
  sick_used: number;
  casual_used: number;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    employee_code: string | null;
    designation: string;
  } | null;
}

export function LeaveQuotaAdjuster({ balance }: { balance: LeaveBalance }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [annual, setAnnual] = useState(balance.annual_quota);
  const [sick, setSick] = useState(balance.sick_quota);
  const [casual, setCasual] = useState(balance.casual_quota);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (annual < 0 || sick < 0 || casual < 0) {
      toast.error("Quotas cannot be negative.");
      return;
    }

    startTransition(async () => {
      const result = await updateGlobalLeaveQuota({
        annual_quota: annual,
        sick_quota: sick,
        casual_quota: casual,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Leave quotas updated successfully!");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
        <Settings className="h-3.5 w-3.5" />
        Adjust
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Adjust Leave Quotas
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {balance.employee?.full_name}
            {balance.employee?.employee_code && ` (#${balance.employee.employee_code})`}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Annual
              </Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={annual}
                onChange={(e) => setAnnual(Number(e.target.value))}
                required
                className="text-center font-mono"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Used: {balance.annual_used}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Sick
              </Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={sick}
                onChange={(e) => setSick(Number(e.target.value))}
                required
                className="text-center font-mono"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Used: {balance.sick_used}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Casual
              </Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={casual}
                onChange={(e) => setCasual(Number(e.target.value))}
                required
                className="text-center font-mono"
              />
              <p className="text-[10px] text-muted-foreground text-center">
                Used: {balance.casual_used}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save Quotas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

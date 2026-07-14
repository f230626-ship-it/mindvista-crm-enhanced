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
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props {
  annualQuota: number;
  sickQuota: number;
  casualQuota: number;
}

export function LeaveQuotaEditor({ annualQuota, sickQuota, casualQuota }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [annual, setAnnual] = useState(annualQuota);
  const [sick, setSick] = useState(sickQuota);
  const [casual, setCasual] = useState(casualQuota);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (annual < 0 || sick < 0 || casual < 0) {
      toast.error("Values cannot be negative.");
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
        toast.success("Leave quotas updated for all employees!");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
        <Pencil className="h-3 w-3" />
        Edit Quotas
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Edit Leave Quotas (All Employees)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Annual</Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={annual}
                onChange={(e) => setAnnual(Number(e.target.value))}
                required
                className="text-center font-mono text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Sick</Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={sick}
                onChange={(e) => setSick(Number(e.target.value))}
                required
                className="text-center font-mono text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Casual</Label>
              <Input
                type="number"
                min="0"
                max="365"
                value={casual}
                onChange={(e) => setCasual(Number(e.target.value))}
                required
                className="text-center font-mono text-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDailyLog } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SalesDailyLog } from "@/types/database";

const fields = [
  { key: "connections_sent", label: "Connections sent", hint: "Requests sent today" },
  { key: "connections_accepted", label: "Accepted (new)", hint: "New acceptances today" },
  { key: "messages_sent", label: "Messages sent", hint: "DMs / InMails" },
  { key: "replies_received", label: "Replies received", hint: "Inbound responses" },
  { key: "follow_ups_done", label: "Follow-ups done", hint: "Completed follow-ups" },
  { key: "meetings_booked", label: "Meetings booked", hint: "Calls scheduled" },
  { key: "leads_added", label: "Leads added", hint: "New rows in sheet" },
  { key: "proposals_sent", label: "Proposals sent", hint: "Quotes / proposals" },
] as const;

export function DailyLogPageForm({
  profileId,
  profileName,
  existing,
}: {
  profileId: string;
  profileName: string;
  existing: SalesDailyLog | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("profile_id", profileId);
    const result = await submitDailyLog(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Daily log saved");
      router.push("/sales/my-day");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/sales/my-day" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
        <ArrowLeft className="h-4 w-4" />
        All profiles
      </Link>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">{profileName}</CardTitle>
          <CardDescription>
            {existing ? "Update today's log" : "Log today's outreach for this profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {fields.map(({ key, label, hint }) => (
                <div
                  key={key}
                  className="space-y-2 rounded-xl border border-border/60 bg-background/50 p-4 transition-colors focus-within:border-primary/40"
                >
                  <Label htmlFor={key} className="text-sm font-semibold">
                    {label}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">{hint}</p>
                  <Input
                    id={key}
                    name={key}
                    type="number"
                    min="0"
                    defaultValue={existing?.[key] ?? ""}
                    placeholder="0"
                    className="mt-1 text-lg font-semibold tabular-nums"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Wins, blockers, or context for today..."
                defaultValue={existing?.notes ?? ""}
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="min-w-[200px]">
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : existing ? "Update log" : "Submit log"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

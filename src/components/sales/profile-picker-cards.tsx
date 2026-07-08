import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, Link2, Plus, LayoutDashboard } from "lucide-react";
import type { SalesDailyLog } from "@/types/database";

export function ProfilePickerCards({
  profiles,
  todayLogs,
  basePath = "/sales/my-day",
  isOwner = false,
}: {
  profiles: { id: string; name: string; platform: string }[];
  todayLogs: Pick<SalesDailyLog, "profile_id" | "connections_sent">[];
  basePath?: string;
  isOwner?: boolean;
}) {
  if (profiles.length === 0) {
    return (
      <Card className="border-dashed border-primary/30 bg-card/50">
        <CardContent className="py-12 text-center">
          {isOwner ? (
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-lg">No sales profiles yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create LinkedIn profiles and assign them to your sales reps to start tracking outreach.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/sales/admin/profiles/new" className={cn(buttonVariants(), "gap-2")}>
                  <Plus className="h-4 w-4" />
                  Create profile
                </Link>
                <Link
                  href="/sales/command"
                  className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Command Center
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No LinkedIn profiles assigned yet. Ask your admin to set up profiles for you.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {profiles.map((profile) => {
        const logged = todayLogs.find((l) => l.profile_id === profile.id);
        const done = !!logged;

        return (
          <Link key={profile.id} href={`${basePath}/${profile.id}`}>
            <Card
              className={cn(
                "group h-full cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
                done
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border/60 hover:border-primary/40"
              )}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    done ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"
                  )}
                >
                  {done ? <CheckCircle2 className="h-7 w-7" /> : <Link2 className="h-7 w-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-lg">{profile.name}</p>
                  <p className="text-sm capitalize text-muted-foreground">{profile.platform}</p>
                  {done ? (
                    <Badge className="mt-2 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                      Logged · {logged.connections_sent} connections
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2 border-amber-500/40 text-amber-600">
                      Pending today
                    </Badge>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

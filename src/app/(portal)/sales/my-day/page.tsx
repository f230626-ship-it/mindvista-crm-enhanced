import { createClient } from "@/lib/supabase/server";
import { requireSalesAccess } from "@/lib/auth";
import { ProfilePickerCards } from "@/components/sales/profile-picker-cards";
import { todayISO } from "@/lib/sales/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default async function MyDayPage() {
  const employee = await requireSalesAccess();
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: profiles }, { data: logs }] = await Promise.all([
    supabase
      .from("sales_profiles")
      .select("id, name, platform")
      .eq("employee_id", employee.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sales_daily_logs")
      .select("profile_id, connections_sent")
      .eq("employee_id", employee.id)
      .eq("log_date", today),
  ]);

  const loggedCount = logs?.length ?? 0;
  const total = profiles?.length ?? 0;

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            Today — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a profile to log outreach.{" "}
            <span className="font-semibold text-foreground">
              {loggedCount}/{total}
            </span>{" "}
            profiles completed today.
          </p>
        </CardContent>
      </Card>

      <ProfilePickerCards profiles={profiles ?? []} todayLogs={logs ?? []} />
    </div>
  );
}

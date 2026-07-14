import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { HolidayForm } from "@/components/admin/holiday-form";
import { DeleteHolidayButton } from "@/components/admin/delete-holiday-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/date";
import { parseISO, format, isPast, isFuture, isToday, startOfMonth, isSameMonth } from "date-fns";
import { CalendarDays, Trophy, Clock, PartyPopper, Sun } from "lucide-react";

const MONTH_COLORS: Record<string, string> = {
  January: "from-red-500/10 to-orange-500/5 border-red-500/20",
  February: "from-pink-500/10 to-rose-500/5 border-pink-500/20",
  March: "from-green-500/10 to-emerald-500/5 border-green-500/20",
  April: "from-purple-500/10 to-violet-500/5 border-purple-500/20",
  May: "from-yellow-500/10 to-amber-500/5 border-yellow-500/20",
  June: "from-cyan-500/10 to-sky-500/5 border-cyan-500/20",
  July: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
  August: "from-orange-500/10 to-amber-500/5 border-orange-500/20",
  September: "from-teal-500/10 to-cyan-500/5 border-teal-500/20",
  October: "from-amber-500/10 to-yellow-500/5 border-amber-500/20",
  November: "from-emerald-500/10 to-green-500/5 border-emerald-500/20",
  December: "from-red-600/10 to-pink-500/5 border-red-600/20",
};

const DOT_COLORS: Record<string, string> = {
  January: "bg-red-500",
  February: "bg-pink-500",
  March: "bg-green-500",
  April: "bg-purple-500",
  May: "bg-yellow-500",
  June: "bg-cyan-500",
  July: "bg-blue-500",
  August: "bg-orange-500",
  September: "bg-teal-500",
  October: "bg-amber-500",
  November: "bg-emerald-500",
  December: "bg-red-600",
};

export default async function AdminHolidaysPage() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const { data: holidays } = await supabase
    .from("holidays")
    .select("*")
    .order("date");

  const now = new Date();
  const allHolidays = holidays ?? [];
  const upcoming = allHolidays.filter((h) => isFuture(parseISO(h.date)) || isToday(parseISO(h.date)));
  const past = allHolidays.filter((h) => isPast(parseISO(h.date)) && !isToday(parseISO(h.date)));
  const thisMonth = allHolidays.filter((h) => isSameMonth(parseISO(h.date), now));

  // Group by month
  const grouped = allHolidays.reduce<Record<string, typeof allHolidays>>((acc, holiday) => {
    const month = format(parseISO(holiday.date), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage company holidays excluded from leave calculations
          </p>
        </div>
        <HolidayForm />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <Card className="pt-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 py-3 px-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Total Holidays
            </div>
          </div>
          <CardContent className="pt-3 pb-4">
            <p className="text-3xl font-bold">{allHolidays.length}</p>
          </CardContent>
        </Card>
        <Card className="pt-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 py-3 px-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Trophy className="h-3.5 w-3.5" />
              Upcoming
            </div>
          </div>
          <CardContent className="pt-3 pb-4">
            <p className="text-3xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card className="pt-0 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 py-3 px-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <PartyPopper className="h-3.5 w-3.5" />
              This Month
            </div>
          </div>
          <CardContent className="pt-3 pb-4">
            <p className="text-3xl font-bold">{thisMonth.length}</p>
          </CardContent>
        </Card>
        <Card className="pt-0 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500/10 to-gray-500/5 py-3 px-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Past
            </div>
          </div>
          <CardContent className="pt-3 pb-4">
            <p className="text-3xl font-bold">{past.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Holiday Cards by Month */}
      {allHolidays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No holidays configured"
          description="Add company holidays to exclude them from leave calculations"
          action={<HolidayForm />}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, items]) => {
            const monthName = month.split(" ")[0];
            const colorClass = MONTH_COLORS[monthName] ?? "from-gray-500/10 to-gray-500/5 border-gray-500/20";
            const dotColor = DOT_COLORS[monthName] ?? "bg-gray-500";

            return (
              <div key={month}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                  <h2 className="text-lg font-bold">{month}</h2>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {items.length} {items.length === 1 ? "holiday" : "holidays"}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]">
                  {items.map((holiday) => {
                    const holidayDate = parseISO(holiday.date);
                    const isPastDate = isPast(holidayDate) && !isToday(holidayDate);
                    const isTodayDate = isToday(holidayDate);

                    return (
                      <Card
                        key={holiday.id}
                        className={`group relative overflow-hidden bg-gradient-to-br ${colorClass} transition-all hover:shadow-md hover:-translate-y-0.5 ${isPastDate ? "opacity-60" : ""}`}
                      >
                        {/* Top accent line */}
                        <div className={`h-0.5 w-full ${dotColor}`} />

                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: Date badge */}
                            <div className="flex items-center gap-3">
                              <div className={`flex flex-col items-center justify-center rounded-xl ${dotColor} text-white min-w-[52px] h-[56px] shadow-sm`}>
                                <span className="text-[10px] font-bold uppercase leading-none tracking-wider opacity-90">
                                  {format(holidayDate, "MMM")}
                                </span>
                                <span className="text-lg font-bold leading-none mt-0.5">
                                  {format(holidayDate, "d")}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm leading-tight">
                                  {holiday.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {holiday.description || "No description"}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    {format(holidayDate, "EEEE")}
                                  </span>
                                  {isTodayDate && (
                                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                                      Today
                                    </Badge>
                                  )}
                                  {isPastDate && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                      Past
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Delete */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <DeleteHolidayButton holidayId={holiday.id} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

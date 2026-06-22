import { differenceInBusinessDays, eachDayOfInterval, format, parseISO, isWeekend } from "date-fns";

export function formatDate(date: string | Date, pattern = "MMM d, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function calculateLeaveDays(
  startDate: string,
  endDate: string,
  holidayDates: string[] = []
): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const holidaySet = new Set(holidayDates);

  const days = eachDayOfInterval({ start, end });
  return days.filter((day) => !isWeekend(day) && !holidaySet.has(format(day, "yyyy-MM-dd"))).length;
}

export function calculateWorkingHours(checkIn: string, checkOut: string): number {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

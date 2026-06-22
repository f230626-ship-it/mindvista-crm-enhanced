"use client";

import { useState } from "react";
import { checkIn, checkOut } from "@/actions/attendance";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LogIn, LogOut } from "lucide-react";
import { ATTENDANCE_TYPE_LABELS } from "@/lib/constants";
import type { Attendance, AttendanceType } from "@/types/database";

export function CheckInOut({ todayRecord }: { todayRecord: Attendance | null }) {
  const [loading, setLoading] = useState(false);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("office");

  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = todayRecord?.check_in && !todayRecord?.check_out;

  async function handleCheckIn() {
    setLoading(true);
    const result = await checkIn(attendanceType);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Checked in successfully");
  }

  async function handleCheckOut() {
    setLoading(true);
    const result = await checkOut();
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Checked out successfully");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canCheckIn && (
        <>
          <Select value={attendanceType} onValueChange={(v) => v && setAttendanceType(v as AttendanceType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ATTENDANCE_TYPE_LABELS)
                .filter(([k]) => k !== "absent" && k !== "half_day")
                .map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCheckIn} disabled={loading}>
            <LogIn className="mr-2 h-4 w-4" />
            Check In
          </Button>
        </>
      )}
      {canCheckOut && (
        <Button variant="destructive" onClick={handleCheckOut} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          Check Out
        </Button>
      )}
      {todayRecord?.check_out && (
        <span className="text-sm text-muted-foreground">
          Day complete — {todayRecord.working_hours}h worked
        </span>
      )}
    </div>
  );
}

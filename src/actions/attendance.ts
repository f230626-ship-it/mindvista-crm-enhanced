"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { calculateWorkingHours } from "@/lib/utils/date";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import type { AttendanceType } from "@/types/database";

export async function checkIn(attendanceType: AttendanceType = "office") {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("attendance")
    .select("id, check_in")
    .eq("employee_id", employee.id)
    .eq("date", today)
    .maybeSingle();

  if (existing?.check_in) return { error: "Already checked in today" };

  if (existing) {
    const { error } = await supabase
      .from("attendance")
      .update({ check_in: now, attendance_type: attendanceType })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("attendance").insert({
      employee_id: employee.id,
      date: today,
      check_in: now,
      attendance_type: attendanceType,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function checkOut() {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date().toISOString();

  const { data: record } = await supabase
    .from("attendance")
    .select("id, check_in, check_out")
    .eq("employee_id", employee.id)
    .eq("date", today)
    .maybeSingle();

  if (!record?.check_in) return { error: "Not checked in yet" };
  if (record.check_out) return { error: "Already checked out today" };

  const workingHours = calculateWorkingHours(record.check_in, now);

  const { error } = await supabase
    .from("attendance")
    .update({ check_out: now, working_hours: workingHours })
    .eq("id", record.id);

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addTimesheet(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase.from("timesheets").insert({
    employee_id: employee.id,
    date: formData.get("date") as string,
    task_description: formData.get("task_description") as string,
    hours: parseFloat(formData.get("hours") as string),
  });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}

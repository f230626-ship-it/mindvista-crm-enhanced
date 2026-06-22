"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { calculateLeaveDays } from "@/lib/utils/date";
import { revalidatePath } from "next/cache";
import type { LeaveType } from "@/types/database";

export async function applyLeave(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const leaveType = formData.get("leave_type") as LeaveType;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const reason = formData.get("reason") as string;

  const supabase = await createClient();

  const { data: holidays } = await supabase.from("holidays").select("date");
  const holidayDates = holidays?.map((h) => h.date) ?? [];
  const daysCount = calculateLeaveDays(startDate, endDate, holidayDates);

  if (daysCount <= 0) return { error: "Invalid date range" };

  const { error } = await supabase.from("leaves").insert({
    employee_id: employee.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason,
    days_count: daysCount,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/leave");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reviewLeave(
  leaveId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  await requireRole("admin", "manager");
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("leaves")
    .update({
      status,
      reviewed_by: employee.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason ?? null,
    })
    .eq("id", leaveId);

  if (error) return { error: error.message };

  revalidatePath("/admin/leaves");
  revalidatePath("/leave");
  return { success: true };
}

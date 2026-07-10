"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { calculateLeaveDays } from "@/lib/utils/date";
import { revalidatePath } from "next/cache";
import type { LeaveType } from "@/types/database";

export async function applyLeave(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  if (!employee.lead_id) {
    return { error: "No lead assigned. Contact admin to set your lead before applying for leave." };
  }

  const leaveType = formData.get("leave_type") as LeaveType;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const reason = formData.get("reason") as string;

  const supabase = createAdminClient();

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
  const reviewer = await getCurrentEmployee();
  if (!reviewer) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  const { data: leave } = await supabase
    .from("leaves")
    .select("*, employee:employees!leaves_employee_id_fkey(id, full_name, lead_id, manager_id)")
    .eq("id", leaveId)
    .single();

  if (!leave) return { error: "Leave request not found" };

  const emp = leave.employee as { id: string; lead_id: string | null; manager_id: string | null };
  const canApprove =
    reviewer.role === "admin" ||
    emp.lead_id === reviewer.id ||
    emp.manager_id === reviewer.id;

  if (!canApprove) return { error: "You are not authorized to approve this leave" };

  const { error } = await supabase
    .from("leaves")
    .update({
      status,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason ?? null,
    })
    .eq("id", leaveId);

  if (error) return { error: error.message };

  if (leave.employee_id) {
    await supabase.from("notifications").insert({
      recipient_id: leave.employee_id,
      type: "leave_review",
      title: `Leave ${status}`,
      message: `Your leave request has been ${status}`,
      entity_type: "leave",
      entity_id: leaveId,
    });
  }

  revalidatePath("/admin/leaves");
  revalidatePath("/leave");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPendingLeavesForLead() {
  const employee = await getCurrentEmployee();
  if (!employee) return [];

  const supabase = createAdminClient();

  const { data: team } = await supabase
    .from("employees")
    .select("id")
    .or(`lead_id.eq.${employee.id},manager_id.eq.${employee.id}`);

  const teamIds = team?.map((t) => t.id) ?? [];
  if (teamIds.length === 0) return [];

  const { data } = await supabase
    .from("leaves")
      .select("*, employee:employees!leaves_employee_id_fkey(id, full_name, email, designation, employee_code)")
    .in("employee_id", teamIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return data ?? [];
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, requireSalesAccess, requireSalesOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { MeetingStatus } from "@/types/database";

export async function createSalesMeeting(formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();

  const meetingDate = formData.get("meeting_date") as string;
  if (!meetingDate) return { error: "Meeting date is required" };

  const { data, error } = await supabase
    .from("sales_meetings")
    .insert({
      employee_id: employee.id,
      lead_id: (formData.get("lead_id") as string) || null,
      meeting_date: meetingDate,
      meeting_link: (formData.get("meeting_link") as string) || null,
      status: (formData.get("status") as MeetingStatus) || "pending",
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // If linked to a lead, update lead status to meeting_booked
  const leadId = formData.get("lead_id") as string;
  if (leadId) {
    await supabase
      .from("sales_leads")
      .update({ status: "meeting_booked" })
      .eq("id", leadId);
  }

  await supabase.from("sales_activity_logs").insert({
    user_id: employee.id,
    action: "created_meeting",
    module: "meetings",
    metadata: { meeting_id: data?.id, meeting_date: meetingDate, lead_id: leadId },
  });

  revalidatePath("/sales/meetings");
  revalidatePath("/sales/command");
  revalidatePath("/sales/leads");
  return { success: true };
}

export async function updateSalesMeeting(meetingId: string, formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("sales_meetings")
    .select("employee_id")
    .eq("id", meetingId)
    .single();

  if (!existing) return { error: "Meeting not found" };
  if (existing.employee_id !== employee.id && employee.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("sales_meetings")
    .update({
      meeting_date: (formData.get("meeting_date") as string) || undefined,
      meeting_link: (formData.get("meeting_link") as string) || undefined,
      status: (formData.get("status") as MeetingStatus) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    })
    .eq("id", meetingId);

  if (error) return { error: error.message };

  await supabase.from("sales_activity_logs").insert({
    user_id: employee.id,
    action: "updated_meeting",
    module: "meetings",
    metadata: { meeting_id: meetingId, status: formData.get("status") },
  });

  revalidatePath("/sales/meetings");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function deleteSalesMeeting(meetingId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase.from("sales_meetings").delete().eq("id", meetingId);
  if (error) return { error: error.message };

  revalidatePath("/sales/meetings");
  return { success: true };
}

export async function getSalesMeetings(filters?: {
  employeeId?: string;
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
}) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const isAdmin = employee.role === "admin";

  let query = supabase
    .from("sales_meetings")
    .select(`
      *,
      lead:sales_leads(id, lead_name, company_name),
      employee:employees(id, full_name, email)
    `)
    .order("meeting_date", { ascending: false });

  if (!isAdmin) {
    query = query.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.startDate) {
    query = query.gte("meeting_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("meeting_date", filters.endDate);
  }

  const { data, error } = await query.limit(200);
  if (error) return { meetings: [], error: error.message };
  return { meetings: data ?? [], error: null };
}

export async function getUpcomingMeetings() {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const isAdmin = employee.role === "admin";

  let query = supabase
    .from("sales_meetings")
    .select(`
      *,
      lead:sales_leads(id, lead_name, company_name),
      employee:employees(id, full_name, email)
    `)
    .gte("meeting_date", new Date().toISOString())
    .eq("status", "pending")
    .order("meeting_date", { ascending: true })
    .limit(10);

  if (!isAdmin) {
    query = query.eq("employee_id", employee.id);
  }

  const { data, error } = await query;
  if (error) return { meetings: [], error: error.message };
  return { meetings: data ?? [], error: null };
}

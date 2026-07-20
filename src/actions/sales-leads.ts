"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, requireSalesAccess, requireSalesOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@/types/database";

export async function createSalesLead(formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();

  const leadName = (formData.get("lead_name") as string)?.trim();
  if (!leadName) return { error: "Lead name is required" };

  const { data, error } = await supabase
    .from("sales_leads")
    .insert({
      employee_id: employee.id,
      profile_id: (formData.get("profile_id") as string) || null,
      lead_name: leadName,
      company_name: (formData.get("company_name") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      linkedin_url: (formData.get("linkedin_url") as string) || null,
      source: (formData.get("source") as string) || "manual",
      status: (formData.get("status") as LeadStatus) || "cold",
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("sales_activity_logs").insert({
    user_id: employee.id,
    action: "created_lead",
    module: "leads",
    metadata: { lead_name: leadName, lead_id: data?.id },
  });

  revalidatePath("/sales/leads");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function updateSalesLead(leadId: string, formData: FormData) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();

  // Employees can only update their own leads
  const { data: existing } = await supabase
    .from("sales_leads")
    .select("employee_id")
    .eq("id", leadId)
    .single();

  if (!existing) return { error: "Lead not found" };
  if (existing.employee_id !== employee.id && employee.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("sales_leads")
    .update({
      lead_name: (formData.get("lead_name") as string)?.trim() || undefined,
      company_name: (formData.get("company_name") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      linkedin_url: (formData.get("linkedin_url") as string) || undefined,
      source: (formData.get("source") as string) || undefined,
      status: (formData.get("status") as LeadStatus) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  await supabase.from("sales_activity_logs").insert({
    user_id: employee.id,
    action: "updated_lead",
    module: "leads",
    metadata: { lead_id: leadId, status: formData.get("status") },
  });

  revalidatePath("/sales/leads");
  revalidatePath("/sales/command");
  return { success: true };
}

export async function deleteSalesLead(leadId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase.from("sales_leads").delete().eq("id", leadId);
  if (error) return { error: error.message };

  revalidatePath("/sales/leads");
  return { success: true };
}

export async function getSalesLeads(filters?: {
  employeeId?: string;
  status?: LeadStatus;
  profileId?: string;
  search?: string;
}) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();
  const isAdmin = employee.role === "admin";

  let query = supabase
    .from("sales_leads")
    .select(`
      *,
      employee:employees(id, full_name, email),
      profile:sales_profiles(id, name, platform)
    `)
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("employee_id", employee.id);
  } else if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.profileId) {
    query = query.eq("profile_id", filters.profileId);
  }
  if (filters?.search) {
    query = query.or(`lead_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.limit(200);
  if (error) return { leads: [], error: error.message };
  return { leads: data ?? [], error: null };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const employee = await requireSalesAccess();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("sales_leads")
    .select("employee_id")
    .eq("id", leadId)
    .single();

  if (!existing) return { error: "Lead not found" };
  if (existing.employee_id !== employee.id && employee.role !== "admin") {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("sales_leads")
    .update({ status })
    .eq("id", leadId);

  if (error) return { error: error.message };

  await supabase.from("sales_activity_logs").insert({
    user_id: employee.id,
    action: "updated_lead_status",
    module: "leads",
    metadata: { lead_id: leadId, new_status: status },
  });

  revalidatePath("/sales/leads");
  revalidatePath("/sales/command");
  return { success: true };
}

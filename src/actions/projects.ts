"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePmRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Project } from "@/types/database";

// Run approaching delivery dates checker
export async function checkApproachingDeliveries() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("notify_approaching_delivery_dates");
  if (error) {
    console.error("Failed to check approaching delivery dates:", error.message);
  }
}

export async function createProject(formData: FormData) {
  const employee = await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  const isMonthlyRetainer = formData.get("is_monthly_retainer") === "true" || formData.get("is_monthly_retainer") === "on";

  const { data, error } = await supabase.from("projects").insert({
    name: formData.get("name") as string,
    client_name: formData.get("client_name") as string,
    company_name: (formData.get("company_name") as string) || null,
    client_email: formData.get("client_email") as string,
    client_contact_number: (formData.get("client_contact_number") as string) || null,
    description: (formData.get("description") as string) || null,
    industry: formData.get("industry") as Project["industry"],
    bd_id: (formData.get("bd_id") as string) || null,
    lead_source: formData.get("lead_source") as Project["lead_source"],
    closing_developer_id: (formData.get("closing_developer_id") as string) || null,
    manager_id: (formData.get("manager_id") as string) || null,
    value: parseFloat(formData.get("value") as string) || 0,
    currency: (formData.get("currency") as string) || "USD",
    is_monthly_retainer: isMonthlyRetainer,
    retainer_amount: isMonthlyRetainer ? (parseFloat(formData.get("retainer_amount") as string) || 0) : 0,
    expected_profit: formData.get("expected_profit") ? parseFloat(formData.get("expected_profit") as string) : null,
    payment_status: (formData.get("payment_status") as Project["payment_status"]) || "Pending",
    start_date: formData.get("start_date") as string,
    expected_delivery_date: formData.get("expected_delivery_date") as string,
    actual_delivery_date: (formData.get("actual_delivery_date") as string) || null,
    status: (formData.get("status") as Project["status"]) || "Lead Won",
    created_by: employee.id,
    updated_by: employee.id,
  }).select().single();

  if (error) return { error: error.message };

  await checkApproachingDeliveries();

  revalidatePath("/projects");
  return { success: true, projectId: data.id };
}

export async function updateProject(projectId: string, formData: FormData) {
  const employee = await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  const status = formData.get("status") as string;
  const isMonthlyRetainer = formData.get("is_monthly_retainer") === "true" || formData.get("is_monthly_retainer") === "on";

  // Double check archiving authorization
  if (status === "Archived" && employee.pm_role !== "admin") {
    return { error: "Only Administrators are allowed to archive projects." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name: formData.get("name") as string,
      client_name: formData.get("client_name") as string,
      company_name: (formData.get("company_name") as string) || null,
      client_email: formData.get("client_email") as string,
      client_contact_number: (formData.get("client_contact_number") as string) || null,
      description: (formData.get("description") as string) || null,
      industry: formData.get("industry") as Project["industry"],
      bd_id: (formData.get("bd_id") as string) || null,
      lead_source: formData.get("lead_source") as Project["lead_source"],
      closing_developer_id: (formData.get("closing_developer_id") as string) || null,
      manager_id: (formData.get("manager_id") as string) || null,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "USD",
      is_monthly_retainer: isMonthlyRetainer,
      retainer_amount: isMonthlyRetainer ? (parseFloat(formData.get("retainer_amount") as string) || 0) : 0,
      expected_profit: formData.get("expected_profit") ? parseFloat(formData.get("expected_profit") as string) : null,
      payment_status: (formData.get("payment_status") as Project["payment_status"]) || "Pending",
      start_date: formData.get("start_date") as string,
      expected_delivery_date: formData.get("expected_delivery_date") as string,
      actual_delivery_date: (formData.get("actual_delivery_date") as string) || null,
      status: status as Project["status"],
      updated_by: employee.id,
    })
    .eq("id", projectId);

  if (error) return { error: error.message };

  await checkApproachingDeliveries();

  revalidatePath(`/projects`);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  await requirePmRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  return { success: true };
}

export async function assignResource(
  projectId: string,
  data: {
    employeeId: string;
    role: string;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
  }
) {
  await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  const { error } = await supabase.from("project_resources").upsert({
    project_id: projectId,
    employee_id: data.employeeId,
    role: data.role,
    allocation_percentage: data.allocationPercentage,
    start_date: data.startDate,
    end_date: data.endDate,
  }, {
    onConflict: "project_id,employee_id,role"
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}

export async function removeResource(projectId: string, assignmentId: string) {
  await requirePmRole("admin", "coordinator");
  const supabase = await createClient();

  const { error } = await supabase.from("project_resources").delete().eq("id", assignmentId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}

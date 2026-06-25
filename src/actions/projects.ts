"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePmRole, getCurrentEmployee } from "@/lib/auth";
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
  const employee = await requirePmRole("admin");
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
    priority: (formData.get("priority") as Project["priority"]) || "Medium",
    progress_percentage: parseInt(formData.get("progress_percentage") as string) || 0,
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
      priority: (formData.get("priority") as Project["priority"]) || "Medium",
      progress_percentage: parseInt(formData.get("progress_percentage") as string) || 0,
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

export async function bulkImportProjects(projects: any[], fileName: string) {
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.pm_role !== "admin")) {
    return { error: "Unauthorized: Admin privileges required." };
  }

  const supabase = await createClient();
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const proj of projects) {
    try {
      const { data: createdProj, error: projErr } = await supabase
        .from("projects")
        .insert({
          name: proj.name,
          client_name: proj.client_name,
          client_email: proj.client_email,
          description: proj.description,
          start_date: proj.start_date,
          expected_delivery_date: proj.expected_delivery_date,
          manager_id: proj.manager_id,
          status: proj.status,
          priority: proj.priority,
          value: proj.value,
          progress_percentage: proj.progress_percentage,
          industry: "Other",
          lead_source: "Other",
          currency: "USD",
          is_monthly_retainer: false,
          retainer_amount: 0,
          payment_status: "Pending",
          created_by: employee.id,
          updated_by: employee.id,
        })
        .select("id")
        .single();

      if (projErr) {
        failedCount++;
        errors.push(`Failed to insert project "${proj.name}": ${projErr.message}`);
        continue;
      }

      successCount++;

      // Insert resources/team members
      if (proj.team_employee_ids && proj.team_employee_ids.length > 0) {
        const resourceRows = proj.team_employee_ids.map((empId: string) => ({
          project_id: createdProj.id,
          employee_id: empId,
          role: "Full Stack Developer",
          allocation_percentage: 100,
          start_date: proj.start_date,
          end_date: proj.expected_delivery_date,
        }));

        const { error: resErr } = await supabase.from("project_resources").insert(resourceRows);
        if (resErr) {
          console.error(`Failed to assign resources for project ${proj.name}:`, resErr.message);
        }
      }
    } catch (err: any) {
      failedCount++;
      errors.push(`System error on project "${proj.name}": ${err.message}`);
    }
  }

  // Create Audit Log
  const { error: auditErr } = await supabase.from("audit_logs").insert({
    actor_id: employee.id,
    action: "Bulk Project Import",
    entity_type: "Project",
    entity_id: null,
    details: {
      fileName,
      totalCount: projects.length,
      successCount,
      failedCount,
      errors: errors.slice(0, 10),
    },
  });

  if (auditErr) {
    console.error("Failed to insert bulk import audit log:", auditErr.message);
  }

  // Notify Admins
  if (successCount > 0) {
    const { data: admins } = await supabase
      .from("employees")
      .select("id")
      .or("role.eq.admin,pm_role.eq.admin")
      .eq("status", "active");

    if (admins && admins.length > 0) {
      const notificationRows = admins.map((admin) => ({
        recipient_id: admin.id,
        type: "bulk_import_completed",
        title: "Bulk Import Completed",
        message: `${employee.full_name} successfully imported ${successCount} projects from "${fileName}".`,
        entity_type: "project",
        entity_id: null,
      }));

      const { error: notifErr } = await supabase.from("notifications").insert(notificationRows);
      if (notifErr) {
        console.error("Failed to insert notifications for admins:", notifErr.message);
      }
    }
  }

  revalidatePath("/projects");
  return { success: true, successCount, failedCount };
}


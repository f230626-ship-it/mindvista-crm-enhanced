"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSalesTeam(formData: FormData) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Team name is required" };

  const description = (formData.get("description") as string) || null;
  const teamLeadId = (formData.get("team_lead_id") as string) || null;
  const memberIdsRaw = (formData.get("member_ids") as string) || "[]";
  let memberIds: string[] = [];
  try { memberIds = JSON.parse(memberIdsRaw); } catch { memberIds = []; }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .single();

  const { data: team, error } = await supabase
    .from("sales_teams")
    .insert({
      name,
      description,
      team_lead_id: teamLeadId,
      created_by: employee?.id ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Add lead as member if specified
  const allMemberIds = new Set<string>();
  if (teamLeadId) allMemberIds.add(teamLeadId);
  for (const id of memberIds) allMemberIds.add(id);

  if (team && allMemberIds.size > 0) {
    await supabase.from("sales_team_members").insert(
      Array.from(allMemberIds).map((eid) => ({ team_id: team.id, employee_id: eid }))
    );
  }

  // Log activity
  if (employee) {
    await supabase.from("sales_activity_logs").insert({
      user_id: employee.id,
      action: "created_team",
      module: "teams",
      metadata: { team_name: name, team_id: team?.id },
    });
  }

  revalidatePath("/sales/teams");
  revalidatePath("/sales/command");
  return { success: true, teamId: team?.id };
}

export async function updateSalesTeam(teamId: string, formData: FormData) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Team name is required" };

  const { error } = await supabase
    .from("sales_teams")
    .update({
      name,
      description: (formData.get("description") as string) || null,
      team_lead_id: (formData.get("team_lead_id") as string) || null,
    })
    .eq("id", teamId);

  if (error) return { error: error.message };
  revalidatePath("/sales/teams");
  revalidatePath(`/sales/teams/${teamId}`);
  return { success: true };
}

export async function archiveSalesTeam(teamId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sales_teams")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", teamId);

  if (error) return { error: error.message };
  revalidatePath("/sales/teams");
  return { success: true };
}

export async function deleteSalesTeam(teamId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sales_teams")
    .delete()
    .eq("id", teamId);

  if (error) return { error: error.message };
  revalidatePath("/sales/teams");
  return { success: true };
}

export async function addTeamMember(teamId: string, employeeId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sales_team_members")
    .insert({ team_id: teamId, employee_id: employeeId });

  if (error) {
    if (error.code === "23505") return { error: "Employee already in this team" };
    return { error: error.message };
  }

  revalidatePath("/sales/teams");
  revalidatePath(`/sales/teams/${teamId}`);
  return { success: true };
}

export async function removeTeamMember(teamId: string, employeeId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sales_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("employee_id", employeeId);

  if (error) return { error: error.message };
  revalidatePath("/sales/teams");
  revalidatePath(`/sales/teams/${teamId}`);
  return { success: true };
}

export async function getSalesTeams() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: teams, error } = await supabase
    .from("sales_teams")
    .select(`
      *,
      team_lead:employees!sales_teams_team_lead_id_fkey(id, full_name, email),
      creator:employees!sales_teams_created_by_fkey(id, full_name),
      members:sales_team_members(
        id, employee_id, created_at,
        employee:employees(id, full_name, email, designation, profile_photo_url, employee_code)
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { teams: [], error: error.message };
  return { teams: teams ?? [], error: null };
}

export async function getSalesTeamById(teamId: string) {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: team, error } = await supabase
    .from("sales_teams")
    .select(`
      *,
      team_lead:employees!sales_teams_team_lead_id_fkey(id, full_name, email),
      creator:employees!sales_teams_created_by_fkey(id, full_name),
      members:sales_team_members(
        id, employee_id, created_at,
        employee:employees(id, full_name, email, designation, profile_photo_url, employee_code)
      )
    `)
    .eq("id", teamId)
    .single();

  if (error) return { team: null, error: error.message };
  return { team, error: null };
}

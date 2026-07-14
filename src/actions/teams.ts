"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { TeamStatus } from "@/types/database";

export async function createTeam(formData: FormData) {
  await requireRole("admin");
  const supabase = createAdminClient();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const leadId = (formData.get("lead_id") as string) || null;
  const status = (formData.get("status") as string) || "active";
  const color = (formData.get("color") as string)?.trim() || null;
  const memberIds = formData.getAll("member_ids") as string[];

  if (!name) {
    return { error: "Team name is required." };
  }

  if (name.length < 2) {
    return { error: "Team name must be at least 2 characters." };
  }

  if (name.length > 100) {
    return { error: "Team name must be less than 100 characters." };
  }

  // Check duplicate name (case-insensitive)
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return { error: "A team with this name already exists." };
  }

  // Validate lead exists and is active
  if (leadId) {
    const { data: lead } = await supabase
      .from("employees")
      .select("id, status")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead || lead.status !== "active") {
      return { error: "Selected team lead is not an active employee." };
    }
  }

  const currentUser = await requireAuth();

  // Insert team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name,
      description,
      lead_id: leadId,
      status,
      color,
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (teamError) {
    console.error("Error creating team:", teamError);
    return { error: teamError.message };
  }

  // Add members (include lead as member too)
  const allMemberIds = new Set(memberIds);
  if (leadId) allMemberIds.add(leadId);

  if (allMemberIds.size > 0) {
    const memberRows = Array.from(allMemberIds).map((empId) => ({
      team_id: team.id,
      employee_id: empId,
      role: empId === leadId ? "lead" : "member",
    }));

    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberRows);

    if (membersError) {
      console.error("Error adding team members:", membersError);
    }
  }

  // Audit log
  await supabase.from("team_audit_logs").insert({
    team_id: team.id,
    actor_id: currentUser.id,
    action: "team_created",
    details: { name, member_count: allMemberIds.size },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/teams/" + team.id);
  return { team };
}

export async function updateTeam(id: string, formData: FormData) {
  await requireRole("admin");
  const supabase = createAdminClient();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const leadId = (formData.get("lead_id") as string) || null;
  const status = (formData.get("status") as string) as TeamStatus;
  const color = (formData.get("color") as string)?.trim() || null;
  const memberIds = formData.getAll("member_ids") as string[];

  if (!name) {
    return { error: "Team name is required." };
  }

  if (name.length < 2) {
    return { error: "Team name must be at least 2 characters." };
  }

  // Check duplicate name (case-insensitive, excluding current team)
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .ilike("name", name)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { error: "A team with this name already exists." };
  }

  // Validate lead
  if (leadId) {
    const { data: lead } = await supabase
      .from("employees")
      .select("id, status")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead || lead.status !== "active") {
      return { error: "Selected team lead is not an active employee." };
    }
  }

  const currentUser = await requireAuth();

  // Update team
  const { error: teamError } = await supabase
    .from("teams")
    .update({
      name,
      description,
      lead_id: leadId,
      status,
      color,
    })
    .eq("id", id);

  if (teamError) {
    console.error("Error updating team:", teamError);
    return { error: teamError.message };
  }

  // Sync members: remove all, re-add
  await supabase.from("team_members").delete().eq("team_id", id);

  const allMemberIds = new Set(memberIds);
  if (leadId) allMemberIds.add(leadId);

  if (allMemberIds.size > 0) {
    const memberRows = Array.from(allMemberIds).map((empId) => ({
      team_id: id,
      employee_id: empId,
      role: empId === leadId ? "lead" : "member",
    }));

    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberRows);

    if (membersError) {
      console.error("Error updating team members:", membersError);
    }
  }

  // Audit log
  await supabase.from("team_audit_logs").insert({
    team_id: id,
    actor_id: currentUser.id,
    action: "team_updated",
    details: { name, member_count: allMemberIds.size, status },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/teams/" + id);
  return { success: true };
}

export async function archiveTeam(id: string) {
  await requireRole("admin");
  const supabase = createAdminClient();
  const currentUser = await requireAuth();

  const { error } = await supabase
    .from("teams")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("team_audit_logs").insert({
    team_id: id,
    actor_id: currentUser.id,
    action: "team_archived",
    details: {},
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/teams/" + id);
  return { success: true };
}

export async function restoreTeam(id: string) {
  await requireRole("admin");
  const supabase = createAdminClient();
  const currentUser = await requireAuth();

  const { error } = await supabase
    .from("teams")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("team_audit_logs").insert({
    team_id: id,
    actor_id: currentUser.id,
    action: "team_restored",
    details: {},
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/teams/" + id);
  return { success: true };
}

export async function deleteTeam(id: string) {
  await requireRole("admin");
  const supabase = createAdminClient();
  const currentUser = await requireAuth();

  // Check if team has linked active projects
  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("team_audit_logs").insert({
    team_id: id,
    actor_id: currentUser.id,
    action: "team_deleted",
    details: { name: team?.name },
  });

  revalidatePath("/admin/teams");
  return { success: true };
}

export async function getTeamWithMembers(id: string) {
  const supabase = createAdminClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select(`
      *,
      lead:employees!teams_lead_id_fkey(id, full_name, email, profile_photo_url),
      creator:employees!teams_created_by_fkey(id, full_name),
      members:team_members(
        id, role, joined_at,
        employee:employees(id, full_name, email, designation, profile_photo_url, employee_code, department_id, status)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !team) return null;

  // Filter out inactive employees from members
  team.members = (team.members ?? []).filter(
    (m: any) => m.employee?.status === "active"
  );

  return team;
}

export async function getAllTeams() {
  const supabase = createAdminClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      *,
      lead:employees!teams_lead_id_fkey(id, full_name, email, profile_photo_url),
      creator:employees!teams_created_by_fkey(id, full_name),
      members:team_members(
        id, role,
        employee:employees(id, full_name, profile_photo_url, status)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return [];

  // Filter inactive from member counts and enrich
  return (teams ?? []).map((team: any) => ({
    ...team,
    members: (team.members ?? []).filter((m: any) => m.employee?.status === "active"),
    member_count: (team.members ?? []).filter((m: any) => m.employee?.status === "active").length,
  }));
}

export async function getActiveEmployees() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, email, designation, employee_code, profile_photo_url, department_id, status, role")
    .eq("status", "active")
    .order("full_name");

  if (error) return [];
  return data ?? [];
}

export async function getTeamAuditLogs(teamId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("team_audit_logs")
    .select(`
      *,
      actor:employees!team_audit_logs_actor_id_fkey(id, full_name)
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data ?? [];
}

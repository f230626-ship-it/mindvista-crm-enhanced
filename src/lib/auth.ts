import { createClient } from "@/lib/supabase/server";
import type { Employee, PMRole } from "@/types/database";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentEmployee = cache(async (): Promise<Employee | null> => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("employees")
    .select("*, department:departments(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load employee profile:", error.message);
  }

  return data as Employee | null;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login?error=no_employee_profile");
  return employee;
}

export async function requireRole(...roles: Employee["role"][]) {
  const employee = await requireAuth();
  if (!roles.includes(employee.role)) redirect("/dashboard");
  return employee;
}

export function isAdmin(role: Employee["role"]) {
  return role === "admin";
}

export function isManagerOrAdmin(role: Employee["role"]) {
  return role === "admin" || role === "manager";
}

export async function requirePmRole(...roles: PMRole[]) {
  const employee = await requireAuth();
  if (!roles.includes(employee.pm_role)) redirect("/dashboard");
  return employee;
}

export function isPmAdmin(role: PMRole) {
  return role === "admin";
}

export function isPmAdminOrCoordinator(role: PMRole) {
  return role === "admin" || role === "coordinator";
}


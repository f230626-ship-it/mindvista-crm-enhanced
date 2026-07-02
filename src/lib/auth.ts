import { createClient } from "@/lib/supabase/server";
import type { Employee, PMRole } from "@/types/database";
import type { AppRole } from "@/lib/auth/types";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";

// ─── Current User (server-verified via getUser()) ──────────────────────────

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// ─── Current Employee ──────────────────────────────────────────────────────

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

// ─── Get role from JWT claims (fast, no DB round-trip) ─────────────────────

export async function getRoleFromClaims(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const appRole = user.app_metadata?.app_role as AppRole | undefined;
  return appRole ?? null;
}

// ─── Page-level guards (redirect on failure) ───────────────────────────────

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

// ─── API-level guards (return 401/403 JSON instead of redirect) ────────────

export async function requireApiAuth(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; employee: Employee }
  | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "No employee profile linked" },
      { status: 401 }
    );
  }

  return { user, employee };
}

export async function requireApiRole(
  ...roles: Employee["role"][]
): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; employee: Employee }
  | NextResponse
> {
  const result = await requireApiAuth();
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.employee.role)) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return result;
}

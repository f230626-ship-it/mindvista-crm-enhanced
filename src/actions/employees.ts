"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { EmploymentType, UserRole, WorkLocation, EmployeeStatus } from "@/types/database";

export async function createEmployee(formData: FormData) {
  await requireRole("admin");

  const adminClient = createAdminClient();
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) return { error: authError.message };

  const { error } = await supabase.from("employees").insert({
    user_id: authData.user.id,
    full_name: fullName,
    email,
    phone: (formData.get("phone") as string) || null,
    designation: (formData.get("designation") as string) || "Employee",
    department_id: (formData.get("department_id") as string) || null,
    manager_id: (formData.get("manager_id") as string) || null,
    employment_type: (formData.get("employment_type") as EmploymentType) || "full_time",
    work_location: (formData.get("work_location") as WorkLocation) || "onsite",
    role: (formData.get("role") as UserRole) || "employee",
    joining_date: (formData.get("joining_date") as string) || new Date().toISOString().split("T")[0],
    basic_salary: formData.get("basic_salary")
      ? parseFloat(formData.get("basic_salary") as string)
      : null,
    allowances: formData.get("allowances")
      ? parseFloat(formData.get("allowances") as string)
      : 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  return { success: true };
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  await requireRole("admin");

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({
      full_name: formData.get("full_name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      designation: formData.get("designation") as string,
      department_id: (formData.get("department_id") as string) || null,
      manager_id: (formData.get("manager_id") as string) || null,
      employment_type: formData.get("employment_type") as EmploymentType,
      work_location: formData.get("work_location") as WorkLocation,
      status: formData.get("status") as EmployeeStatus,
      role: formData.get("role") as UserRole,
      cnic_number: (formData.get("cnic_number") as string) || null,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
      emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
      basic_salary: formData.get("basic_salary")
        ? parseFloat(formData.get("basic_salary") as string)
        : null,
      allowances: formData.get("allowances")
        ? parseFloat(formData.get("allowances") as string)
        : 0,
    })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath("/profile");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const { getCurrentEmployee } = await import("@/lib/auth");
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
      emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
    })
    .eq("id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentEmployee } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { EmploymentType, UserRole, WorkLocation, EmployeeStatus, PMRole } from "@/types/database";

// ─── Validation helpers ────────────────────────────────────────────────────

async function validateEmail(email: string): Promise<string | null> {
  // Basic format validation first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  const domain = email.split('@')[1].toLowerCase();
  
  // Suggest corrections for common typos
  const typoSuggestions: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com', 
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'icould.com': 'icloud.com'
  };

  if (typoSuggestions[domain]) {
    return `Did you mean ${email.replace(domain, typoSuggestions[domain])}?`;
  }

  // For now, just validate format and typos
  // Real email verification can be added later when needed
  
  return null;
}

function validateDob(dob: string | null): string | null {
  if (!dob) return "Date of birth is required";
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return "Invalid date of birth";
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;
  if (actualAge < 18) return "Employee must be at least 18 years old";
  return null;
}

function validateCnic(cnic: string | null): string | null {
  if (!cnic) return "CNIC is required";
  if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) return "CNIC must be in format: 12345-1234567-1";
  return null;
}

export async function createEmployee(formData: FormData) {
  await requireRole("admin");

  const adminClient = createAdminClient();
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  // Server-side validation
  const emailError = await validateEmail(email);
  if (emailError) return { error: emailError };

  const dobError = validateDob(formData.get("date_of_birth") as string | null);
  if (dobError) return { error: dobError };

  const cnicError = validateCnic(formData.get("cnic_number") as string | null);
  if (cnicError) return { error: cnicError };

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    console.error("Auth Error in createEmployee:", authError);
    return { error: authError.message };
  }

  const { error } = await supabase.from("employees").insert({
    user_id: authData.user.id,
    // employee_code is auto-assigned by DB trigger (5-digit unique-digit code)
    full_name: fullName,
    email,
    phone: (formData.get("phone") as string) || null,
    cnic_number: (formData.get("cnic_number") as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    designation: (formData.get("designation") as string) || "Employee",
    department_id: (formData.get("department_id") as string) || null,
    manager_id: (formData.get("manager_id") as string) || null,
    lead_id: (formData.get("lead_id") as string) || null,
    employment_type: (formData.get("employment_type") as EmploymentType) || "full_time",
    work_location: (formData.get("work_location") as WorkLocation) || "onsite",
    role: (formData.get("role") as UserRole) || "employee",
    pm_role: (formData.get("pm_role") as PMRole) || "developer",
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
  const caller = await requireRole("admin");

  // Server-side validation
  const dobError = validateDob(formData.get("date_of_birth") as string | null);
  if (dobError) return { error: dobError };

  const cnicError = validateCnic(formData.get("cnic_number") as string | null);
  if (cnicError) return { error: cnicError };

  const supabase = await createClient();

  // Salary fields are restricted to admin callers only
  const isAdminCaller = caller.role === "admin";

  const { error } = await supabase
    .from("employees")
    .update({
      employee_code: (formData.get("employee_code") as string) || null,
      full_name: formData.get("full_name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      designation: formData.get("designation") as string,
      department_id: (formData.get("department_id") as string) || null,
      manager_id: (formData.get("manager_id") as string) || null,
      lead_id: (formData.get("lead_id") as string) || null,
      employment_type: formData.get("employment_type") as EmploymentType,
      work_location: formData.get("work_location") as WorkLocation,
      status: formData.get("status") as EmployeeStatus,
      role: formData.get("role") as UserRole,
      pm_role: formData.get("pm_role") as PMRole,
      cnic_number: (formData.get("cnic_number") as string) || null,
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      joining_date: (formData.get("joining_date") as string) || undefined,
      emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
      emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
      // Only update salary fields if the caller is admin
      ...(isAdminCaller && {
        basic_salary: formData.get("basic_salary")
          ? parseFloat(formData.get("basic_salary") as string)
          : null,
        allowances: formData.get("allowances")
          ? parseFloat(formData.get("allowances") as string)
          : 0,
      }),
    })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfile(formData: FormData) {
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

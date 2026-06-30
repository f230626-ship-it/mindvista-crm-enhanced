"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentEmployee } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Called after client-side upload — saves the public URL to the employee row */
export async function saveProfilePhotoUrl(photoUrl: string) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ profile_photo_url: photoUrl })
    .eq("id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Admin version — saves photo URL for any employee */
export async function adminSaveEmployeePhotoUrl(employeeId: string, photoUrl: string) {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ profile_photo_url: photoUrl })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function uploadProfilePhoto(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const file = formData.get("photo") as File;
  if (!file || file.size === 0) return { error: "No file selected" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${employee.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
  const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error } = await supabase
    .from("employees")
    .update({ profile_photo_url: photoUrl })
    .eq("id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, url: photoUrl };
}

export async function adminUploadEmployeePhoto(employeeId: string, formData: FormData) {
  await requireRole("admin");

  const file = formData.get("photo") as File;
  if (!file || file.size === 0) return { error: "No file selected" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB" };

  const adminClient = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${employeeId}/avatar.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = adminClient.storage.from("profile-photos").getPublicUrl(path);
  const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error } = await adminClient
    .from("employees")
    .update({ profile_photo_url: photoUrl })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, url: photoUrl };
}


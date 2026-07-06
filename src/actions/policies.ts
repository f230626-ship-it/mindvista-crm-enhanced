"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PolicyCategory } from "@/types/database";

const POLICY_BUCKET = "policies";

export async function createPolicy(formData: FormData) {
  await requireRole("admin");
  const employee = await getCurrentEmployee();

  const supabase = await createClient();

  const title = formData.get("title") as string;
  const category = formData.get("category") as PolicyCategory;
  const description = (formData.get("description") as string) || null;
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  // Generate unique file name
  const timestamp = Date.now();
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const fileExt = file.name.split(".").pop();
  const fileName = `${sanitizedTitle}-${timestamp}.${fileExt}`;
  const filePath = `${category}/${fileName}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(POLICY_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: `File upload failed: ${uploadError.message}` };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(POLICY_BUCKET)
    .getPublicUrl(uploadData.path);

  // Insert policy record
  const { error: dbError } = await supabase.from("policies").insert({
    title,
    category,
    description,
    file_url: urlData.publicUrl,
    file_name: file.name,
    uploaded_by: employee?.id ?? null,
  });

  if (dbError) {
    // Cleanup uploaded file if DB insert fails
    await supabase.storage.from(POLICY_BUCKET).remove([uploadData.path]);
    return { error: `Database error: ${dbError.message}` };
  }

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { success: true };
}

export async function deletePolicy(policyId: string) {
  await requireRole("admin");

  const supabase = await createClient();

  // Get policy to find file path
  const { data: policy } = await supabase
    .from("policies")
    .select("file_url")
    .eq("id", policyId)
    .single();

  // Delete from database
  const { error } = await supabase.from("policies").delete().eq("id", policyId);

  if (error) return { error: error.message };

  // Try to delete file from storage (best effort, don't fail if file doesn't exist)
  if (policy?.file_url) {
    try {
      const urlParts = policy.file_url.split(`${POLICY_BUCKET}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from(POLICY_BUCKET).remove([filePath]);
      }
    } catch {
      // Ignore storage deletion errors
    }
  }

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { success: true };
}

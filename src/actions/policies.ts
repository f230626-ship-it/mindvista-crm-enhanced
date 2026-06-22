"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PolicyCategory } from "@/types/database";

export async function createPolicy(formData: FormData) {
  await requireRole("admin");
  const employee = await getCurrentEmployee();

  const supabase = await createClient();

  const { error } = await supabase.from("policies").insert({
    title: formData.get("title") as string,
    category: formData.get("category") as PolicyCategory,
    description: (formData.get("description") as string) || null,
    file_url: (formData.get("file_url") as string) || null,
    file_name: (formData.get("file_name") as string) || null,
    uploaded_by: employee?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { success: true };
}

export async function deletePolicy(policyId: string) {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("policies").delete().eq("id", policyId);

  if (error) return { error: error.message };

  revalidatePath("/admin/policies");
  revalidatePath("/policies");
  return { success: true };
}

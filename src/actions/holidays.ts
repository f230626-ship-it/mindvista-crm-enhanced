"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createHoliday(formData: FormData) {
  await requireRole("admin");

  const supabase = await createClient();

  const { error } = await supabase.from("holidays").insert({
    name: formData.get("name") as string,
    date: formData.get("date") as string,
    description: (formData.get("description") as string) || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/holidays");
  return { success: true };
}

export async function deleteHoliday(holidayId: string) {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("id", holidayId);

  if (error) return { error: error.message };

  revalidatePath("/admin/holidays");
  return { success: true };
}

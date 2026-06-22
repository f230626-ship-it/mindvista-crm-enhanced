"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AssetType } from "@/types/database";

export async function createAsset(formData: FormData) {
  await requireRole("admin");

  const supabase = await createClient();

  const { error } = await supabase.from("assets").insert({
    name: formData.get("name") as string,
    asset_type: formData.get("asset_type") as AssetType,
    serial_number: (formData.get("serial_number") as string) || null,
    purchase_date: (formData.get("purchase_date") as string) || null,
    condition: (formData.get("condition") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: "available",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/assets");
  return { success: true };
}

export async function assignAsset(formData: FormData) {
  await requireRole("admin");

  const supabase = await createClient();
  const assetId = formData.get("asset_id") as string;
  const employeeId = formData.get("employee_id") as string;

  const { error: assignError } = await supabase.from("asset_assignments").insert({
    asset_id: assetId,
    employee_id: employeeId,
    assigned_date: (formData.get("assigned_date") as string) || new Date().toISOString().split("T")[0],
    notes: (formData.get("notes") as string) || null,
  });

  if (assignError) return { error: assignError.message };

  await supabase.from("assets").update({ status: "assigned" }).eq("id", assetId);

  revalidatePath("/admin/assets");
  revalidatePath("/assets");
  return { success: true };
}

export async function returnAsset(assignmentId: string, assetId: string) {
  await requireRole("admin");

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("asset_assignments")
    .update({ return_date: today })
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  await supabase.from("assets").update({ status: "available" }).eq("id", assetId);

  revalidatePath("/admin/assets");
  revalidatePath("/assets");
  return { success: true };
}

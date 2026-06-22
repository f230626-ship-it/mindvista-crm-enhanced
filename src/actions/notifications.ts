"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const employee = await getCurrentEmployee();
  if (!employee) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", employee.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

export async function getUnreadNotificationCount() {
  const employee = await getCurrentEmployee();
  if (!employee) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", employee.id)
    .is("read_at", null);

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", employee.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", employee.id)
    .is("read_at", null);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

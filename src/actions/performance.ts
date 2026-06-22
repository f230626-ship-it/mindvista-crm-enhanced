"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createGoal(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };
  await requireRole("admin", "manager");

  const supabase = await createClient();

  const { error } = await supabase.from("performance_goals").insert({
    employee_id: formData.get("employee_id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    target_date: (formData.get("target_date") as string) || null,
    created_by: employee.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/performance");
  revalidatePath("/performance");
  return { success: true };
}

export async function updateGoalProgress(goalId: string, completionStatus: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("performance_goals")
    .update({ completion_status: completionStatus })
    .eq("id", goalId);

  if (error) return { error: error.message };

  revalidatePath("/performance");
  revalidatePath("/admin/performance");
  return { success: true };
}

export async function submitReview(formData: FormData) {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated" };
  await requireRole("admin", "manager");

  const supabase = await createClient();

  const { error } = await supabase.from("performance_reviews").insert({
    employee_id: formData.get("employee_id") as string,
    reviewer_id: employee.id,
    review_period: formData.get("review_period") as string,
    strengths: (formData.get("strengths") as string) || null,
    weaknesses: (formData.get("weaknesses") as string) || null,
    improvement_areas: (formData.get("improvement_areas") as string) || null,
    rating: parseInt(formData.get("rating") as string, 10),
    status: "submitted",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/performance");
  revalidatePath("/performance");
  return { success: true };
}

import { createAdminClient } from "@/lib/supabase/admin";

interface GoalCalculation {
  goalId: string;
  calculatedProgress: number;
  metricSource: string;
  actualValue: number;
  targetValue: number;
}

const SALES_KEYWORDS = [
  "connection", "outreach", "message", "reply", "meeting",
  "lead", "proposal", "sales", "prospect", "pitch",
];

const PROJECT_KEYWORDS = [
  "project", "deliver", "complete", "client", "finish",
];

const ATTENDANCE_KEYWORDS = [
  "attendance", "present", "leave", "absent", "punctual",
];

const REVIEW_KEYWORDS = [
  "review", "rating", "score", "performance", "appraisal",
];

function extractNumber(text: string): number | null {
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function detectGoalType(title: string, description: string): "sales" | "project" | "attendance" | "review" | "custom" {
  const combined = `${title} ${description}`.toLowerCase();

  const salesScore = SALES_KEYWORDS.filter((k) => combined.includes(k)).length;
  const projectScore = PROJECT_KEYWORDS.filter((k) => combined.includes(k)).length;
  const attendanceScore = ATTENDANCE_KEYWORDS.filter((k) => combined.includes(k)).length;
  const reviewScore = REVIEW_KEYWORDS.filter((k) => combined.includes(k)).length;

  const max = Math.max(salesScore, projectScore, attendanceScore, reviewScore);
  if (max === 0) return "custom";
  if (salesScore === max) return "sales";
  if (projectScore === max) return "project";
  if (attendanceScore === max) return "attendance";
  return "review";
}

function getPeriodRange(goalCreatedAt: string, targetDate: string | null) {
  const start = new Date(goalCreatedAt);
  const end = targetDate ? new Date(targetDate) : new Date();

  if (end > new Date()) end.setTime(Date.now());

  return {
    from: start.toISOString().split("T")[0],
    to: end.toISOString().split("T")[0],
  };
}

export async function calculateGoalProgress(goal: {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completion_status: number;
  created_at: string;
}): Promise<GoalCalculation> {
  const supabase = createAdminClient();
  const goalType = detectGoalType(goal.title, goal.description || "");
  const targetFromTitle = extractNumber(goal.title) || extractNumber(goal.description || "") || 10;
  const period = getPeriodRange(goal.created_at, goal.target_date);

  let actualValue = 0;
  let targetValue = targetFromTitle;
  let metricSource = "";

  switch (goalType) {
    case "sales": {
      metricSource = "sales_daily_log";
      const { data: logs } = await supabase
        .from("sales_daily_log")
        .select("connections_sent, messages_sent, replies_received, meetings_booked, leads_added, proposals_sent")
        .eq("employee_id", goal.employee_id)
        .gte("log_date", period.from)
        .lte("log_date", period.to);

      if (logs && logs.length > 0) {
        const combined = `${goal.title} ${goal.description || ""}`.toLowerCase();
        if (combined.includes("connection")) {
          actualValue = logs.reduce((sum, l) => sum + (l.connections_sent || 0), 0);
        } else if (combined.includes("message")) {
          actualValue = logs.reduce((sum, l) => sum + (l.messages_sent || 0), 0);
        } else if (combined.includes("reply")) {
          actualValue = logs.reduce((sum, l) => sum + (l.replies_received || 0), 0);
        } else if (combined.includes("meeting")) {
          actualValue = logs.reduce((sum, l) => sum + (l.meetings_booked || 0), 0);
        } else if (combined.includes("lead")) {
          actualValue = logs.reduce((sum, l) => sum + (l.leads_added || 0), 0);
        } else if (combined.includes("proposal")) {
          actualValue = logs.reduce((sum, l) => sum + (l.proposals_sent || 0), 0);
        } else {
          actualValue = logs.reduce((sum, l) => sum + (l.connections_sent || 0), 0);
        }
      }
      break;
    }

    case "project": {
      metricSource = "projects";
      const { data: projects } = await supabase
        .from("projects")
        .select("id, status, progress_percentage, bd_id, closing_developer_id")
        .or(`bd_id.eq.${goal.employee_id},closing_developer_id.eq.${goal.employee_id}`);

      if (projects) {
        const combined = `${goal.title} ${goal.description || ""}`.toLowerCase();
        if (combined.includes("complete") || combined.includes("finish") || combined.includes("deliver")) {
          actualValue = projects.filter((p) => p.status === "Completed").length;
        } else if (combined.includes("progress")) {
          const avg = projects.length > 0
            ? projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length
            : 0;
          actualValue = Math.round(avg);
          targetValue = 100;
        } else {
          actualValue = projects.filter((p) => p.status === "Completed").length;
        }
      }
      break;
    }

    case "attendance": {
      metricSource = "leaves";
      const { data: leaves } = await supabase
        .from("leaves")
        .select("days_count, status")
        .eq("employee_id", goal.employee_id)
        .eq("status", "approved")
        .gte("start_date", period.from)
        .lte("end_date", period.to);

      const totalLeaveDays = leaves?.reduce((sum, l) => sum + (l.days_count || 0), 0) ?? 0;
      const workingDays = Math.max(1, Math.ceil(
        (new Date(period.to).getTime() - new Date(period.from).getTime()) / (1000 * 60 * 60 * 24)
      ) * 5 / 7);
      const attendanceRate = Math.round(((workingDays - totalLeaveDays) / workingDays) * 100);

      actualValue = attendanceRate;
      targetValue = 100;
      metricSource = "leaves (attendance rate)";
      break;
    }

    case "review": {
      metricSource = "performance_reviews";
      const { data: reviews } = await supabase
        .from("performance_reviews")
        .select("rating")
        .eq("employee_id", goal.employee_id)
        .order("created_at", { ascending: false })
        .limit(1);

      actualValue = reviews?.[0]?.rating ?? 0;
      targetValue = targetFromTitle <= 5 ? targetFromTitle : 5;
      break;
    }

    default: {
      metricSource = "manual";
      return {
        goalId: goal.id,
        calculatedProgress: goal.completion_status,
        metricSource,
        actualValue: 0,
        targetValue: 0,
      };
    }
  }

  const calculatedProgress = targetValue > 0
    ? Math.min(100, Math.round((actualValue / targetValue) * 100))
    : 0;

  return {
    goalId: goal.id,
    calculatedProgress,
    metricSource,
    actualValue,
    targetValue,
  };
}

export async function recalculateAllGoals(employeeId?: string): Promise<GoalCalculation[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("performance_goals")
    .select("id, employee_id, title, description, target_date, completion_status, created_at");

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data: goals, error } = await query;
  if (error || !goals) return [];

  const results: GoalCalculation[] = [];

  for (const goal of goals) {
    const result = await calculateGoalProgress(goal);
    results.push(result);

    if (result.metricSource !== "manual") {
      await supabase
        .from("performance_goals")
        .update({ completion_status: result.calculatedProgress })
        .eq("id", goal.id);
    }
  }

  return results;
}

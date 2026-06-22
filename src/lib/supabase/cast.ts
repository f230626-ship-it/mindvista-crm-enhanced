import type {
  Asset,
  AssetAssignment,
  Attendance,
  Department,
  Employee,
  Holiday,
  Leave,
  LeaveBalance,
  PerformanceGoal,
  PerformanceReview,
  Policy,
  Timesheet,
} from "@/types/database";

export function asEmployee(data: unknown) {
  return data as Employee & { department?: Department };
}

export function asEmployees(data: unknown) {
  return (data ?? []) as (Employee & { department?: Department })[];
}

export function asLeave(data: unknown) {
  return data as Leave & { employee?: Pick<Employee, "id" | "full_name" | "email" | "designation"> };
}

export function asLeaves(data: unknown) {
  return (data ?? []) as ReturnType<typeof asLeave>[];
}

export function asLeaveBalance(data: unknown) {
  return data as LeaveBalance;
}

export function asAttendance(data: unknown) {
  return data as Attendance & { employee?: Pick<Employee, "full_name" | "email"> };
}

export function asAttendances(data: unknown) {
  return (data ?? []) as ReturnType<typeof asAttendance>[];
}

export function asTimesheets(data: unknown) {
  return (data ?? []) as Timesheet[];
}

export function asPolicies(data: unknown) {
  return (data ?? []) as Policy[];
}

export function asAssets(data: unknown) {
  return (data ?? []) as Asset[];
}

export function asAssetAssignments(data: unknown) {
  return (data ?? []) as (AssetAssignment & {
    asset?: Asset;
    employee?: Pick<Employee, "id" | "full_name" | "email">;
  })[];
}

export function asGoals(data: unknown) {
  return (data ?? []) as (PerformanceGoal & { employee?: Pick<Employee, "full_name"> })[];
}

export function asReviews(data: unknown) {
  return (data ?? []) as (PerformanceReview & {
    employee?: Pick<Employee, "full_name">;
    reviewer?: Pick<Employee, "id" | "full_name">;
  })[];
}

export function asHolidays(data: unknown) {
  return (data ?? []) as Holiday[];
}

export function asDepartments(data: unknown) {
  return (data ?? []) as Department[];
}

export function asEmployeePick(data: unknown) {
  return (data ?? []) as Pick<Employee, "id" | "full_name">[];
}

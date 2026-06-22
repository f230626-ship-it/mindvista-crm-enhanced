export type UserRole = "admin" | "manager" | "employee";
export type EmploymentType = "full_time" | "intern" | "contract";
export type WorkLocation = "onsite" | "remote" | "hybrid";
export type EmployeeStatus = "active" | "inactive" | "suspended";
export type LeaveType = "sick" | "casual" | "annual" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceType = "office" | "remote" | "half_day" | "absent";
export type AssetType = "laptop" | "monitor" | "phone" | "license" | "other";
export type AssetStatus = "available" | "assigned" | "under_maintenance" | "retired";
export type PolicyCategory = "handbook" | "leave_policy" | "remote_work" | "sops" | "nda" | "other";
export type DocumentType = "cnic" | "offer_letter" | "employment_contract" | "certificate" | "other";
export type PaymentCycle = "monthly" | "bi_weekly" | "weekly";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  employee_code: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  cnic_number: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  joining_date: string;
  designation: string;
  department_id: string | null;
  manager_id: string | null;
  lead_id: string | null;
  employment_type: EmploymentType;
  work_location: WorkLocation;
  status: EmployeeStatus;
  role: UserRole;
  basic_salary: number | null;
  allowances: number | null;
  payment_cycle: PaymentCycle | null;
  bank_name: string | null;
  bank_account_number: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
  manager?: Pick<Employee, "id" | "full_name" | "email">;
  lead?: Pick<Employee, "id" | "full_name" | "email">;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_quota: number;
  sick_quota: number;
  casual_quota: number;
  annual_used: number;
  sick_used: number;
  casual_used: number;
  updated_at: string;
}

export interface Leave {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  days_count: number;
  created_at: string;
  employee?: Pick<Employee, "id" | "full_name" | "email" | "designation">;
  reviewer?: Pick<Employee, "id" | "full_name">;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  attendance_type: AttendanceType;
  notes: string | null;
  created_at: string;
  employee?: Pick<Employee, "id" | "full_name" | "email">;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  date: string;
  task_description: string;
  hours: number;
  created_at: string;
}

export interface Policy {
  id: string;
  title: string;
  category: PolicyCategory;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export interface PerformanceGoal {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completion_status: number;
  created_by: string | null;
  created_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string | null;
  review_period: string;
  strengths: string | null;
  weaknesses: string | null;
  improvement_areas: string | null;
  rating: number | null;
  status: string;
  created_at: string;
  employee?: Pick<Employee, "id" | "full_name" | "designation">;
  reviewer?: Pick<Employee, "id" | "full_name">;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  serial_number: string | null;
  purchase_date: string | null;
  condition: string | null;
  status: AssetStatus;
  notes: string | null;
  created_at: string;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  return_date: string | null;
  notes: string | null;
  created_at: string;
  asset?: Asset;
  employee?: Pick<Employee, "id" | "full_name" | "email">;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

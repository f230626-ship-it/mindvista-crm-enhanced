-- MindVista HRMS - Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE employment_type AS ENUM ('full_time', 'intern', 'contract');
CREATE TYPE work_location AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE leave_type AS ENUM ('sick', 'casual', 'annual', 'unpaid');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE attendance_type AS ENUM ('office', 'remote', 'half_day', 'absent');
CREATE TYPE asset_type AS ENUM ('laptop', 'monitor', 'phone', 'license', 'other');
CREATE TYPE asset_status AS ENUM ('available', 'assigned', 'under_maintenance', 'retired');
CREATE TYPE policy_category AS ENUM ('handbook', 'leave_policy', 'remote_work', 'sops', 'nda', 'other');
CREATE TYPE document_type AS ENUM ('cnic', 'offer_letter', 'employment_contract', 'certificate', 'other');
CREATE TYPE payment_cycle AS ENUM ('monthly', 'bi_weekly', 'weekly');

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees (linked to Supabase Auth)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  profile_photo_url TEXT,
  cnic_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  designation TEXT NOT NULL DEFAULT 'Employee',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employment_type employment_type NOT NULL DEFAULT 'full_time',
  work_location work_location NOT NULL DEFAULT 'onsite',
  status employee_status NOT NULL DEFAULT 'active',
  role user_role NOT NULL DEFAULT 'employee',
  basic_salary DECIMAL(12, 2),
  allowances DECIMAL(12, 2) DEFAULT 0,
  payment_cycle payment_cycle DEFAULT 'monthly',
  bank_name TEXT,
  bank_account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_role ON employees(role);

-- Leave balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  annual_quota INT NOT NULL DEFAULT 20,
  sick_quota INT NOT NULL DEFAULT 10,
  casual_quota INT NOT NULL DEFAULT 5,
  annual_used INT NOT NULL DEFAULT 0,
  sick_used INT NOT NULL DEFAULT 0,
  casual_used INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaves
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  days_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- Holidays
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holidays_date ON holidays(date);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  working_hours DECIMAL(5, 2),
  attendance_type attendance_type NOT NULL DEFAULT 'office',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);

-- Timesheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task_description TEXT NOT NULL,
  hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timesheets_employee_date ON timesheets(employee_id, date);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category policy_category NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  uploaded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee documents
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);

-- Performance goals
CREATE TABLE performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completion_status INT NOT NULL DEFAULT 0 CHECK (completion_status >= 0 AND completion_status <= 100),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_goals_employee_id ON performance_goals(employee_id);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  review_period TEXT NOT NULL,
  strengths TEXT,
  weaknesses TEXT,
  improvement_areas TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_reviews_employee_id ON performance_reviews(employee_id);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  condition TEXT,
  status asset_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset assignments
CREATE TABLE asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_assignments_employee_id ON asset_assignments(employee_id);
CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_employee_role()
RETURNS user_role AS $$
  SELECT role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager_of(target_employee_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = target_employee_id
    AND e.manager_id = get_current_employee_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-create leave balance on employee insert
CREATE OR REPLACE FUNCTION create_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leave_balances (employee_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_employee_created
  AFTER INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION create_leave_balance();

-- Auto-deduct leave balance on approval
CREATE OR REPLACE FUNCTION handle_leave_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    IF NEW.leave_type = 'annual' THEN
      UPDATE leave_balances SET annual_used = annual_used + NEW.days_count, updated_at = NOW()
      WHERE employee_id = NEW.employee_id;
    ELSIF NEW.leave_type = 'sick' THEN
      UPDATE leave_balances SET sick_used = sick_used + NEW.days_count, updated_at = NOW()
      WHERE employee_id = NEW.employee_id;
    ELSIF NEW.leave_type = 'casual' THEN
      UPDATE leave_balances SET casual_used = casual_used + NEW.days_count, updated_at = NOW()
      WHERE employee_id = NEW.employee_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_leave_status_change
  AFTER UPDATE ON leaves
  FOR EACH ROW EXECUTE FUNCTION handle_leave_approval();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER policies_updated_at
  BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Departments: all authenticated can read, admin can manage
CREATE POLICY "departments_select" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments_admin" ON departments FOR ALL TO authenticated USING (is_admin());

-- Employees
CREATE POLICY "employees_select_self" ON employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin() OR is_manager_of(id) OR manager_id = get_current_employee_id());
CREATE POLICY "employees_insert_admin" ON employees FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "employees_update" ON employees FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "employees_delete_admin" ON employees FOR DELETE TO authenticated USING (is_admin());

-- Leave balances
CREATE POLICY "leave_balances_select" ON leave_balances FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "leave_balances_admin" ON leave_balances FOR ALL TO authenticated USING (is_admin());

-- Leaves
CREATE POLICY "leaves_select" ON leaves FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "leaves_insert" ON leaves FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id());
CREATE POLICY "leaves_update" ON leaves FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR is_manager_of(employee_id)
    OR (employee_id = get_current_employee_id() AND status = 'pending')
  );

-- Holidays
CREATE POLICY "holidays_select" ON holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "holidays_admin" ON holidays FOR ALL TO authenticated USING (is_admin());

-- Attendance
CREATE POLICY "attendance_select" ON attendance FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "attendance_insert" ON attendance FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id() OR is_admin());
CREATE POLICY "attendance_update" ON attendance FOR UPDATE TO authenticated
  USING (employee_id = get_current_employee_id() OR is_admin());

-- Timesheets
CREATE POLICY "timesheets_select" ON timesheets FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "timesheets_insert" ON timesheets FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id());
CREATE POLICY "timesheets_update" ON timesheets FOR UPDATE TO authenticated
  USING (employee_id = get_current_employee_id() OR is_admin());
CREATE POLICY "timesheets_delete" ON timesheets FOR DELETE TO authenticated
  USING (employee_id = get_current_employee_id() OR is_admin());

-- Policies
CREATE POLICY "policies_select" ON policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "policies_admin" ON policies FOR ALL TO authenticated USING (is_admin());

-- Employee documents
CREATE POLICY "employee_documents_select" ON employee_documents FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "employee_documents_insert" ON employee_documents FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id() OR is_admin());
CREATE POLICY "employee_documents_delete" ON employee_documents FOR DELETE TO authenticated
  USING (employee_id = get_current_employee_id() OR is_admin());

-- Performance goals
CREATE POLICY "performance_goals_select" ON performance_goals FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "performance_goals_manage" ON performance_goals FOR ALL TO authenticated
  USING (is_admin() OR is_manager_of(employee_id) OR created_by = get_current_employee_id());

-- Performance reviews
CREATE POLICY "performance_reviews_select" ON performance_reviews FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR reviewer_id = get_current_employee_id()
    OR is_manager_of(employee_id)
  );
CREATE POLICY "performance_reviews_manage" ON performance_reviews FOR ALL TO authenticated
  USING (is_admin() OR reviewer_id = get_current_employee_id() OR is_manager_of(employee_id));

-- Assets
CREATE POLICY "assets_select" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "assets_admin" ON assets FOR ALL TO authenticated USING (is_admin());

-- Asset assignments
CREATE POLICY "asset_assignments_select" ON asset_assignments FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_or_admin()
  );
CREATE POLICY "asset_assignments_admin" ON asset_assignments FOR ALL TO authenticated USING (is_admin());

-- Audit logs
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('employee-documents', 'employee-documents', false),
--   ('company-policies', 'company-policies', false),
--   ('assets-media', 'assets-media', false);

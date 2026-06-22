-- Hierarchy, employee fields, notifications, and lead-based leave approval

-- New employee fields
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_lead_id ON employees(lead_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id) WHERE read_at IS NULL;

-- Lead helper
CREATE OR REPLACE FUNCTION is_lead_of(target_employee_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = target_employee_id
    AND e.lead_id = get_current_employee_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Can see employee in hierarchy (direct report or direct lead)
CREATE OR REPLACE FUNCTION is_in_my_hierarchy(target_employee_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = target_employee_id
    AND (
      e.manager_id = get_current_employee_id()
      OR e.lead_id = get_current_employee_id()
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Protect admin-only fields from employee self-updates
CREATE OR REPLACE FUNCTION protect_employee_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin() AND OLD.user_id = auth.uid() THEN
    NEW.employee_code := OLD.employee_code;
    NEW.date_of_birth := OLD.date_of_birth;
    NEW.joining_date := OLD.joining_date;
    NEW.cnic_number := OLD.cnic_number;
    NEW.manager_id := OLD.manager_id;
    NEW.lead_id := OLD.lead_id;
    NEW.department_id := OLD.department_id;
    NEW.designation := OLD.designation;
    NEW.employment_type := OLD.employment_type;
    NEW.work_location := OLD.work_location;
    NEW.status := OLD.status;
    NEW.role := OLD.role;
    NEW.basic_salary := OLD.basic_salary;
    NEW.allowances := OLD.allowances;
    NEW.payment_cycle := OLD.payment_cycle;
    NEW.bank_name := OLD.bank_name;
    NEW.bank_account_number := OLD.bank_account_number;
    NEW.full_name := OLD.full_name;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_employee_fields ON employees;
CREATE TRIGGER protect_employee_fields
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION protect_employee_admin_fields();

-- Notify lead when leave is applied
CREATE OR REPLACE FUNCTION notify_lead_on_leave_request()
RETURNS TRIGGER AS $$
DECLARE
  lead_emp_id UUID;
  applicant_name TEXT;
BEGIN
  SELECT lead_id, full_name INTO lead_emp_id, applicant_name
  FROM employees WHERE id = NEW.employee_id;

  IF lead_emp_id IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
    VALUES (
      lead_emp_id,
      'leave_request',
      'New leave request',
      applicant_name || ' applied for leave (' || NEW.days_count || ' day(s))',
      'leave',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_leave_applied ON leaves;
CREATE TRIGGER on_leave_applied
  AFTER INSERT ON leaves
  FOR EACH ROW EXECUTE FUNCTION notify_lead_on_leave_request();

-- Update RLS: employees visibility for hierarchy
DROP POLICY IF EXISTS "employees_select_self" ON employees;
CREATE POLICY "employees_select_self" ON employees FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR is_manager_of(id)
    OR is_lead_of(id)
    OR is_in_my_hierarchy(id)
    OR manager_id = get_current_employee_id()
    OR lead_id = get_current_employee_id()
  );

-- Leaves: leads can view and approve
DROP POLICY IF EXISTS "leaves_select" ON leaves;
CREATE POLICY "leaves_select" ON leaves FOR SELECT TO authenticated
  USING (
    employee_id = get_current_employee_id()
    OR is_admin()
    OR is_manager_of(employee_id)
    OR is_lead_of(employee_id)
  );

DROP POLICY IF EXISTS "leaves_update" ON leaves;
CREATE POLICY "leaves_update" ON leaves FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR is_manager_of(employee_id)
    OR is_lead_of(employee_id)
    OR (employee_id = get_current_employee_id() AND status = 'pending')
  );

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated
  USING (recipient_id = get_current_employee_id() OR is_admin());

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated
  USING (recipient_id = get_current_employee_id());

CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Profile photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_photos_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_upload_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = get_current_employee_id()::text
  );

CREATE POLICY "profile_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = get_current_employee_id()::text
  );

CREATE POLICY "profile_photos_admin" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'profile-photos' AND is_admin());

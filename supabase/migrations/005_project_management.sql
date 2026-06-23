-- MindVista HRMS - Project Management Module Schema
-- Execute this in the Supabase SQL Editor

-- 1. Create PM Role Enum
CREATE TYPE pm_role AS ENUM ('admin', 'coordinator', 'bd', 'developer');

-- 2. Add pm_role column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pm_role pm_role NOT NULL DEFAULT 'developer';

-- Update existing admin accounts to have 'admin' pm_role
UPDATE employees SET pm_role = 'admin' WHERE role = 'admin';

-- 3. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT,
  client_email TEXT NOT NULL,
  client_contact_number TEXT,
  description TEXT,
  industry TEXT NOT NULL CHECK (industry IN ('Real Estate', 'Healthcare', 'Restaurant', 'Hotel', 'E-commerce', 'Other')),
  
  -- Ownership
  bd_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  lead_source TEXT NOT NULL CHECK (lead_source IN ('Fiverr', 'Upwork', 'LinkedIn', 'Website', 'Referral', 'Cold Email', 'Other')),
  closing_developer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Financials
  value DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_monthly_retainer BOOLEAN NOT NULL DEFAULT FALSE,
  retainer_amount DECIMAL(12, 2) DEFAULT 0,
  expected_profit DECIMAL(12, 2),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
  
  -- Timelines
  start_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'Lead Won' CHECK (status IN ('Lead Won', 'Onboarding', 'In Progress', 'On Hold', 'Completed', 'Maintenance', 'Paused', 'Cancelled', 'Archived')),
  
  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_bd_id ON projects(bd_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);

-- 4. Create Project Resources (Allocation) Table
CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Designer', 'QA', 'AI Engineer', 'DevOps', 'Project Manager')),
  allocation_percentage INT NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, employee_id, role)
);

CREATE INDEX IF NOT EXISTS idx_project_resources_project ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_employee ON project_resources(employee_id);

-- 5. Create Project Audit Logs Table (Append-only)
CREATE TABLE IF NOT EXISTS project_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_audit_logs_project ON project_audit_logs(project_id, created_at DESC);

-- 6. Helper Functions for RLS
CREATE OR REPLACE FUNCTION get_current_employee_pm_role()
RETURNS pm_role AS $$
  SELECT pm_role FROM employees WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND bd_id = get_current_employee_id())
    OR (get_current_employee_pm_role() = 'developer' AND EXISTS (
      SELECT 1 FROM project_resources
      WHERE project_resources.project_id = id
        AND project_resources.employee_id = get_current_employee_id()
    ))
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
  );

CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
  )
  WITH CHECK (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
  );

CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
  USING (
    get_current_employee_pm_role() = 'admin'
  );

-- RLS Policies for Project Resources
CREATE POLICY "project_resources_select" ON project_resources FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.bd_id = get_current_employee_id()
    ))
    OR (get_current_employee_pm_role() = 'developer' AND employee_id = get_current_employee_id())
  );

CREATE POLICY "project_resources_modify" ON project_resources FOR ALL TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
  )
  WITH CHECK (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
  );

-- RLS Policies for Project Audit Logs
CREATE POLICY "project_audit_logs_select" ON project_audit_logs FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.bd_id = get_current_employee_id()
    ))
    OR (get_current_employee_pm_role() = 'developer' AND EXISTS (
      SELECT 1 FROM project_resources
      WHERE project_resources.project_id = project_id AND project_resources.employee_id = get_current_employee_id()
    ))
  );

CREATE POLICY "project_audit_logs_insert" ON project_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies are created for project_audit_logs, rendering them permanent and non-deletable.

-- 8. Audit Logging Triggers
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO project_audit_logs (project_id, actor_id, action, details)
    VALUES (NEW.id, get_current_employee_id(), 'Created Project', jsonb_build_object(
      'name', NEW.name,
      'client_name', NEW.client_name,
      'status', NEW.status,
      'value', NEW.value
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check coordinator restrictions (cannot set status to 'Archived' or update status if it is archived)
    IF OLD.status != NEW.status AND NEW.status = 'Archived' AND get_current_employee_pm_role() != 'admin' THEN
      RAISE EXCEPTION 'Only Administrators can archive projects';
    END IF;
    
    IF OLD.name != NEW.name THEN changes := changes || jsonb_build_object('name', jsonb_build_array(OLD.name, NEW.name)); END IF;
    IF OLD.client_name != NEW.client_name THEN changes := changes || jsonb_build_object('client_name', jsonb_build_array(OLD.client_name, NEW.client_name)); END IF;
    IF OLD.status != NEW.status THEN changes := changes || jsonb_build_object('status', jsonb_build_array(OLD.status, NEW.status)); END IF;
    IF OLD.value != NEW.value THEN changes := changes || jsonb_build_object('value', jsonb_build_array(OLD.value, NEW.value)); END IF;
    IF OLD.expected_delivery_date != NEW.expected_delivery_date THEN changes := changes || jsonb_build_object('expected_delivery_date', jsonb_build_array(OLD.expected_delivery_date, NEW.expected_delivery_date)); END IF;
    IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN changes := changes || jsonb_build_object('manager_id', jsonb_build_array(OLD.manager_id, NEW.manager_id)); END IF;
    IF OLD.bd_id IS DISTINCT FROM NEW.bd_id THEN changes := changes || jsonb_build_object('bd_id', jsonb_build_array(OLD.bd_id, NEW.bd_id)); END IF;
    
    IF changes != '{}'::jsonb THEN
      INSERT INTO project_audit_logs (project_id, actor_id, action, details)
      VALUES (NEW.id, get_current_employee_id(), 'Updated Project', changes);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_project_changes
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_project_changes();

-- Trigger on project_resources to log assignments
CREATE OR REPLACE FUNCTION log_project_resource_changes()
RETURNS TRIGGER AS $$
DECLARE
  emp_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT full_name INTO emp_name FROM employees WHERE id = NEW.employee_id;
    INSERT INTO project_audit_logs (project_id, actor_id, action, details)
    VALUES (NEW.project_id, get_current_employee_id(), 'Assigned Resource', jsonb_build_object(
      'employee_id', NEW.employee_id,
      'employee_name', emp_name,
      'role', NEW.role,
      'allocation', NEW.allocation_percentage
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT full_name INTO emp_name FROM employees WHERE id = NEW.employee_id;
    INSERT INTO project_audit_logs (project_id, actor_id, action, details)
    VALUES (NEW.project_id, get_current_employee_id(), 'Updated Resource Assignment', jsonb_build_object(
      'employee_id', NEW.employee_id,
      'employee_name', emp_name,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'old_allocation', OLD.allocation_percentage,
      'new_allocation', NEW.allocation_percentage
    ));
  ELSIF TG_OP = 'DELETE' THEN
    SELECT full_name INTO emp_name FROM employees WHERE id = OLD.employee_id;
    INSERT INTO project_audit_logs (project_id, actor_id, action, details)
    VALUES (OLD.project_id, get_current_employee_id(), 'Unassigned Resource', jsonb_build_object(
      'employee_id', OLD.employee_id,
      'employee_name', emp_name,
      'role', OLD.role
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_project_resource_changes
  AFTER INSERT OR UPDATE OR DELETE ON project_resources
  FOR EACH ROW EXECUTE FUNCTION log_project_resource_changes();

-- 9. In-App Notifications Triggers
CREATE OR REPLACE FUNCTION handle_project_notifications()
RETURNS TRIGGER AS $$
DECLARE
  res_rec RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify PM/Coordinator
    IF NEW.manager_id IS NOT NULL THEN
      INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
      VALUES (NEW.manager_id, 'project_created', 'New Project Created', 'Project ' || NEW.name || ' has been created and assigned to you as Project Manager.', 'project', NEW.id);
    END IF;
    -- Notify BD
    IF NEW.bd_id IS NOT NULL THEN
      INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
      VALUES (NEW.bd_id, 'project_created', 'New Project Created', 'Project ' || NEW.name || ' linked to your deal has been created.', 'project', NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Notify status changed
    IF OLD.status != NEW.status THEN
      -- Notify PM
      IF NEW.manager_id IS NOT NULL THEN
        INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
        VALUES (NEW.manager_id, 'project_status_changed', 'Project Status Updated', 'Project ' || NEW.name || ' status has been changed to ' || NEW.status || '.', 'project', NEW.id);
      END IF;
      -- Notify BD
      IF NEW.bd_id IS NOT NULL THEN
        INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
        VALUES (NEW.bd_id, 'project_status_changed', 'Project Status Updated', 'Project ' || NEW.name || ' status has been changed to ' || NEW.status || '.', 'project', NEW.id);
      END IF;
      -- Notify all resources
      FOR res_rec IN SELECT employee_id FROM project_resources WHERE project_id = NEW.id LOOP
        INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
        VALUES (res_rec.employee_id, 'project_status_changed', 'Project Status Updated', 'Project ' || NEW.name || ' status has been changed to ' || NEW.status || '.', 'project', NEW.id);
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_project_notifications
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_project_notifications();

-- Trigger on project_resources to notify assigned resources
CREATE OR REPLACE FUNCTION handle_resource_notifications()
RETURNS TRIGGER AS $$
DECLARE
  p_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO p_name FROM projects WHERE id = NEW.project_id;
    INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
    VALUES (NEW.employee_id, 'resource_assigned', 'Assigned to Project', 'You have been assigned to project ' || p_name || ' as ' || NEW.role || ' (' || NEW.allocation_percentage || '% allocation).', 'project', NEW.project_id);
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO p_name FROM projects WHERE id = OLD.project_id;
    INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
    VALUES (OLD.employee_id, 'resource_unassigned', 'Removed from Project', 'You have been unassigned from project ' || p_name || '.', 'project', OLD.project_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_resource_notifications
  AFTER INSERT OR DELETE ON project_resources
  FOR EACH ROW EXECUTE FUNCTION handle_resource_notifications();

-- 10. Function to check approaching delivery dates
CREATE OR REPLACE FUNCTION notify_approaching_delivery_dates()
RETURNS VOID AS $$
DECLARE
  p RECORD;
  r RECORD;
BEGIN
  FOR p IN 
    SELECT id, name, expected_delivery_date, manager_id, bd_id 
    FROM projects 
    WHERE status NOT IN ('Completed', 'Cancelled', 'Archived')
      AND expected_delivery_date >= CURRENT_DATE 
      AND expected_delivery_date <= CURRENT_DATE + INTERVAL '7 days'
  LOOP
    -- Notify PM
    IF p.manager_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE recipient_id = p.manager_id 
        AND entity_type = 'project' 
        AND entity_id = p.id 
        AND type = 'delivery_approaching'
        AND created_at >= CURRENT_DATE - INTERVAL '3 days'
    ) THEN
      INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
      VALUES (p.manager_id, 'delivery_approaching', 'Project Delivery Approaching', 'Project ' || p.name || ' is expected to be delivered on ' || p.expected_delivery_date || '.', 'project', p.id);
    END IF;

    -- Notify BD
    IF p.bd_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE recipient_id = p.bd_id 
        AND entity_type = 'project' 
        AND entity_id = p.id 
        AND type = 'delivery_approaching'
        AND created_at >= CURRENT_DATE - INTERVAL '3 days'
    ) THEN
      INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
      VALUES (p.bd_id, 'delivery_approaching', 'Project Delivery Approaching', 'Project ' || p.name || ' is expected to be delivered on ' || p.expected_delivery_date || '.', 'project', p.id);
    END IF;

    -- Notify Resources
    FOR r IN SELECT employee_id FROM project_resources WHERE project_id = p.id LOOP
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE recipient_id = r.employee_id 
          AND entity_type = 'project' 
          AND entity_id = p.id 
          AND type = 'delivery_approaching'
          AND created_at >= CURRENT_DATE - INTERVAL '3 days'
      ) THEN
        INSERT INTO notifications (recipient_id, type, title, message, entity_type, entity_id)
        VALUES (r.employee_id, 'delivery_approaching', 'Project Delivery Approaching', 'Project ' || p.name || ' is expected to be delivered on ' || p.expected_delivery_date || '.', 'project', p.id);
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

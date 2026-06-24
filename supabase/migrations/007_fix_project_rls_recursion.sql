-- MindVista CRM – Migration 007 (RLS Infinite Recursion Fix)
-- 1. Create SECURITY DEFINER helper functions to check project ownership/resource assignments.
-- 2. Drop and recreate policies for projects, project_resources, and project_audit_logs.

-- ============================================================
-- 1. CREATE HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================

-- Checks if an employee is a resource assigned to a project, bypassing RLS
CREATE OR REPLACE FUNCTION is_project_resource(p_id UUID, emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_resources
    WHERE project_id = p_id AND employee_id = emp_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Checks if an employee is the business developer of a project, bypassing RLS
CREATE OR REPLACE FUNCTION is_project_bd(p_id UUID, emp_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_id AND bd_id = emp_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "project_resources_select" ON project_resources;
DROP POLICY IF EXISTS "project_audit_logs_select" ON project_audit_logs;

-- ============================================================
-- 3. RECREATE POLICIES USING HELPERS TO PREVENT RECURSION
-- ============================================================

-- projects SELECT policy
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND bd_id = get_current_employee_id())
    OR (get_current_employee_pm_role() = 'developer' AND is_project_resource(id, get_current_employee_id()))
  );

-- project_resources SELECT policy
CREATE POLICY "project_resources_select" ON project_resources FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND is_project_bd(project_id, get_current_employee_id()))
    OR (get_current_employee_pm_role() = 'developer' AND employee_id = get_current_employee_id())
  );

-- project_audit_logs SELECT policy
CREATE POLICY "project_audit_logs_select" ON project_audit_logs FOR SELECT TO authenticated
  USING (
    get_current_employee_pm_role() IN ('admin', 'coordinator')
    OR (get_current_employee_pm_role() = 'bd' AND is_project_bd(project_id, get_current_employee_id()))
    OR (get_current_employee_pm_role() = 'developer' AND is_project_resource(project_id, get_current_employee_id()))
  );

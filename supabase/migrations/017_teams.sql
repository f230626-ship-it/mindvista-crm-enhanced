-- Migration 017: Teams feature
-- Creates teams and team_members tables with RLS policies

-- ─── Teams table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  lead_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  color TEXT,
  icon TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name_lower ON teams (lower(name));
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams (status);
CREATE INDEX IF NOT EXISTS idx_teams_lead_id ON teams (lead_id);

COMMENT ON TABLE teams IS 'Organizational teams within the HRMS';

-- ─── Team Members junction table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members (employee_id);

COMMENT ON TABLE team_members IS 'Junction table linking employees to teams';

-- ─── Auto-generate team code ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TRIGGER AS $$
DECLARE
  next_code INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INT)), 0) + 1
  INTO next_code
  FROM teams
  WHERE code ~ '^TM[0-9]+$';

  NEW.code := 'TM' || LPAD(next_code::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_generate_team_code
  BEFORE INSERT ON teams
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_team_code();

-- ─── Auto-update updated_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- ─── RLS Policies ─────────────────────────────────────────────────────────
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams: All authenticated users can view
CREATE POLICY "teams_select_authenticated"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- Teams: Only admins can insert
CREATE POLICY "teams_insert_admin"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Teams: Only admins can update
CREATE POLICY "teams_update_admin"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Teams: Only admins can delete (soft-delete via status='archived' preferred)
CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Team Members: All authenticated users can view
CREATE POLICY "team_members_select_authenticated"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

-- Team Members: Only admins can insert
CREATE POLICY "team_members_insert_admin"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Team Members: Only admins can update
CREATE POLICY "team_members_update_admin"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Team Members: Only admins can delete
CREATE POLICY "team_members_delete_admin"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- ─── Team audit log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_audit_logs_team_id ON team_audit_logs (team_id);

ALTER TABLE team_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_audit_logs_select_authenticated"
  ON team_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "team_audit_logs_insert_authenticated"
  ON team_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

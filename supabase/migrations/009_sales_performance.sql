-- Sales performance: profiles, daily logs, targets, sheet snapshots

CREATE TABLE IF NOT EXISTS sales_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'linkedin',
  google_sheet_id TEXT,
  sheet_tab_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_profiles_employee ON sales_profiles(employee_id);

CREATE TABLE IF NOT EXISTS sales_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES sales_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  connections_sent INT NOT NULL DEFAULT 0,
  connections_accepted INT NOT NULL DEFAULT 0,
  messages_sent INT NOT NULL DEFAULT 0,
  replies_received INT NOT NULL DEFAULT 0,
  follow_ups_done INT NOT NULL DEFAULT 0,
  meetings_booked INT NOT NULL DEFAULT 0,
  leads_added INT NOT NULL DEFAULT 0,
  proposals_sent INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_sales_daily_logs_employee_date ON sales_daily_logs(employee_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_daily_logs_date ON sales_daily_logs(log_date);

CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
  connections_daily INT NOT NULL DEFAULT 50,
  messages_daily INT NOT NULL DEFAULT 20,
  follow_ups_daily INT NOT NULL DEFAULT 10,
  meetings_weekly INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_sheet_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES sales_profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_leads INT NOT NULL DEFAULT 0,
  follow_up INT NOT NULL DEFAULT 0,
  intro_call INT NOT NULL DEFAULT 0,
  trying_to_call INT NOT NULL DEFAULT 0,
  won_mtd INT NOT NULL DEFAULT 0,
  status_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_sales_sheet_snapshots_date ON sales_sheet_snapshots(snapshot_date DESC);

-- Helpers
CREATE OR REPLACE FUNCTION is_sales_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_sales_rep()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR pm_role = 'bd')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owns_sales_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_profiles
    WHERE id = profile_id AND employee_id = get_current_employee_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE sales_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_sheet_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_profiles_select" ON sales_profiles FOR SELECT TO authenticated
  USING (is_sales_admin() OR employee_id = get_current_employee_id());

CREATE POLICY "sales_profiles_admin" ON sales_profiles FOR ALL TO authenticated
  USING (is_sales_admin()) WITH CHECK (is_sales_admin());

CREATE POLICY "sales_daily_logs_select" ON sales_daily_logs FOR SELECT TO authenticated
  USING (is_sales_admin() OR employee_id = get_current_employee_id());

CREATE POLICY "sales_daily_logs_insert" ON sales_daily_logs FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id() AND owns_sales_profile(profile_id));

CREATE POLICY "sales_daily_logs_update" ON sales_daily_logs FOR UPDATE TO authenticated
  USING (employee_id = get_current_employee_id())
  WITH CHECK (employee_id = get_current_employee_id());

CREATE POLICY "sales_targets_select" ON sales_targets FOR SELECT TO authenticated
  USING (is_sales_admin() OR employee_id = get_current_employee_id());

CREATE POLICY "sales_targets_admin" ON sales_targets FOR ALL TO authenticated
  USING (is_sales_admin()) WITH CHECK (is_sales_admin());

CREATE POLICY "sales_sheet_snapshots_select" ON sales_sheet_snapshots FOR SELECT TO authenticated
  USING (
    is_sales_admin()
    OR EXISTS (
      SELECT 1 FROM sales_profiles p
      WHERE p.id = profile_id AND p.employee_id = get_current_employee_id()
    )
  );

CREATE POLICY "sales_sheet_snapshots_admin" ON sales_sheet_snapshots FOR ALL TO authenticated
  USING (is_sales_admin()) WITH CHECK (is_sales_admin());

CREATE TRIGGER sales_profiles_updated_at
  BEFORE UPDATE ON sales_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sales_daily_logs_updated_at
  BEFORE UPDATE ON sales_daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

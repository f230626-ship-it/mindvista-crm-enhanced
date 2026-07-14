-- ============================================================
-- Migration 018: Sales Teams, Leads, Meetings, Activity Logs, Weekly Reports
-- ============================================================

-- 1. Sales Teams
CREATE TABLE IF NOT EXISTS public.sales_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sales_teams_lead ON public.sales_teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_teams_status ON public.sales_teams(status) WHERE deleted_at IS NULL;

-- 2. Sales Team Members
CREATE TABLE IF NOT EXISTS public.sales_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.sales_teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_team_members_team ON public.sales_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_team_members_employee ON public.sales_team_members(employee_id);

-- 3. Outreach Profiles (enhanced — extend existing sales_profiles)
ALTER TABLE public.sales_profiles
  ADD COLUMN IF NOT EXISTS linkedin_email TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_username TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_image TEXT,
  ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES public.sales_teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- 4. Sales Leads
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.sales_profiles(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'cold' CHECK (status IN ('cold', 'contacted', 'replied', 'interested', 'meeting_booked', 'closed', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_employee ON public.sales_leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_profile ON public.sales_leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);

-- 5. Sales Meetings
CREATE TABLE IF NOT EXISTS public.sales_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_meetings_employee ON public.sales_meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_lead ON public.sales_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_date ON public.sales_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_status ON public.sales_meetings(status);

-- 6. Sales Activity Logs (audit trail)
CREATE TABLE IF NOT EXISTS public.sales_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_activity_logs_user ON public.sales_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_activity_logs_module ON public.sales_activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_sales_activity_logs_created ON public.sales_activity_logs(created_at DESC);

-- 7. Weekly Reports (stored snapshots)
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  total_connections INT NOT NULL DEFAULT 0,
  total_messages INT NOT NULL DEFAULT 0,
  total_replies INT NOT NULL DEFAULT 0,
  total_meetings INT NOT NULL DEFAULT 0,
  total_leads INT NOT NULL DEFAULT 0,
  total_followups INT NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  reply_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  top_performer_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  needs_attention_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  pipeline_summary JSONB,
  recommendations TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON public.weekly_reports(week_start DESC);

-- 8. Enhance sales_targets with monthly_goal and audit fields
ALTER TABLE public.sales_targets
  ADD COLUMN IF NOT EXISTS monthly_goal INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- 9. Enhance sales_daily_logs with screenshot
ALTER TABLE public.sales_daily_logs
  ADD COLUMN IF NOT EXISTS screenshot TEXT;

-- 10. RLS Policies
ALTER TABLE public.sales_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Admins can manage teams" ON public.sales_teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Team members can view their teams" ON public.sales_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_team_members stm
      JOIN public.employees e ON e.id = stm.employee_id
      WHERE stm.team_id = sales_teams.id AND e.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Team members policies
CREATE POLICY "Admins can manage team members" ON public.sales_team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Team members can view own team membership" ON public.sales_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_team_members.employee_id AND e.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Leads policies
CREATE POLICY "Admins can manage all leads" ON public.sales_leads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Employees can view own leads" ON public.sales_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_leads.employee_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert own leads" ON public.sales_leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_leads.employee_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own leads" ON public.sales_leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_leads.employee_id AND e.user_id = auth.uid()
    )
  );

-- Meetings policies
CREATE POLICY "Admins can manage all meetings" ON public.sales_meetings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Employees can view own meetings" ON public.sales_meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_meetings.employee_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert own meetings" ON public.sales_meetings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_meetings.employee_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update own meetings" ON public.sales_meetings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_meetings.employee_id AND e.user_id = auth.uid()
    )
  );

-- Activity logs policies (admin read, all insert own)
CREATE POLICY "Admins can view all activity logs" ON public.sales_activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own activity logs" ON public.sales_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = sales_activity_logs.user_id AND e.user_id = auth.uid()
    )
  );

-- Weekly reports policies
CREATE POLICY "Admins can manage weekly reports" ON public.weekly_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.employees WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All sales users can view weekly reports" ON public.weekly_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE user_id = auth.uid()
      AND (role = 'admin' OR pm_role = 'bd')
    )
  );

-- 11. updated_at triggers for new tables
CREATE OR REPLACE FUNCTION public.update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sales_teams_updated_at
  BEFORE UPDATE ON public.sales_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_sales_updated_at();

CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_sales_updated_at();

CREATE TRIGGER update_sales_meetings_updated_at
  BEFORE UPDATE ON public.sales_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_sales_updated_at();

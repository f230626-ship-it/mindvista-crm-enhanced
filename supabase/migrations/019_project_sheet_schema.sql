-- Migration 019: Add sheet-mirror columns to projects table
-- Adds: project_type, payment_structure, project_rate, expected_monthly_revenue, profile_name

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_structure TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_rate TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_monthly_revenue DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS profile_name TEXT;

-- Update the trigger to track new columns
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO project_audit_logs (project_id, actor_id, action, changes)
    VALUES (
      NEW.id,
      NEW.updated_by,
      'update',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO project_audit_logs (project_id, actor_id, action, changes)
    VALUES (
      NEW.id,
      NEW.created_by,
      'create',
      jsonb_build_object('new', to_jsonb(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

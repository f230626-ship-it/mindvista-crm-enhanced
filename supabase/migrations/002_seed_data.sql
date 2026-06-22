-- Seed data for MindVista HRMS (run after creating auth users manually or via signup)
-- Departments
INSERT INTO departments (name, description) VALUES
  ('Engineering', 'Software development and technical operations'),
  ('Human Resources', 'People operations and talent management'),
  ('Finance', 'Financial planning and accounting'),
  ('Operations', 'Business operations and administration'),
  ('Design', 'Product and visual design')
ON CONFLICT (name) DO NOTHING;

-- Holidays for 2026
INSERT INTO holidays (name, date, description) VALUES
  ('New Year', '2026-01-01', 'New Year Day'),
  ('Pakistan Day', '2026-03-23', 'Pakistan Day'),
  ('Labour Day', '2026-05-01', 'International Labour Day'),
  ('Independence Day', '2026-08-14', 'Pakistan Independence Day'),
  ('Defence Day', '2026-09-06', 'Defence Day'),
  ('Iqbal Day', '2026-11-09', 'Allama Iqbal Day'),
  ('Quaid Day', '2026-12-25', 'Quaid-e-Azam Day')
ON CONFLICT (date) DO NOTHING;

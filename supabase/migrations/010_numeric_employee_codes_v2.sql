-- Migration 010: Convert all employee codes to unique 6-digit numeric IDs
-- Replaces all existing codes (including MV-XXX-000 style) with sequential 6-digit numbers.
-- New employees auto-get the next number in the sequence.

-- 1. Drop the old 3-digit sequence and create a fresh 6-digit one
DROP SEQUENCE IF EXISTS employee_code_seq CASCADE;
CREATE SEQUENCE employee_code_seq START 100001 INCREMENT 1;

-- 2. Replace the trigger function to produce 6-digit codes
CREATE OR REPLACE FUNCTION assign_employee_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_code IS NULL OR TRIM(NEW.employee_code) = '' THEN
    NEW.employee_code := nextval('employee_code_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-attach trigger (safe – replaces existing)
DROP TRIGGER IF EXISTS auto_assign_employee_code ON employees;
CREATE TRIGGER auto_assign_employee_code
  BEFORE INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION assign_employee_code();

-- 4. Reassign ALL existing employees with fresh sequential numeric codes
--    Orders by joining_date then created_at so oldest employee gets the lowest number.
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN
    SELECT id
    FROM employees
    ORDER BY joining_date ASC, created_at ASC
  LOOP
    UPDATE employees
      SET employee_code = nextval('employee_code_seq')::TEXT
      WHERE id = emp.id;
  END LOOP;
END;
$$;

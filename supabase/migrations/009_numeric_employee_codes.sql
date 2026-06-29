-- Migration 009: Auto-generate numeric employee codes
-- Creates a sequence and trigger so every new employee gets a unique numeric code.
-- Existing employees with non-numeric codes are backfilled with sequential numeric codes.

-- 1. Create the sequence for numeric employee codes
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START 1;

-- 2. Function: auto-assign a numeric code on insert if none provided
CREATE OR REPLACE FUNCTION assign_employee_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  IF NEW.employee_code IS NULL OR TRIM(NEW.employee_code) = '' THEN
    next_num := nextval('employee_code_seq');
    NEW.employee_code := LPAD(next_num::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to employees table
DROP TRIGGER IF EXISTS auto_assign_employee_code ON employees;
CREATE TRIGGER auto_assign_employee_code
  BEFORE INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION assign_employee_code();

-- 4. Backfill existing employees who have no employee_code
--    Assigns codes in order of joining_date, then created_at, preserving existing codes.
DO $$
DECLARE
  emp RECORD;
  next_num INT;
BEGIN
  FOR emp IN
    SELECT id
    FROM employees
    WHERE employee_code IS NULL OR TRIM(employee_code) = ''
    ORDER BY joining_date ASC, created_at ASC
  LOOP
    next_num := nextval('employee_code_seq');
    UPDATE employees
      SET employee_code = LPAD(next_num::TEXT, 3, '0')
      WHERE id = emp.id;
  END LOOP;
END;
$$;

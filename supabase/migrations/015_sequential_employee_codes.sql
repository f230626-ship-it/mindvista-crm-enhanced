-- Migration 015: Revert to simple sequential employee codes (01, 02, 03...)
-- The audit report requires sequential IDs starting from "01".
-- Replaces the random 5-digit code system from migrations 011/012.

-- ─── 1. Drop the old random code function ────────────────────────────────
DROP FUNCTION IF EXISTS generate_unique_employee_code();

-- ─── 2. Re-create the sequence (reset cleanly) ───────────────────────────
DROP SEQUENCE IF EXISTS employee_code_seq CASCADE;
CREATE SEQUENCE employee_code_seq START 1;

-- ─── 3. New assignment function — simple sequential, zero-padded ─────────
-- Generates: 01, 02, 03 ... 99, 100, 101 ...
-- Uses LPAD with width 2 minimum so it's always at least 2 digits.
CREATE OR REPLACE FUNCTION assign_employee_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
  new_code TEXT;
BEGIN
  IF NEW.employee_code IS NULL OR TRIM(NEW.employee_code) = '' THEN
    next_num := nextval('employee_code_seq');
    -- Pad to 2 digits minimum: 01, 02 ... 99, 100, 101
    new_code := LPAD(next_num::TEXT, 2, '0');
    NEW.employee_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 4. Re-attach trigger ─────────────────────────────────────────────────
DROP TRIGGER IF EXISTS auto_assign_employee_code ON employees;
CREATE TRIGGER auto_assign_employee_code
  BEFORE INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION assign_employee_code();

-- ─── 5. Re-number ALL existing employees sequentially ────────────────────
-- Orders by joining_date then created_at so the oldest employee gets 01.
-- This replaces all the old random 5-digit codes.
DO $$
DECLARE
  emp RECORD;
  counter INT := 1;
BEGIN
  -- Reset the sequence so new inserts continue from after the highest existing number
  FOR emp IN
    SELECT id
    FROM employees
    ORDER BY joining_date ASC, created_at ASC
  LOOP
    UPDATE employees
      SET employee_code = LPAD(counter::TEXT, 2, '0')
      WHERE id = emp.id;
    counter := counter + 1;
  END LOOP;

  -- Advance the sequence to continue from where we left off
  PERFORM setval('employee_code_seq', counter - 1);
END;
$$;

-- Migration 011: 5-digit employee codes with all-unique digits (no repeats within a code)
-- Each code is exactly 5 characters, globally unique across employees.

DROP SEQUENCE IF EXISTS employee_code_seq CASCADE;

CREATE OR REPLACE FUNCTION generate_unique_employee_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  attempt INT := 0;
BEGIN
  LOOP
    SELECT string_agg(d, '' ORDER BY ord)
    INTO new_code
    FROM (
      SELECT d, row_number() OVER () AS ord
      FROM unnest(string_to_array('0123456789', NULL)) AS d
      ORDER BY random()
      LIMIT 5
    ) picked;

    IF new_code IS NOT NULL
       AND length(new_code) = 5
       AND NOT EXISTS (
         SELECT 1 FROM employees WHERE employee_code = new_code
       )
    THEN
      RETURN new_code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= 500 THEN
      RAISE EXCEPTION 'Could not generate a unique 5-digit employee code after % attempts', attempt;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_employee_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_code IS NULL OR TRIM(NEW.employee_code) = '' THEN
    NEW.employee_code := generate_unique_employee_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_employee_code ON employees;
CREATE TRIGGER auto_assign_employee_code
  BEFORE INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION assign_employee_code();

-- Reassign all existing employees with fresh 5-digit unique-digit codes
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
      SET employee_code = generate_unique_employee_code()
      WHERE id = emp.id;
  END LOOP;
END;
$$;

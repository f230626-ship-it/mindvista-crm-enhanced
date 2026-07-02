-- Migration 012: Fix 5-digit employee codes random ordering
-- The previous function inadvertently ordered the random digits by their original numeric value.
-- This fix ensures the 5 unique digits can be in any random order, expanding the possible combinations from 252 to 30,240.

CREATE OR REPLACE FUNCTION generate_unique_employee_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  attempt INT := 0;
BEGIN
  LOOP
    SELECT string_agg(d, '' ORDER BY rnd)
    INTO new_code
    FROM (
      SELECT d, random() as rnd
      FROM unnest(string_to_array('0123456789', NULL)) AS d
      ORDER BY rnd
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

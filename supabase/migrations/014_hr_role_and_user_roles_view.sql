-- Migration 014: Add 'hr' role + user_roles view + RLS helper updates
-- ─────────────────────────────────────────────────────────────────────────────
-- IMPORTANT: Run this in TWO separate steps in the SQL Editor:
--
--   STEP 1 (run alone, then click Run):
--     ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';
--
--   STEP 2 (run the rest of this file after Step 1 succeeds):
--     Everything below this comment block.
--
-- Postgres requires the new enum value to be committed before it can be
-- referenced in function bodies or policies (ERROR: 55P04 otherwise).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 2. user_roles VIEW ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_roles AS
  SELECT
    user_id,
    role,
    id AS employee_id
  FROM public.employees
  WHERE user_id IS NOT NULL;

-- ─── 3. RLS helper: is_hr_or_admin() ─────────────────────────────────────
CREATE OR REPLACE FUNCTION is_hr_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
     WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 4. Tighten departments RLS ───────────────────────────────────────────
DROP POLICY IF EXISTS "departments_select" ON departments;
DROP POLICY IF EXISTS "departments_admin"  ON departments;

CREATE POLICY "departments_select_authenticated"
  ON departments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "departments_insert_admin_hr"
  ON departments FOR INSERT TO authenticated
  WITH CHECK (is_hr_or_admin());

CREATE POLICY "departments_update_admin_hr"
  ON departments FOR UPDATE TO authenticated
  USING (is_hr_or_admin());

CREATE POLICY "departments_delete_admin"
  ON departments FOR DELETE TO authenticated
  USING (is_admin());

-- ─── 5. Tighten holidays RLS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "holidays_select" ON holidays;
DROP POLICY IF EXISTS "holidays_admin"  ON holidays;

CREATE POLICY "holidays_select_authenticated"
  ON holidays FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "holidays_insert_admin_hr"
  ON holidays FOR INSERT TO authenticated
  WITH CHECK (is_hr_or_admin());

CREATE POLICY "holidays_update_admin_hr"
  ON holidays FOR UPDATE TO authenticated
  USING (is_hr_or_admin());

CREATE POLICY "holidays_delete_admin"
  ON holidays FOR DELETE TO authenticated
  USING (is_admin());

-- ─── 6. Re-create custom_access_token_hook ────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims          JSONB;
  user_role_val   TEXT;
  employee_id_val UUID;
BEGIN
  claims := event -> 'claims';

  SELECT role::TEXT, id
    INTO user_role_val, employee_id_val
    FROM public.employees
   WHERE user_id = (event->>'user_id')::UUID
   LIMIT 1;

  IF employee_id_val IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims -> 'app_metadata', '{}'::JSONB)
      || jsonb_build_object(
           'app_role',    COALESCE(user_role_val, 'employee'),
           'employee_id', employee_id_val::TEXT
         )
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- ─── 7. Re-create role sync triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_employee_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
       SET raw_app_meta_data =
             COALESCE(raw_app_meta_data, '{}'::JSONB)
             || jsonb_build_object('app_role', NEW.role::TEXT)
     WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_employee_role ON public.employees;
CREATE TRIGGER sync_employee_role
  AFTER UPDATE OF role ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.sync_employee_role_to_auth();

CREATE OR REPLACE FUNCTION public.sync_new_employee_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE auth.users
       SET raw_app_meta_data =
             COALESCE(raw_app_meta_data, '{}'::JSONB)
             || jsonb_build_object(
                  'app_role',    NEW.role::TEXT,
                  'employee_id', NEW.id::TEXT
                )
     WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_new_employee ON public.employees;
CREATE TRIGGER sync_new_employee
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.sync_new_employee_to_auth();

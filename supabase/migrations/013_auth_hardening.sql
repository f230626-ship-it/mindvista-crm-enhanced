-- Migration 013: Production Auth Hardening
-- 1. Custom Access Token Hook — injects app_role + employee_id into JWT
-- 2. Auth Audit Log table
-- 3. Role sync triggers

-- ─── 1. Custom Access Token Hook ──────────────────────────────────────────
-- Called by Supabase before issuing every access token.
-- Injects app_role and employee_id into app_metadata claims (signed into JWT).
--
-- REQUIRED MANUAL STEP after running this migration:
--   Dashboard → Authentication → Hooks → Custom Access Token
--   → enable and select: public.custom_access_token_hook

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
      COALESCE(claims->'app_metadata', '{}'::JSONB)
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

-- ─── 2. Auth Audit Log ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.auth_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event       TEXT        NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_user_id    ON public.auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_event      ON public.auth_audit_log(event);

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_audit_log_select_own"
  ON public.auth_audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "auth_audit_log_select_admin"
  ON public.auth_audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
       WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- SECURITY DEFINER helper so server actions can write audit rows
-- without needing service-role key just for this.
CREATE OR REPLACE FUNCTION public.insert_auth_audit_log(
  p_user_id    UUID,
  p_event      TEXT,
  p_ip         TEXT,
  p_user_agent TEXT,
  p_metadata   JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_audit_log(user_id, event, ip, user_agent, metadata)
  VALUES (p_user_id, p_event, p_ip, p_user_agent, p_metadata);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_auth_audit_log TO authenticated;

-- ─── 3. Role Sync Triggers ────────────────────────────────────────────────
-- Keep raw_app_meta_data in sync so JWTs reflect role changes after refresh.

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

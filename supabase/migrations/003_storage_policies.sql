-- Storage bucket setup and policies
-- Run after creating buckets in Supabase Dashboard

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('employee-documents', 'employee-documents', false),
  ('company-policies', 'company-policies', false),
  ('assets-media', 'assets-media', false)
ON CONFLICT (id) DO NOTHING;

-- Employee documents: owner or admin can access
CREATE POLICY "employee_docs_select" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'employee-documents'
    AND (
      is_admin()
      OR (storage.foldername(name))[1] = get_current_employee_id()::text
    )
  );

CREATE POLICY "employee_docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-documents'
    AND (
      is_admin()
      OR (storage.foldername(name))[1] = get_current_employee_id()::text
    )
  );

-- Company policies: all authenticated can read, admin can write
CREATE POLICY "company_policies_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-policies');

CREATE POLICY "company_policies_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-policies' AND is_admin());

CREATE POLICY "company_policies_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-policies' AND is_admin());

-- Assets media: admin full access, employees read assigned
CREATE POLICY "assets_media_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assets-media');

CREATE POLICY "assets_media_admin" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'assets-media' AND is_admin());

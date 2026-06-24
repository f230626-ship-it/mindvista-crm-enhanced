-- MindVista CRM – Migration 006 (revised)
-- 1. Tighten projects_insert policy: admin-only (remove coordinator access)
-- 2. Seed IT-related sample projects (idempotent – skips if data already exists)

-- ============================================================
-- 1. UPDATE RLS: Only pm_role = 'admin' can INSERT projects
-- ============================================================

DROP POLICY IF EXISTS "projects_insert" ON projects;

CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (
    get_current_employee_pm_role() = 'admin'
  );


-- ============================================================
-- 2. SEED IT-RELATED SAMPLE PROJECTS
--    (skips entirely if any projects already exist)
-- ============================================================

DO $$
DECLARE
  v_admin_id  UUID;
  v_bd1_id    UUID;
  v_bd2_id    UUID;
  v_mgr1_id   UUID;
  v_mgr2_id   UUID;
  v_dev1_id   UUID;
  v_dev2_id   UUID;
BEGIN

  -- Only seed if the table is empty
  IF (SELECT COUNT(*) FROM projects) > 0 THEN
    RAISE NOTICE 'Projects already exist – skipping seed.';
    RETURN;
  END IF;

  -- Resolve employee IDs by pm_role (first match for each slot)
  SELECT id INTO v_admin_id FROM employees WHERE pm_role = 'admin'                    LIMIT 1;
  SELECT id INTO v_bd1_id   FROM employees WHERE pm_role = 'bd'                       LIMIT 1;
  SELECT id INTO v_bd2_id   FROM employees WHERE pm_role = 'bd'                       OFFSET 1 LIMIT 1;
  SELECT id INTO v_mgr1_id  FROM employees WHERE pm_role IN ('admin','coordinator')   LIMIT 1;
  SELECT id INTO v_mgr2_id  FROM employees WHERE pm_role IN ('admin','coordinator')   OFFSET 1 LIMIT 1;
  SELECT id INTO v_dev1_id  FROM employees WHERE pm_role = 'developer'                LIMIT 1;
  SELECT id INTO v_dev2_id  FROM employees WHERE pm_role = 'developer'                OFFSET 1 LIMIT 1;

  -- Fallback: reuse admin if any slot is empty
  v_bd1_id  := COALESCE(v_bd1_id,  v_admin_id);
  v_bd2_id  := COALESCE(v_bd2_id,  v_bd1_id);
  v_mgr1_id := COALESCE(v_mgr1_id, v_admin_id);
  v_mgr2_id := COALESCE(v_mgr2_id, v_mgr1_id);
  v_dev1_id := COALESCE(v_dev1_id, v_admin_id);
  v_dev2_id := COALESCE(v_dev2_id, v_dev1_id);

  -- ── Project 1 ──────────────────────────────────────────────
  -- Full-stack SaaS platform development
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'NexusDesk – IT Helpdesk & Ticketing SaaS',
    'Daniel Foster', 'NexusDesk Technologies', 'daniel@nexusdesk.io', '+1-415-555-0182',
    'Multi-tenant cloud-based IT helpdesk system with SLA management, ticket automation, escalation workflows, live chat, and a client-facing self-service portal. Built with Next.js, Supabase, and Redis queuing.',
    'Other', v_bd1_id, 'LinkedIn', v_dev1_id, v_mgr1_id,
    32000.00, 'USD', TRUE, 2800.00, 9500.00,
    'Partial', '2025-09-01', '2026-03-31', NULL,
    'In Progress', v_admin_id, v_admin_id
  );

  -- ── Project 2 ──────────────────────────────────────────────
  -- DevOps / Cloud migration
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'CloudShift – AWS Infrastructure Migration',
    'Olivia Hartman', 'Hartman Logistics GmbH', 'o.hartman@hartman-log.de', '+49-89-555-4412',
    'End-to-end migration of on-premise monolithic application to AWS ECS + RDS + S3. Includes CI/CD pipeline setup (GitHub Actions), monitoring with Grafana, and 6-month post-migration support retainer.',
    'Other', v_bd2_id, 'Referral', v_dev2_id, v_mgr2_id,
    27500.00, 'USD', TRUE, 2000.00, 8000.00,
    'Paid', '2025-08-15', '2025-12-31', '2025-12-29',
    'Completed', v_admin_id, v_admin_id
  );

  -- ── Project 3 ──────────────────────────────────────────────
  -- AI / ML product
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'SentimentIQ – AI Review Analytics Engine',
    'Arjun Mehta', 'SentimentIQ Inc.', 'arjun@sentimentiq.ai', '+1-628-555-9930',
    'NLP-powered product review analytics platform using OpenAI GPT-4 and fine-tuned BERT models. Surfaces sentiment trends, topic clusters, and competitor benchmarking dashboards for e-commerce brands.',
    'E-commerce', v_bd1_id, 'Upwork', v_dev1_id, v_mgr1_id,
    48000.00, 'USD', TRUE, 4500.00, 14000.00,
    'Partial', '2025-11-01', '2026-06-30', NULL,
    'In Progress', v_admin_id, v_admin_id
  );

  -- ── Project 4 ──────────────────────────────────────────────
  -- Mobile app (cross-platform)
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'FieldForce – Mobile Field Service App',
    'Sophie Laurent', 'Laurent Services SA', 'sophie@laurent-services.fr', '+33-1-5555-7788',
    'Cross-platform React Native mobile app for field technicians. Features offline-first task management, GPS check-in/out, barcode scanning, digital signature capture, and real-time sync with HQ backend.',
    'Other', v_bd2_id, 'Website', v_dev2_id, v_mgr2_id,
    21000.00, 'USD', FALSE, 0, 6200.00,
    'Paid', '2025-07-01', '2025-10-31', '2025-10-25',
    'Completed', v_admin_id, v_admin_id
  );

  -- ── Project 5 ──────────────────────────────────────────────
  -- Cybersecurity / audit tool
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'SecureAudit – Compliance & Vulnerability Dashboard',
    'Marcus Webb', 'Webb Financial Group', 'marcus.webb@webbfg.com', '+44-20-5555-3300',
    'Automated security compliance dashboard covering ISO 27001, SOC 2 Type II, and GDPR. Integrates with AWS Security Hub, Snyk, and Wiz to surface findings, assign remediation tasks, and generate board-level reports.',
    'Other', v_bd1_id, 'Cold Email', v_dev1_id, v_mgr1_id,
    38500.00, 'USD', TRUE, 3200.00, 11000.00,
    'Pending', '2026-01-01', '2026-07-31', NULL,
    'Onboarding', v_admin_id, v_admin_id
  );

  -- ── Project 6 ──────────────────────────────────────────────
  -- ERP / enterprise integration
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'OpsCore – Custom ERP Integration Platform',
    'Rania Al-Khalid', 'Al-Khalid Manufacturing LLC', 'rania@ak-manufacturing.ae', '+971-4-555-8801',
    'Bespoke ERP integration layer connecting SAP S/4HANA, Odoo, and WMS using REST + webhook bridges. Includes real-time inventory sync, purchase order automation, and a unified management console.',
    'Other', v_bd2_id, 'LinkedIn', v_dev2_id, v_mgr2_id,
    55000.00, 'USD', FALSE, 0, 16000.00,
    'Partial', '2025-10-01', '2026-04-30', NULL,
    'On Hold', v_admin_id, v_admin_id
  );

  -- ── Project 7 ──────────────────────────────────────────────
  -- E-commerce platform build
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'CartFlow – Headless Commerce Storefront',
    'Ethan Park', 'CartFlow Commerce', 'ethan@cartflow.io', '+1-323-555-0045',
    'Headless e-commerce storefront using Next.js 15, Shopify Hydrogen, and Stripe. Includes product recommendation engine, abandoned cart AI re-engagement, multi-currency checkout, and CDN-optimised media pipeline.',
    'E-commerce', v_bd1_id, 'Fiverr', v_dev1_id, v_mgr1_id,
    19500.00, 'USD', TRUE, 1800.00, 5800.00,
    'Paid', '2025-06-01', '2025-09-30', '2025-09-28',
    'Maintenance', v_admin_id, v_admin_id
  );

  -- ── Project 8 ──────────────────────────────────────────────
  -- Newly won lead (in pipeline)
  INSERT INTO projects (
    name, client_name, company_name, client_email, client_contact_number,
    description, industry, bd_id, lead_source, closing_developer_id, manager_id,
    value, currency, is_monthly_retainer, retainer_amount, expected_profit,
    payment_status, start_date, expected_delivery_date, actual_delivery_date,
    status, created_by, updated_by
  ) VALUES (
    'DataVault – Real-Time Analytics & BI Platform',
    'Lena Strobl', 'Strobl Analytics AG', 'lena.strobl@strobl-analytics.ch', '+41-44-555-7766',
    'Real-time BI platform ingesting events from Kafka into ClickHouse, visualised with a custom React dashboard. Supports multi-source connectors (PostgreSQL, Snowflake, GA4), RBAC, and scheduled PDF report exports.',
    'Other', v_bd2_id, 'Referral', v_dev2_id, v_mgr2_id,
    62000.00, 'USD', TRUE, 5000.00, 18500.00,
    'Pending', '2026-03-01', '2026-10-31', NULL,
    'Lead Won', v_admin_id, v_admin_id
  );

  RAISE NOTICE '8 IT-related sample projects seeded successfully.';
END;
$$;

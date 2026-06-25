// run_migration.js
// Executes migration 006 using the Supabase JS client (service role)
// Splits the migration into: RLS policy update + project seed inserts

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://celsdouievgvgtdrgcgn.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHNkb3VpZXZndmd0ZHJnY2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE3MjI4MywiZXhwIjoyMDk2NzQ4MjgzfQ.1Mp-Jlbp-6e7Cm-wwjqSSjYuhrC5BYTz72vm9A6xnFA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("=== MindVista CRM – Migration 006 ===\n");

  // ── Step 1: Check existing projects ──────────────────────────────────────
  const { data: existing, error: countErr } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (countErr) {
    console.error("❌ Could not check existing projects:", countErr.message);
    process.exit(1);
  }

  // ── Step 2: Fetch employee IDs by pm_role ────────────────────────────────
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, pm_role, full_name")
    .in("pm_role", ["admin", "coordinator", "bd", "developer"])
    .eq("status", "active");

  if (empErr || !employees?.length) {
    console.error("❌ Could not fetch employees:", empErr?.message || "No employees found");
    process.exit(1);
  }

  const admin  = employees.find((e) => e.pm_role === "admin");
  const bds    = employees.filter((e) => e.pm_role === "bd");
  const coords = employees.filter((e) => e.pm_role === "coordinator");
  const devs   = employees.filter((e) => e.pm_role === "developer");

  // Fallback chain
  const adminId = admin?.id || employees[0].id;
  const bd1Id   = bds[0]?.id   || adminId;
  const bd2Id   = bds[1]?.id   || bd1Id;
  const mgr1Id  = (admin || coords[0])?.id || adminId;
  const mgr2Id  = coords[0]?.id || mgr1Id;
  const dev1Id  = devs[0]?.id  || adminId;
  const dev2Id  = devs[1]?.id  || dev1Id;

  console.log("Resolved employees:");
  console.log("  admin :", employees.find((e) => e.id === adminId)?.full_name);
  console.log("  bd1   :", employees.find((e) => e.id === bd1Id)?.full_name);
  console.log("  bd2   :", employees.find((e) => e.id === bd2Id)?.full_name);
  console.log("  mgr1  :", employees.find((e) => e.id === mgr1Id)?.full_name);
  console.log("  mgr2  :", employees.find((e) => e.id === mgr2Id)?.full_name);
  console.log("  dev1  :", employees.find((e) => e.id === dev1Id)?.full_name);
  console.log("  dev2  :", employees.find((e) => e.id === dev2Id)?.full_name);
  console.log();

  // ── Step 3: Check if projects already exist ──────────────────────────────
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  if (projectCount && projectCount > 0) {
    console.log(`⚠️  ${projectCount} projects already exist. Skipping seed (idempotent guard).`);
  } else {
    // ── Step 4: Seed 8 IT-related projects ────────────────────────────────
    console.log("Seeding 8 IT-related sample projects...");

    const projects = [
      {
        name: "NexusDesk – IT Helpdesk & Ticketing SaaS",
        client_name: "Daniel Foster",
        company_name: "NexusDesk Technologies",
        client_email: "daniel@nexusdesk.io",
        client_contact_number: "+1-415-555-0182",
        description: "Multi-tenant cloud-based IT helpdesk system with SLA management, ticket automation, escalation workflows, live chat, and a client-facing self-service portal. Built with Next.js, Supabase, and Redis queuing.",
        industry: "Other",
        bd_id: bd1Id, lead_source: "LinkedIn",
        closing_developer_id: dev1Id, manager_id: mgr1Id,
        value: 32000, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 2800, expected_profit: 9500,
        payment_status: "Partial",
        start_date: "2025-09-01", expected_delivery_date: "2026-03-31", actual_delivery_date: null,
        status: "In Progress", created_by: adminId, updated_by: adminId,
      },
      {
        name: "CloudShift – AWS Infrastructure Migration",
        client_name: "Olivia Hartman",
        company_name: "Hartman Logistics GmbH",
        client_email: "o.hartman@hartman-log.de",
        client_contact_number: "+49-89-555-4412",
        description: "End-to-end migration of on-premise monolithic application to AWS ECS + RDS + S3. Includes CI/CD pipeline setup (GitHub Actions), monitoring with Grafana, and 6-month post-migration support retainer.",
        industry: "Other",
        bd_id: bd2Id, lead_source: "Referral",
        closing_developer_id: dev2Id, manager_id: mgr2Id,
        value: 27500, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 2000, expected_profit: 8000,
        payment_status: "Paid",
        start_date: "2025-08-15", expected_delivery_date: "2025-12-31", actual_delivery_date: "2025-12-29",
        status: "Completed", created_by: adminId, updated_by: adminId,
      },
      {
        name: "SentimentIQ – AI Review Analytics Engine",
        client_name: "Arjun Mehta",
        company_name: "SentimentIQ Inc.",
        client_email: "arjun@sentimentiq.ai",
        client_contact_number: "+1-628-555-9930",
        description: "NLP-powered product review analytics platform using OpenAI GPT-4 and fine-tuned BERT models. Surfaces sentiment trends, topic clusters, and competitor benchmarking dashboards for e-commerce brands.",
        industry: "E-commerce",
        bd_id: bd1Id, lead_source: "Upwork",
        closing_developer_id: dev1Id, manager_id: mgr1Id,
        value: 48000, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 4500, expected_profit: 14000,
        payment_status: "Partial",
        start_date: "2025-11-01", expected_delivery_date: "2026-06-30", actual_delivery_date: null,
        status: "In Progress", created_by: adminId, updated_by: adminId,
      },
      {
        name: "FieldForce – Mobile Field Service App",
        client_name: "Sophie Laurent",
        company_name: "Laurent Services SA",
        client_email: "sophie@laurent-services.fr",
        client_contact_number: "+33-1-5555-7788",
        description: "Cross-platform React Native mobile app for field technicians. Features offline-first task management, GPS check-in/out, barcode scanning, digital signature capture, and real-time sync with HQ backend.",
        industry: "Other",
        bd_id: bd2Id, lead_source: "Website",
        closing_developer_id: dev2Id, manager_id: mgr2Id,
        value: 21000, currency: "USD",
        is_monthly_retainer: false, retainer_amount: 0, expected_profit: 6200,
        payment_status: "Paid",
        start_date: "2025-07-01", expected_delivery_date: "2025-10-31", actual_delivery_date: "2025-10-25",
        status: "Completed", created_by: adminId, updated_by: adminId,
      },
      {
        name: "SecureAudit – Compliance & Vulnerability Dashboard",
        client_name: "Marcus Webb",
        company_name: "Webb Financial Group",
        client_email: "marcus.webb@webbfg.com",
        client_contact_number: "+44-20-5555-3300",
        description: "Automated security compliance dashboard covering ISO 27001, SOC 2 Type II, and GDPR. Integrates with AWS Security Hub, Snyk, and Wiz to surface findings, assign remediation tasks, and generate board-level reports.",
        industry: "Other",
        bd_id: bd1Id, lead_source: "Cold Email",
        closing_developer_id: dev1Id, manager_id: mgr1Id,
        value: 38500, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 3200, expected_profit: 11000,
        payment_status: "Pending",
        start_date: "2026-01-01", expected_delivery_date: "2026-07-31", actual_delivery_date: null,
        status: "Onboarding", created_by: adminId, updated_by: adminId,
      },
      {
        name: "OpsCore – Custom ERP Integration Platform",
        client_name: "Rania Al-Khalid",
        company_name: "Al-Khalid Manufacturing LLC",
        client_email: "rania@ak-manufacturing.ae",
        client_contact_number: "+971-4-555-8801",
        description: "Bespoke ERP integration layer connecting SAP S/4HANA, Odoo, and WMS using REST + webhook bridges. Includes real-time inventory sync, purchase order automation, and a unified management console.",
        industry: "Other",
        bd_id: bd2Id, lead_source: "LinkedIn",
        closing_developer_id: dev2Id, manager_id: mgr2Id,
        value: 55000, currency: "USD",
        is_monthly_retainer: false, retainer_amount: 0, expected_profit: 16000,
        payment_status: "Partial",
        start_date: "2025-10-01", expected_delivery_date: "2026-04-30", actual_delivery_date: null,
        status: "On Hold", created_by: adminId, updated_by: adminId,
      },
      {
        name: "CartFlow – Headless Commerce Storefront",
        client_name: "Ethan Park",
        company_name: "CartFlow Commerce",
        client_email: "ethan@cartflow.io",
        client_contact_number: "+1-323-555-0045",
        description: "Headless e-commerce storefront using Next.js 15, Shopify Hydrogen, and Stripe. Includes product recommendation engine, abandoned cart AI re-engagement, multi-currency checkout, and CDN-optimised media pipeline.",
        industry: "E-commerce",
        bd_id: bd1Id, lead_source: "Fiverr",
        closing_developer_id: dev1Id, manager_id: mgr1Id,
        value: 19500, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 1800, expected_profit: 5800,
        payment_status: "Paid",
        start_date: "2025-06-01", expected_delivery_date: "2025-09-30", actual_delivery_date: "2025-09-28",
        status: "Maintenance", created_by: adminId, updated_by: adminId,
      },
      {
        name: "DataVault – Real-Time Analytics & BI Platform",
        client_name: "Lena Strobl",
        company_name: "Strobl Analytics AG",
        client_email: "lena.strobl@strobl-analytics.ch",
        client_contact_number: "+41-44-555-7766",
        description: "Real-time BI platform ingesting events from Kafka into ClickHouse, visualised with a custom React dashboard. Supports multi-source connectors (PostgreSQL, Snowflake, GA4), RBAC, and scheduled PDF report exports.",
        industry: "Other",
        bd_id: bd2Id, lead_source: "Referral",
        closing_developer_id: dev2Id, manager_id: mgr2Id,
        value: 62000, currency: "USD",
        is_monthly_retainer: true, retainer_amount: 5000, expected_profit: 18500,
        payment_status: "Pending",
        start_date: "2026-03-01", expected_delivery_date: "2026-10-31", actual_delivery_date: null,
        status: "Lead Won", created_by: adminId, updated_by: adminId,
      },
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from("projects")
      .insert(projects)
      .select("id, name, status");

    if (insertErr) {
      console.error("❌ Failed to seed projects:", insertErr.message);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${inserted.length} projects:\n`);
    inserted.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} [${p.status}]`);
    });
  }

  console.log("\n=== Migration 006 complete ===");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});

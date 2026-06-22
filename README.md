# MindVista HRMS

Internal HR management system built with **Next.js 16**, **Supabase**, and **shadcn/ui**.

## Features

- **Employee Management** — profiles, departments, salary (admin), documents
- **Leave Management** — apply, approve/reject, balance tracking, holiday calendar
- **Attendance** — check-in/out, timesheets, monthly reports
- **Policies** — document library with category-based access
- **Performance** — goals/KPIs and quarterly reviews
- **Asset Management** — registry, assignment tracking, return workflow
- **RBAC** — Admin, Manager, and Employee roles with Row Level Security

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Deployment | Vercel + Supabase free tier |

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

3. Run the database migrations in the Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`

4. Create storage buckets in Supabase Dashboard → Storage:
   - `employee-documents` (private)
   - `company-policies` (private)
   - `assets-media` (private)

### 3. Create the first admin user

1. In Supabase Dashboard → Authentication → Users, create a user with email/password
2. Copy the user's UUID, then run in SQL Editor:

```sql
INSERT INTO employees (
  user_id, full_name, email, designation, role, joining_date
) VALUES (
  'YOUR_USER_UUID',
  'Admin User',
  'admin@mindvista.com',
  'System Administrator',
  'admin',
  CURRENT_DATE
);
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your admin account.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Authentication
│   └── (portal)/              # Protected app routes
│       ├── dashboard/         # Employee dashboard
│       ├── profile/           # Employee profile
│       ├── leave/             # Leave requests
│       ├── attendance/        # Check-in & timesheets
│       ├── policies/          # Company policies
│       ├── assets/            # Assigned assets
│       ├── performance/       # Goals & reviews
│       └── admin/             # Admin/manager portal
├── actions/                   # Server actions
├── components/                # UI components
├── lib/                       # Supabase clients, auth, utils
└── types/                     # TypeScript types
supabase/migrations/           # Database schema & RLS
```

## Role Permissions

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| Employee Management | Full | View team | Self only |
| Leave Approval | Yes | Yes | No |
| Attendance | Full | Team | Self |
| Policies | Full | Read | Read |
| Performance | Full | Team | Self |
| Assets | Full | View | View assigned |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables from `.env.example`
4. Deploy

### Supabase

Production database uses the same Supabase project or a separate production instance with migrations applied.

## License

Private — MindVista Engineering

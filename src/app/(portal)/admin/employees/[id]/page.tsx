import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { EditEmployeeDialog } from '@/components/admin/edit-employee-dialog';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  UserCheck,
  Clock,
  Shield,
  Hash,
  Heart,
  UserPlus,
  FileText,
  Cake,
  UserCircle,
  TrendingUp,
  Laptop,
  DollarSign,
  Activity,
  Globe,
  AlertCircle,
  ChevronRight,
  Layers,
  Star,
  Users,
  CheckCircle2,
  Timer,
  Wallet,
  Building,
  IdCard,
  ArrowLeft,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';

interface EmployeeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailsPage({ params }: EmployeeDetailsPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: employee, error } = await supabase
    .from('employees')
    .select(`*, department:departments(name)`)
    .eq('id', id)
    .single();

  if (error || !employee) notFound();

  // Fetch related data in parallel
  const [leadResult, managerResult, leaveBalanceResult, assetsResult, recentLeavesResult, departmentsResult, managersResult, goalsResult, reviewsResult] =
    await Promise.all([
      employee.lead_id
        ? supabase.from('employees').select('full_name, designation, email').eq('id', employee.lead_id).single()
        : Promise.resolve({ data: null }),
      employee.manager_id
        ? supabase.from('employees').select('full_name, designation, email').eq('id', employee.manager_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('leave_balances').select('*').eq('employee_id', id).single(),
      supabase
        .from('asset_assignments')
        .select('*, asset:assets(name, asset_type, serial_number, condition)')
        .eq('employee_id', id)
        .is('return_date', null),
      supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('departments').select('*').order('name'),
      supabase.from('employees').select('id, full_name, employee_code').eq('status', 'active').order('full_name'),
      supabase.from('performance_goals').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
      supabase.from('performance_reviews').select('*').eq('employee_id', id).order('created_at', { ascending: false }),
    ]);

  const leadData = leadResult.data;
  const managerData = managerResult.data;
  const leaveBalance = leaveBalanceResult.data;
  const activeAssets = assetsResult.data ?? [];
  const recentLeaves = recentLeavesResult.data ?? [];
  const departments = departmentsResult.data ?? [];
  const managers = managersResult.data ?? [];
  const goals = goalsResult.data ?? [];
  const reviews = reviewsResult.data ?? [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviews.filter((r: any) => r.rating != null).length).toFixed(1) : null;
  const goalsCompleted = goals.filter((g: any) => g.completion_status >= 100).length;

  const deptName = (employee.department as { name: string } | null)?.name || null;

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const today = new Date();
  const joiningDate = employee.joining_date ? new Date(employee.joining_date) : null;
  const daysEmployed = joiningDate
    ? Math.floor((today.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const yearsEmployed = Math.floor(daysEmployed / 365);
  const monthsEmployed = Math.floor((daysEmployed % 365) / 30);
  const tenureLabel = daysEmployed < 30 ? 'New' : yearsEmployed > 0 ? `${yearsEmployed}y ${monthsEmployed}m` : `${monthsEmployed}mo`;

  const totalSalary = (employee.basic_salary ?? 0) + (employee.allowances ?? 0);

  const statusMeta: Record<string, { label: string; pill: string; dot: string }> = {
    active:    { label: 'Active',    pill: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25', dot: 'bg-emerald-500' },
    inactive:  { label: 'Inactive',  pill: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/25',           dot: 'bg-rose-500'    },
    suspended: { label: 'Suspended', pill: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25',       dot: 'bg-amber-500'   },
  };

  const empTypeMeta: Record<string, string> = {
    full_time: 'Full-Time',
    intern:    'Intern',
    contract:  'Contract',
  };

  const workLocMeta: Record<string, { label: string; icon: typeof Globe }> = {
    onsite: { label: 'Onsite', icon: Building },
    remote: { label: 'Remote', icon: Globe   },
    hybrid: { label: 'Hybrid', icon: Layers  },
  };

  const roleMeta: Record<string, { label: string; color: string }> = {
    admin:    { label: 'Admin',    color: 'text-red-600 dark:text-red-400 bg-red-500/8 ring-1 ring-red-500/20'       },
    hr:       { label: 'HR',       color: 'text-violet-600 dark:text-violet-400 bg-violet-500/8 ring-1 ring-violet-500/20' },
    developer:{ label: 'Developer',color: 'text-blue-600 dark:text-blue-400 bg-blue-500/8 ring-1 ring-blue-500/20'   },
    employee: { label: 'Employee', color: 'text-slate-600 dark:text-slate-400 bg-slate-500/8 ring-1 ring-slate-500/20' },
  };

  const leaveStatusMeta: Record<string, { chip: string; label: string }> = {
    approved: { chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20', label: 'Approved' },
    pending:  { chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',         label: 'Pending'  },
    rejected: { chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20',             label: 'Rejected' },
  };

  const currentStatus  = statusMeta[employee.status]              ?? statusMeta.active;
  const currentRole    = roleMeta[employee.role ?? 'employee']    ?? roleMeta.employee;
  const currentEmpType = empTypeMeta[employee.employment_type ?? 'full_time'] ?? 'Full-Time';
  const currentWorkLoc = workLocMeta[employee.work_location ?? 'onsite']      ?? workLocMeta.onsite;
  const WorkLocIcon    = currentWorkLoc.icon;

  const leaveUsed  = (leaveBalance?.annual_used  ?? 0) + (leaveBalance?.sick_used  ?? 0) + (leaveBalance?.casual_used  ?? 0);
  const leaveTotal = (leaveBalance?.annual_quota ?? 0) + (leaveBalance?.sick_quota ?? 0) + (leaveBalance?.casual_quota ?? 0);
  const leaveLeft  = leaveTotal - leaveUsed;
  const leavePct   = leaveTotal > 0 ? Math.round((leaveUsed / leaveTotal) * 100) : 0;

  const assetTypeLabels: Record<string, string> = {
    laptop: 'Laptop', monitor: 'Monitor', phone: 'Phone', license: 'License', other: 'Other',
  };

  const fmt = (dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', opts ?? { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const fmtCurrency = (amount: number | null | undefined) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: employee.currency || 'USD', maximumFractionDigits: 0,
    }).format(amount);
  };

  let age: number | null = null;
  if (employee.date_of_birth) {
    const dob = new Date(employee.date_of_birth);
    age = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/employees" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Employees
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{employee.full_name}</span>
        </div>

        {/* ══════════════════════════════════════════════
            IDENTITY CARD — no banner, clean SaaS style
        ══════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {/* Subtle top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* Avatar */}
              <div className="relative shrink-0">
                {employee.profile_photo_url ? (
                  <img
                    src={employee.profile_photo_url}
                    alt={employee.full_name}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-border/60 shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-border/60 shadow-md">
                    <span className="text-3xl sm:text-4xl font-black text-primary">
                      {getInitials(employee.full_name)}
                    </span>
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${currentStatus.dot} shadow`} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-[26px] font-black tracking-tight">{employee.full_name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${currentStatus.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </span>
                </div>

                <p className="text-base text-muted-foreground font-medium mb-3">
                  {employee.designation}
                  {deptName && <span className="text-muted-foreground/55"> · {deptName}</span>}
                </p>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2">
                  {employee.employee_code && (
                    <Tag icon={<Hash className="h-3 w-3" />} label={`#${employee.employee_code}`} mono />
                  )}
                  <Tag label={currentEmpType} />
                  <Tag label={currentRole.label} className={currentRole.color} />
                  <Tag icon={<WorkLocIcon className="h-3 w-3" />} label={currentWorkLoc.label} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <EditEmployeeDialog
                  employee={employee}
                  departments={departments}
                  managers={managers}
                />
              </div>
            </div>

            {/* ── Quick info strip ── */}
            <div className="mt-5 pt-5 border-t border-border/50 grid gap-x-8 gap-y-3 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
              <QuickInfo icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={employee.email} small />
              <QuickInfo icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={employee.phone ?? '—'} small />
              <QuickInfo icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={fmt(employee.joining_date, { month: 'short', day: 'numeric', year: 'numeric' })} small />
              <QuickInfo icon={<Building2 className="h-3.5 w-3.5" />} label="Department" value={deptName ?? 'N/A'} small />
            </div>
          </div>
        </div>

        {/* ── KPI Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            icon={<Timer className="h-5 w-5" />}
            label="Tenure"
            value={joiningDate ? tenureLabel : '—'}
            sub={joiningDate ? `Since ${fmt(employee.joining_date, { month: 'short', year: 'numeric' })}` : 'Not set'}
            color="amber"
          />
          <KpiCard
            icon={<Calendar className="h-5 w-5" />}
            label="Leave Left"
            value={leaveTotal > 0 ? `${leaveLeft}d` : '—'}
            sub={leaveTotal > 0 ? `${leaveUsed} used of ${leaveTotal}` : 'No quota set'}
            color="blue"
          />
          <KpiCard
            icon={<Laptop className="h-5 w-5" />}
            label="Assets"
            value={String(activeAssets.length)}
            sub={activeAssets.length === 0 ? 'None assigned' : 'Active assignments'}
            color="violet"
          />
          <KpiCard
            icon={<Wallet className="h-5 w-5" />}
            label="Monthly Pkg"
            value={totalSalary > 0 ? fmtCurrency(totalSalary) : '—'}
            sub={totalSalary > 0 ? 'Total compensation' : 'Not configured'}
            color="emerald"
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">

          {/* ── LEFT ── */}
          <div className="space-y-4">

            <InfoCard title="Contact Information" icon={<Mail className="h-4 w-4 text-blue-500" />} accent="#3b82f6">
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email"   value={employee.email} />
              <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone"  value={employee.phone ?? '—'} />
              <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Address" value={employee.address ?? '—'} />
            </InfoCard>

            <InfoCard title="Personal Details" icon={<UserCircle className="h-4 w-4 text-violet-500" />} accent="#8b5cf6">
              <InfoRow icon={<Cake className="h-3.5 w-3.5" />}     label="Date of Birth" value={fmt(employee.date_of_birth)} />
              {age !== null && (
                <InfoRow icon={<Star className="h-3.5 w-3.5" />}   label="Age"           value={`${age} years old`} />
              )}
              <InfoRow icon={<IdCard className="h-3.5 w-3.5" />}   label="CNIC"          value={employee.cnic_number ?? '—'} mono />
              <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Joining Date"  value={fmt(employee.joining_date)} />
            </InfoCard>

            {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
              <InfoCard title="Emergency Contact" icon={<Heart className="h-4 w-4 text-rose-500" />} accent="#f43f5e">
                {employee.emergency_contact_name && (
                  <InfoRow icon={<UserPlus className="h-3.5 w-3.5" />} label="Name"  value={employee.emergency_contact_name} />
                )}
                {employee.emergency_contact_phone && (
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />}    label="Phone" value={employee.emergency_contact_phone} />
                )}
                <div className="px-5 py-3">
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/8 rounded-lg px-3 py-2 ring-1 ring-rose-500/15">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Contact only in case of emergency
                  </div>
                </div>
              </InfoCard>
            )}

            <InfoCard title="Account & System" icon={<Shield className="h-4 w-4 text-primary" />} accent="#e5a158">
              <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Created"      value={fmt(employee.created_at)} />
              <InfoRow icon={<Activity className="h-3.5 w-3.5" />}    label="Last Updated"  value={fmt(employee.updated_at)} />
              <div className="px-5 py-3 border-t border-border/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Employee Code</p>
                <p className="text-[11px] font-mono text-muted-foreground/70">{employee.employee_code ?? "N/A"}</p>
              </div>
            </InfoCard>

            {/* Performance Rating Donut */}
            {avgRating !== null && (
              <InfoCard title="Performance Rating" icon={<Star className="h-4 w-4 text-yellow-500" />} accent="#eab308">
                <div className="px-5 py-6 flex flex-col items-center">
                  {(() => {
                    const rating = parseFloat(avgRating);
                    const maxRating = 5;
                    const circumference = 2 * Math.PI * 42;
                    const ratingPct = rating / maxRating;
                    const segments = [
                      { color: '#ef4444', label: '1', range: [0, 1] },
                      { color: '#f97316', label: '2', range: [1, 2] },
                      { color: '#eab308', label: '3', range: [2, 3] },
                      { color: '#22c55e', label: '4', range: [3, 4] },
                      { color: '#06b6d4', label: '5', range: [4, 5] },
                    ];
                    const filledLength = ratingPct * circumference;
                    return (
                      <>
                        <div className="relative w-[130px] h-[130px]">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {/* Background ring */}
                            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            {/* Rating fill */}
                            <circle
                              cx="50" cy="50" r="42"
                              fill="none"
                              stroke="url(#ratingGradient)"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${filledLength} ${circumference}`}
                              className="transition-all duration-700"
                            />
                            <defs>
                              <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="25%" stopColor="#f97316" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="75%" stopColor="#22c55e" />
                                <stop offset="100%" stopColor="#06b6d4" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black tracking-tight text-foreground">{avgRating}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground">out of 5</span>
                          </div>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-2.5 mt-4">
                          {segments.map((seg) => (
                            <div key={seg.label} className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                              <span className="text-[10px] text-muted-foreground font-medium">{seg.label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2.5">
                          Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </InfoCard>
            )}

            {reviews.length === 0 && goals.length === 0 && (
              <InfoCard title="Performance Rating" icon={<Star className="h-4 w-4 text-yellow-500" />} accent="#eab308">
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No performance data yet</p>
                </div>
              </InfoCard>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">

            {/* Professional Details */}
            <InfoCard title="Professional Details" icon={<Briefcase className="h-4 w-4 text-amber-500" />} accent="#f59e0b">
              <div className="grid sm:grid-cols-2">
                <div className="sm:border-r border-border/40">
                  <InfoRow icon={<Hash className="h-3.5 w-3.5" />}      label="Employee Code"  value={employee.employee_code ?? 'N/A'} mono />
                  <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Designation"    value={employee.designation} />
                  <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Department"     value={deptName ?? 'N/A'} />
                  <InfoRow icon={<Shield className="h-3.5 w-3.5" />}    label="System Role"    value={currentRole.label} />
                </div>
                <div>
                  <InfoRow icon={<Layers className="h-3.5 w-3.5" />}      label="Employment"  value={currentEmpType} />
                  <InfoRow icon={<WorkLocIcon className="h-3.5 w-3.5" />} label="Location"    value={currentWorkLoc.label} />
                  {leadData && (
                    <InfoRow icon={<UserCheck className="h-3.5 w-3.5" />} label="Team Lead"   value={leadData.full_name} />
                  )}
                </div>
              </div>
            </InfoCard>

            {/* Work Schedule */}
            {(employee.work_start_time || employee.work_end_time || employee.weekly_working_days || employee.probation_end_date) && (
              <InfoCard title="Work Schedule" icon={<Clock className="h-4 w-4 text-cyan-500" />} accent="#06b6d4">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border/30">
                  {employee.work_start_time && <SchedCell emoji="🕘" label="Start Time"     value={employee.work_start_time} />}
                  {employee.work_end_time   && <SchedCell emoji="🕔" label="End Time"       value={employee.work_end_time} />}
                  {employee.weekly_working_days && <SchedCell emoji="📅" label="Days/Week"  value={`${employee.weekly_working_days} days`} />}
                  {employee.probation_end_date  && <SchedCell emoji="⏳" label="Probation End" value={fmt(employee.probation_end_date, { month: 'short', day: 'numeric', year: 'numeric' })} />}
                </div>
              </InfoCard>
            )}

            {/* Compensation */}
            {totalSalary > 0 && (
              <InfoCard title="Compensation" icon={<DollarSign className="h-4 w-4 text-emerald-500" />} accent="#10b981">
                <div className="px-5 py-5">
                  {/* Big number */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Monthly Total</p>
                      <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        {fmtCurrency(totalSalary)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                  {/* Breakdown grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <CompCell label="Basic Salary"  value={fmtCurrency(employee.basic_salary)} />
                    <CompCell label="Allowances"    value={fmtCurrency(employee.allowances ?? 0)} />
                    {employee.payment_cycle && (
                      <CompCell
                        label="Pay Cycle"
                        value={employee.payment_cycle.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      />
                    )}
                    {employee.bank_name && <CompCell label="Bank" value={employee.bank_name} />}
                    {employee.bank_account_number && (
                      <CompCell label="Account No." value={`••••${employee.bank_account_number.slice(-4)}`} />
                    )}
                    {employee.currency && <CompCell label="Currency" value={employee.currency} />}
                  </div>
                </div>
              </InfoCard>
            )}

            {/* Leave Balance */}
            {leaveBalance && leaveTotal > 0 && (
              <InfoCard title="Leave Balance" icon={<Calendar className="h-4 w-4 text-blue-500" />} accent="#3b82f6">
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium">Usage this period</span>
                    <span className="font-bold">{leavePct}% used</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${leavePct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <LeaveCell label="Annual" used={leaveBalance.annual_used} quota={leaveBalance.annual_quota} color="blue" />
                    <LeaveCell label="Sick"   used={leaveBalance.sick_used}   quota={leaveBalance.sick_quota}   color="rose" />
                    <LeaveCell label="Casual" used={leaveBalance.casual_used} quota={leaveBalance.casual_quota} color="amber" />
                  </div>
                </div>
              </InfoCard>
            )}

            {/* Assigned Assets */}
            {activeAssets.length > 0 && (
              <InfoCard title={`Assigned Assets (${activeAssets.length})`} icon={<Laptop className="h-4 w-4 text-violet-500" />} accent="#8b5cf6">
                <div className="divide-y divide-border/30">
                  {activeAssets.map((a: any) => {
                    if (!a.asset) return null;
                    return (
                      <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className="h-9 w-9 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center shrink-0">
                          <Laptop className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{a.asset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {assetTypeLabels[a.asset.asset_type] ?? a.asset.asset_type}
                            {a.asset.serial_number && ` · ${a.asset.serial_number}`}
                          </p>
                        </div>
                        {a.asset.condition && (
                          <span className="text-[11px] font-medium bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md ring-1 ring-border/50 shrink-0 capitalize">
                            {a.asset.condition}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </InfoCard>
            )}

            {/* Recent Leave Requests */}
            {recentLeaves.length > 0 && (
              <InfoCard title="Recent Leave Requests" icon={<FileText className="h-4 w-4 text-orange-500" />} accent="#f97316">
                <div className="divide-y divide-border/30">
                  {recentLeaves.map((leave: any) => {
                    const ls = leaveStatusMeta[leave.status] ?? leaveStatusMeta.pending;
                    return (
                      <div key={leave.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize mb-0.5">
                            {leave.leave_type.replace('_', ' ')} Leave
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(leave.start_date, { month: 'short', day: 'numeric' })}
                            {' → '}
                            {fmt(leave.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' · '}
                            {leave.days_count} {leave.days_count === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${ls.chip}`}>
                          {ls.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </InfoCard>
            )}

            {/* Employment Timeline */}
            <InfoCard title="Employment Timeline" icon={<TrendingUp className="h-4 w-4 text-teal-500" />} accent="#14b8a6">
              <div className="px-5 py-5 space-y-0">
                {[
                  ...(employee.joining_date ? [{
                    label: 'Joined Organisation',
                    date: fmt(employee.joining_date),
                    meta: `${tenureLabel} ago`,
                    icon: UserPlus,
                    ring: 'ring-emerald-500/30 bg-emerald-500/10',
                    ic: 'text-emerald-500',
                    line: 'bg-emerald-500/20',
                  }] : []),
                  ...(employee.probation_end_date ? [{
                    label: 'Probation Period Ended',
                    date: fmt(employee.probation_end_date),
                    meta: new Date(employee.probation_end_date) < today ? 'Completed' : 'Upcoming',
                    icon: CheckCircle2,
                    ring: 'ring-blue-500/30 bg-blue-500/10',
                    ic: 'text-blue-500',
                    line: 'bg-blue-500/20',
                  }] : []),
                  ...(employee.date_of_birth ? [{
                    label: 'Birthday',
                    date: fmt(employee.date_of_birth, { month: 'long', day: 'numeric' }),
                    meta: 'Annual celebration',
                    icon: Cake,
                    ring: 'ring-pink-500/30 bg-pink-500/10',
                    ic: 'text-pink-500',
                    line: 'bg-pink-500/20',
                  }] : []),
                  {
                    label: 'Profile Last Updated',
                    date: fmt(employee.updated_at),
                    meta: 'Record modified',
                    icon: Activity,
                    ring: 'ring-border/50 bg-muted/50',
                    ic: 'text-muted-foreground',
                    line: 'bg-border/40',
                  },
                ].map((ev, i, arr) => (
                  <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < arr.length - 1 && (
                      <div className={`absolute left-[17px] top-9 bottom-0 w-px ${ev.line}`} />
                    )}
                    <div className={`h-9 w-9 rounded-xl ring-1 flex items-center justify-center shrink-0 ${ev.ring}`}>
                      <ev.icon className={`h-4 w-4 ${ev.ic}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold">{ev.label}</p>
                      <p className="text-xs text-muted-foreground">{ev.date}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ev.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>

            {/* Performance Summary */}
            <InfoCard title="Performance Summary" icon={<Star className="h-4 w-4 text-yellow-500" />} accent="#eab308">
              <div className="px-5 py-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-muted/40 ring-1 ring-border/40 p-3 text-center">
                    <p className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400">{avgRating ?? '—'}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Avg Rating</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 ring-1 ring-border/40 p-3 text-center">
                    <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{goalsCompleted}/{goals.length}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Goals Done</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 ring-1 ring-border/40 p-3 text-center">
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{reviews.length}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">Reviews</p>
                  </div>
                </div>
                {/* Rating bars */}
                {reviews.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent Ratings</p>
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0 truncate">{review.review_period}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
                            style={{ width: `${((review.rating ?? 0) / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-6 text-right">{review.rating ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {reviews.length === 0 && goals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No performance data yet</p>
                )}
              </div>
            </InfoCard>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════ */

function InfoCard({
  title,
  icon,
  accent,
  className,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm ${className ?? ''}`}>
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${accent ?? '#e5a158'}50, transparent)` }} />
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40 bg-muted/20">
        {icon}
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-muted/25 transition-colors group">
      <div className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground/70 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
        <span className={`text-right min-w-0 ${mono ? 'font-mono text-xs text-muted-foreground' : 'text-sm font-semibold'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function Tag({
  icon,
  label,
  mono,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted/60 text-muted-foreground ring-1 ring-border/50 ${mono ? 'font-mono' : ''} ${className ?? ''}`}
    >
      {icon}
      {label}
    </span>
  );
}

function QuickInfo({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-semibold min-w-0 ${small ? 'text-sm' : 'text-base'}`}>{value}</p>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'amber' | 'blue' | 'violet' | 'emerald';
}) {
  const styles = {
    amber:   { wrap: 'bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-amber-500/15',   icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',   val: 'text-foreground'   },
    blue:    { wrap: 'bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/15',     icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',     val: 'text-foreground'     },
    violet:  { wrap: 'bg-gradient-to-br from-violet-500/5 to-violet-500/10 border border-violet-500/15', icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400', val: 'text-foreground' },
    emerald: { wrap: 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/15', icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', val: 'text-foreground' },
  };
  const s = styles[color];
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3.5 ${s.wrap}`}>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.icon}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tracking-tight leading-tight mt-0.5 ${s.val}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function SchedCell({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-5 px-3 text-center gap-1.5">
      <span className="text-xl">{emoji}</span>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function CompCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 ring-1 ring-border/40 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  );
}

function LeaveCell({
  label, used, quota, color,
}: { label: string; used: number; quota: number; color: 'blue' | 'rose' | 'amber' }) {
  const pct = quota > 0 ? Math.round((used / quota) * 100) : 0;
  const c = {
    blue:  { bar: 'bg-blue-500',  val: 'text-blue-700 dark:text-blue-300',  bg: 'bg-blue-500/8 ring-1 ring-blue-500/20'   },
    rose:  { bar: 'bg-rose-500',  val: 'text-rose-700 dark:text-rose-300',  bg: 'bg-rose-500/8 ring-1 ring-rose-500/20'   },
    amber: { bar: 'bg-amber-500', val: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/8 ring-1 ring-amber-500/20' },
  }[color];
  return (
    <div className={`rounded-xl p-3 flex flex-col gap-2 ${c.bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-black ${c.val}`}>{quota - used}</p>
      <p className="text-[11px] text-muted-foreground">{used}/{quota} used</p>
      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

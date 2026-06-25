"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Lock,
  FolderOpen,
  Upload,
} from "lucide-react";
import { ImportDialog } from "@/components/projects/import-dialog";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import type { Project, Employee, ProjectResource } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  "Lead Won": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Onboarding": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "On Hold": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Maintenance": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Paused": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Archived": "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
};

const CHART_COLORS = [
  "#e5a158", // Brand orange
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6b7280", // Gray
];

interface ProjectsClientProps {
  initialProjects: (Project & {
    bd: Pick<Employee, "id" | "full_name" | "email"> | null;
    manager: Pick<Employee, "id" | "full_name" | "email"> | null;
    resources: (ProjectResource & { employee: Pick<Employee, "id" | "full_name" | "email"> })[];
  })[];
  allEmployees: Employee[];
  currentEmployee: Employee;
}

export default function ProjectsClient({
  initialProjects,
  allEmployees,
  currentEmployee,
}: ProjectsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "list">("dashboard");
  const [isImportOpen, setIsImportOpen] = useState(false);
  // Only pm_role='admin' can create projects (coordinators can edit but not create)
  const isAdmin = currentEmployee.pm_role === "admin";
  // Both admin and coordinator can edit/delete
  const isWritable = currentEmployee.pm_role === "admin" || currentEmployee.pm_role === "coordinator";

  // --- Filtering & Search State ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [bdFilter, setBdFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [leadSourceFilter, setLeadSourceFilter] = useState("ALL");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Helper: unique clients ---
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    initialProjects.forEach((p) => {
      if (p.client_name) clients.add(p.client_name);
    });
    return Array.from(clients).sort();
  }, [initialProjects]);

  // --- Filtered Projects ---
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      // Search
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        p.client_name.toLowerCase().includes(searchLower) ||
        (p.company_name && p.company_name.toLowerCase().includes(searchLower));

      // Dropdowns
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchesClient = clientFilter === "ALL" || p.client_name === clientFilter;
      const matchesIndustry = industryFilter === "ALL" || p.industry === industryFilter;
      const matchesBd = bdFilter === "ALL" || p.bd_id === bdFilter;
      const matchesLeadSource = leadSourceFilter === "ALL" || p.lead_source === leadSourceFilter;
      
      const matchesResource =
        resourceFilter === "ALL" ||
        p.resources.some((r) => r.employee_id === resourceFilter);

      // Date ranges
      const projectStart = new Date(p.start_date);
      const matchesStartFrom = !startDateFrom || projectStart >= new Date(startDateFrom);
      const matchesStartTo = !startDateTo || projectStart <= new Date(startDateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClient &&
        matchesIndustry &&
        matchesBd &&
        matchesResource &&
        matchesLeadSource &&
        matchesStartFrom &&
        matchesStartTo
      );
    });
  }, [
    initialProjects,
    search,
    statusFilter,
    clientFilter,
    industryFilter,
    bdFilter,
    resourceFilter,
    leadSourceFilter,
    startDateFrom,
    startDateTo,
  ]);

  // --- Paginated Projects ---
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;

  // --- Reset Pagination when filters change is handled inline with handlers ---

  // ==========================================
  // --- METRIC CALCULATIONS FOR DASHBOARD ---
  // ==========================================

  const metrics = useMemo(() => {
    const projects = initialProjects; // dashboard represents all projects user has access to
    const total = projects.length;
    
    let active = 0;
    let onHold = 0;
    let completed = 0;
    let monthlyRecurring = 0;
    let totalValue = 0;

    projects.forEach((p) => {
      if (["Onboarding", "In Progress", "Maintenance"].includes(p.status)) {
        active++;
      }
      if (p.status === "On Hold") {
        onHold++;
      }
      if (p.status === "Completed") {
        completed++;
      }
      if (p.is_monthly_retainer) {
        monthlyRecurring++;
      }
      totalValue += Number(p.value || 0);
    });

    // Total active resources (distinct employee IDs assigned to active projects)
    const activeResourceIds = new Set<string>();
    projects.forEach((p) => {
      if (["Onboarding", "In Progress", "Maintenance"].includes(p.status)) {
        p.resources.forEach((r) => {
          activeResourceIds.add(r.employee_id);
        });
      }
    });

    return {
      total,
      active,
      onHold,
      completed,
      monthlyRecurring,
      totalValue,
      totalActiveResources: activeResourceIds.size,
    };
  }, [initialProjects]);

  // 1. Project Status Chart Data
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProjects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [initialProjects]);

  // 2. Revenue Dashboard Calculations
  const revenueMetrics = useMemo(() => {
    let totalRevenue = 0;
    const byMonth: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byBD: Record<string, number> = {};

    initialProjects.forEach((p) => {
      const val = Number(p.value || 0);
      totalRevenue += val;

      // Group by Month (using start_date)
      if (p.start_date) {
        const date = new Date(p.start_date);
        const monthName = date.toLocaleString("default", { month: "short", year: "2-digit" });
        byMonth[monthName] = (byMonth[monthName] || 0) + val;
      }

      // Group by Lead Source
      if (p.lead_source) {
        bySource[p.lead_source] = (bySource[p.lead_source] || 0) + val;
      }

      // Group by BD
      const bdName = p.bd?.full_name || "Self / Other";
      byBD[bdName] = (byBD[bdName] || 0) + val;
    });

    // Format byMonth to chronological order (simplistic sort for demo/display)
    const monthData = Object.entries(byMonth).map(([name, value]) => ({ name, value }));

    return {
      totalRevenue,
      monthData,
      sourceData: Object.entries(bySource).map(([name, value]) => ({ name, value })),
      bdData: Object.entries(byBD).map(([name, value]) => ({ name, value })),
    };
  }, [initialProjects]);

  // 3. Resource Utilization Calculations
  const resourceMetrics = useMemo(() => {
    // Total employees in CRM
    const totalResources = allEmployees.length;

    // Calculate workload of each employee across all active projects
    const workloads: Record<string, { employee: Employee; workload: number; projectsCount: number }> = {};
    
    // Seed all active employees
    allEmployees.forEach((emp) => {
      if (emp.status === "active") {
        workloads[emp.id] = { employee: emp, workload: 0, projectsCount: 0 };
      }
    });

    initialProjects.forEach((p) => {
      if (["Onboarding", "In Progress", "Maintenance"].includes(p.status)) {
        p.resources.forEach((r) => {
          if (workloads[r.employee_id]) {
            workloads[r.employee_id].workload += Number(r.allocation_percentage || 0);
            workloads[r.employee_id].projectsCount += 1;
          }
        });
      }
    });

    const workloadList = Object.values(workloads).sort((a, b) => b.workload - a.workload);
    
    let assignedCount = 0;
    workloadList.forEach((w) => {
      if (w.workload > 0) assignedCount++;
    });

    return {
      totalResources,
      assignedCount,
      availableCount: totalResources - assignedCount,
      workloads: workloadList,
    };
  }, [initialProjects, allEmployees]);

  // 4. BD Performance Calculations
  const bdPerformanceData = useMemo(() => {
    const stats: Record<string, { name: string; closed: number; revenue: number; active: number; completed: number }> = {};

    initialProjects.forEach((p) => {
      if (!p.bd_id) return;
      const bdName = p.bd?.full_name || "Unknown";
      
      if (!stats[p.bd_id]) {
        stats[p.bd_id] = { name: bdName, closed: 0, revenue: 0, active: 0, completed: 0 };
      }

      const row = stats[p.bd_id];
      row.closed += 1;
      row.revenue += Number(p.value || 0);
      
      if (["Onboarding", "In Progress", "Maintenance"].includes(p.status)) {
        row.active += 1;
      }
      if (p.status === "Completed") {
        row.completed += 1;
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [initialProjects]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-brand">Project Management</h1>
          <p className="text-sm text-muted-foreground">Manage client projects, resource allocations, and view performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`rounded-md px-3 py-1.5 transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Projects List ({filteredProjects.length})
            </button>
          </div>

          {/* Import Projects Button – admin only */}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="font-semibold shadow-md border-primary/20 text-primary hover:bg-primary/5"
            >
              <Upload className="mr-2 h-4 w-4" /> Import Projects
            </Button>
          )}

          {/* Create Button – admin only */}
          {isAdmin ? (
            <Link href="/projects/new">
              <Button className="font-semibold shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </Link>
          ) : isWritable ? (
            <Button
              disabled
              title="Only Admins can create new projects"
              className="font-semibold shadow-md opacity-50 cursor-not-allowed"
            >
              <Lock className="mr-2 h-3.5 w-3.5" /> Add Project
            </Button>
          ) : null}
        </div>
      </div>

      {/* ========================================================== */}
      {/* --- DASHBOARD TAB VIEW --- */}
      {/* ========================================================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* 1. Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total}</div>
                <p className="text-[10px] text-muted-foreground">All logged leads & projects</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.active}</div>
                <p className="text-[10px] text-muted-foreground">In development/onboarding</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Hold</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.onHold}</div>
                <p className="text-[10px] text-muted-foreground">Blocked or paused projects</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.completed}</div>
                <p className="text-[10px] text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monthly Retainers</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.monthlyRecurring}</div>
                <p className="text-[10px] text-muted-foreground">Active recurring billing</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-border/60 bg-card/80 backdrop-blur-sm col-span-1 sm:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-primary">
                  ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </div>
                <p className="text-[10px] text-muted-foreground">Combined projects valuation</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Status breakdown chart */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Project Status Breakdown</CardTitle>
                <CardDescription>Status share of all projects</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        formatter={(value) => [`${value} projects`, 'Count']}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No project data available</div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by month */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Monthly Revenue Timeline</CardTitle>
                <CardDescription>Revenue incoming grouped by project start date</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {revenueMetrics.monthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueMetrics.monthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e5a158" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#e5a158" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#e5a158" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No start date timeline available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue by Lead Source */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Revenue by Lead Source</CardTitle>
                <CardDescription>Financial volume generated by origin source</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {revenueMetrics.sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueMetrics.sourceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Revenue']}
                      />
                      <Bar dataKey="value" fill="#e5a158" radius={[4, 4, 0, 0]}>
                        {revenueMetrics.sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No lead source financial data</div>
                )}
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Resource Allocation</CardTitle>
                    <CardDescription>Assigned workload vs remaining capacity</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{resourceMetrics.assignedCount}</span>
                    <span className="text-xs text-muted-foreground"> / {resourceMetrics.totalResources} active staff</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-80 overflow-y-auto pr-2 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Employee Resource Workload (%)</span>
                    <span>Projects</span>
                  </div>
                  <div className="space-y-3">
                    {resourceMetrics.workloads.slice(0, 8).map((item) => {
                      let barColor = "bg-green-500";
                      if (item.workload > 100) barColor = "bg-red-500";
                      else if (item.workload >= 70) barColor = "bg-amber-500";

                      return (
                        <div key={item.employee.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-foreground">{item.employee.full_name}</span>
                            <span className="text-xs font-semibold">
                              {item.workload}% ({item.projectsCount} {item.projectsCount === 1 ? 'proj' : 'projs'})
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${Math.min(item.workload, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BD Performance Dashboard Table */}
          {bdPerformanceData.length > 0 && (
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Business Development Performance</CardTitle>
                <CardDescription>Metrics on deals closed, revenue generated, and active pipelines</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BD Representative</TableHead>
                      <TableHead className="text-center">Projects Closed</TableHead>
                      <TableHead className="text-right">Revenue Generated</TableHead>
                      <TableHead className="text-center">Active Projects</TableHead>
                      <TableHead className="text-center">Completed Projects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bdPerformanceData.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-semibold">{row.name}</TableCell>
                        <TableCell className="text-center font-mono">{row.closed}</TableCell>
                        <TableCell className="text-right font-black font-mono text-primary">
                          ${row.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400">
                            {row.active}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400">
                            {row.completed}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* --- PROJECTS LIST TAB VIEW --- */}
      {/* ========================================================== */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Project Name or Client..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 font-medium"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {showFilters ? "Hide" : "Show"}
                </Button>
              </div>

              {/* Extended filters */}
              {showFilters && (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 animate-fade-in">
                  {/* Status Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="Lead Won">Lead Won</SelectItem>
                        <SelectItem value="Onboarding">Onboarding</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Client Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Client</Label>
                    <Select value={clientFilter} onValueChange={(val) => { setClientFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Clients</SelectItem>
                        {uniqueClients.map((client) => (
                          <SelectItem key={client} value={client}>
                            {client}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Industry Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Industry</Label>
                    <Select value={industryFilter} onValueChange={(val) => { setIndustryFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Industries</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Hotel">Hotel</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BD Rep Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">BD Representative</Label>
                    <Select value={bdFilter} onValueChange={(val) => { setBdFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select BD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All BD Reps</SelectItem>
                        {allEmployees
                          .filter((e) => e.pm_role === "bd" || e.pm_role === "admin")
                          .map((bd) => (
                            <SelectItem key={bd.id} value={bd.id}>
                              {bd.full_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned Resource Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Resource</Label>
                    <Select value={resourceFilter} onValueChange={(val) => { setResourceFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Resource" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Resources</SelectItem>
                        {allEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lead Source Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Lead Source</Label>
                    <Select value={leadSourceFilter} onValueChange={(val) => { setLeadSourceFilter(val || "ALL"); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Sources</SelectItem>
                        <SelectItem value="Fiverr">Fiverr</SelectItem>
                        <SelectItem value="Upwork">Upwork</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Email">Cold Email</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date range from */}
                  <div className="space-y-1 col-span-1 sm:col-span-2">
                    <Label className="text-xs">Start Date Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={startDateFrom}
                        onChange={(e) => {
                          setStartDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-9 text-xs"
                      />
                      <span className="self-center text-muted-foreground text-xs">to</span>
                      <Input
                        type="date"
                        value={startDateTo}
                        onChange={(e) => {
                          setStartDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>BD Rep</TableHead>
                    <TableHead>Assigned Resources</TableHead>
                    <TableHead className="text-right">Project Value</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.length > 0 ? (
                    paginatedProjects.map((p) => (
                      <TableRow
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell>
                          <div className="font-semibold text-foreground">{p.name}</div>
                          {p.company_name && (
                            <div className="text-xs text-muted-foreground">{p.company_name}</div>
                          )}
                        </TableCell>
                        <TableCell>{p.client_name}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[p.status] || "bg-slate-100 text-slate-800"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{p.bd?.full_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex -space-x-2 overflow-hidden py-1">
                            {p.resources.length > 0 ? (
                              p.resources.map((res) => {
                                const initials = res.employee.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2);
                                return (
                                  <div
                                    key={res.id}
                                    title={`${res.employee.full_name} (${res.role} · ${res.allocation_percentage}%)`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-card bg-primary text-[10px] font-black text-primary-foreground shadow-sm"
                                  >
                                    {initials}
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground font-light">None assigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black font-mono text-primary">
                          ${Number(p.value).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{p.start_date}</TableCell>
                        <TableCell className="text-sm">{p.expected_delivery_date}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 py-6">
                          <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                          <p className="text-sm font-medium text-muted-foreground">No projects found</p>
                          <p className="text-xs text-muted-foreground/70">
                            {search || statusFilter !== "ALL" || clientFilter !== "ALL"
                              ? "Try clearing your filters to see all projects."
                              : isAdmin
                              ? "Get started by adding your first project."
                              : "No projects have been assigned to you yet."}
                          </p>
                          {isAdmin && !search && statusFilter === "ALL" && clientFilter === "ALL" && (
                            <Link href="/projects/new" className="mt-1">
                              <Button size="sm" className="font-semibold">
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Project
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredProjects.length} total projects)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-semibold px-2">{currentPage}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        allEmployees={allEmployees}
        existingProjects={initialProjects}
        onImportSuccess={() => router.refresh()}
      />
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Calendar, TrendingUp, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

// Move CustomTooltip outside the component to prevent re-creation on each render
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-semibold">{payload[0].payload.name || payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].name}: <span className="font-medium">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardChartsProps {
  leaveBalance: any;
  recentLeaves: any[];
  teamPerformance: any[];
  isManager: boolean;
}

export function DashboardCharts({
  leaveBalance,
  recentLeaves,
  teamPerformance,
  isManager,
}: DashboardChartsProps) {
  // Leave balance pie chart data
  const leaveBalanceData = [
    { name: "Annual", value: leaveBalance?.annual_quota ?? 0, color: "#3b82f6" },
    { name: "Sick", value: leaveBalance?.sick_quota ?? 0, color: "#ef4444" },
    { name: "Casual", value: leaveBalance?.casual_quota ?? 0, color: "#10b981" },
  ];

  // Leave trends over last 90 days
  const leavesByMonth = recentLeaves.reduce((acc, leave) => {
    const month = new Date(leave.created_at).toLocaleDateString('en-US', { month: 'short' });
    const existing = acc.find((item: any) => item.month === month);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, [] as any[]);

  // Leave status distribution
  const leaveStatusData = [
    { 
      status: "Approved", 
      count: recentLeaves.filter(l => l.status === 'approved').length,
      fill: "#10b981"
    },
    { 
      status: "Pending", 
      count: recentLeaves.filter(l => l.status === 'pending').length,
      fill: "#f59e0b"
    },
    { 
      status: "Rejected", 
      count: recentLeaves.filter(l => l.status === 'rejected').length,
      fill: "#ef4444"
    },
  ];

  // Performance distribution (if manager)
  const performanceDistribution = teamPerformance.reduce((acc, perf) => {
    const bucket = Math.floor(perf.completion_status / 25) * 25;
    const existing = acc.find((item: any) => item.range === `${bucket}-${bucket + 25}%`);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ range: `${bucket}-${bucket + 25}%`, count: 1 });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]">
      {/* Leave Balance Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 py-(--card-spacing)">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Leave Balance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leaveBalanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveBalanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-6">
              {leaveBalanceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave Status Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-500/10 py-(--card-spacing)">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-600" />
              Leave Request Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leaveStatusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave Trends Line Chart */}
      {leavesByMonth.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
            <Card className="overflow-hidden pt-0">
              <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 py-(--card-spacing)">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Leave Request Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={leavesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Distribution (Manager View) */}
      {isManager && performanceDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
            <Card className="overflow-hidden pt-0">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 py-(--card-spacing)">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-600" />
                Team Performance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadarChart,
  Radar,
} from "recharts";
import { TrendingUp, Target, Award, Activity, Star } from "lucide-react";
import { useTheme } from "next-themes";

interface PerformanceChartsProps {
  goals: any[];
  reviews: any[];
  salesLogs?: any[];
}

export function PerformanceCharts({ goals, reviews, salesLogs = [] }: PerformanceChartsProps) {
  const { theme } = useTheme();

  // Prepare rating history data
  const ratingHistoryData = reviews
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((review) => ({
      period: review.review_period,
      rating: review.rating,
    }));

  // Prepare sales trend data if available
  const salesTrendData = salesLogs
    .slice()
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
    .map((log) => ({
      date: log.log_date,
      connections: log.connections_sent || 0,
      meetings: log.meetings_booked || 0,
      leads: log.leads_added || 0,
    }));

  // Prepare goal completion data
  const goalCompletionData = [
    { name: "Completed", value: goals.filter((g) => g.completion_status >= 100).length },
    { name: "In Progress", value: goals.filter((g) => g.completion_status > 0 && g.completion_status < 100).length },
    { name: "Not Started", value: goals.filter((g) => g.completion_status === 0).length },
  ].filter((item) => item.value > 0);

  const COLORS = ["#10b981", "#f59e0b", "#6b7280"];
  const latestReview = reviews?.[0];
  const latestRating = latestReview?.rating || 0;

  // Radial rating component
  const RadialRating = ({ rating }: { rating: number }) => {
    const percentage = (rating / 5) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5a15b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          {/* Rating text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold">{rating}</span>
              <span className="text-xl text-muted-foreground mb-1">/5</span>
            </div>
            <div className="flex gap-0.5 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        {latestReview && (
          <div className="text-center">
            <p className="text-sm font-medium">{latestReview.review_period}</p>
            <p className="text-xs text-muted-foreground">Latest Review</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating Trend Line Chart */}
        {ratingHistoryData.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Performance Rating Trend
                </CardTitle>
                <CardDescription>Your ratings across review periods</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={ratingHistoryData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === "dark" ? "#374151" : "#d1d5db"} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="period" 
                      stroke={theme === "dark" ? "#e5e7eb" : "#374151"} 
                      tick={{ fontSize: 12, fill: theme === "dark" ? "#e5e7eb" : "#374151" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      stroke={theme === "dark" ? "#e5e7eb" : "#374151"} 
                      tick={{ fontSize: 12, fill: theme === "dark" ? "#e5e7eb" : "#374151" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                      labelStyle={{ color: theme === "dark" ? "#f9fafb" : "#111827", fontWeight: 600 }}
                      itemStyle={{ fontWeight: 500 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      name="Rating"
                      stroke={theme === "dark" ? "#fbbf24" : "#d97706"}
                      strokeWidth={4}
                      dot={{ r: ratingHistoryData.length === 1 ? 10 : 6, fill: theme === "dark" ? "#fbbf24" : "#d97706", strokeWidth: 3, stroke: theme === "dark" ? "#111827" : "#ffffff" }}
                      activeDot={{ r: 12 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional Circular Rating Meter */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Current Rating
              </CardTitle>
              <CardDescription>Your latest performance rating</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <RadialRating rating={latestRating} />
          </CardContent>
        </Card>

        {/* Sales Activity Trend (if available) */}
        {salesTrendData.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Sales Activity Trend
                </CardTitle>
                <CardDescription>Your sales metrics over the last 30 days</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={salesTrendData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === "dark" ? "#374151" : "#d1d5db"} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} 
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                      labelStyle={{ color: theme === "dark" ? "#f9fafb" : "#111827", fontWeight: 600 }}
                      itemStyle={{ fontWeight: 500 }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="connections"
                      name="Connections"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="meetings"
                      name="Meetings"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goal Completion Bar Chart */}
        {goalCompletionData.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  Goal Completion Status
                </CardTitle>
                <CardDescription>Breakdown of your current goals</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={goalCompletionData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === "dark" ? "#374151" : "#d1d5db"} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke={theme === "dark" ? "#9ca3af" : "#6b7280"} 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                        border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                      labelStyle={{ color: theme === "dark" ? "#f9fafb" : "#111827", fontWeight: 600 }}
                      itemStyle={{ fontWeight: 500 }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]} 
                      barSize={60}
                    >
                      {goalCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Goals Progress */}
        {goals.length > 0 && (
          <Card className="border-border/60 bg-card shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recent Goals Progress
                </CardTitle>
                <CardDescription>Progress on your latest 5 goals</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                {goals.slice(0, 5).map((goal, index) => (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-medium truncate flex-1">{goal.title}</span>
                      <span className="text-sm font-bold shrink-0">{goal.completion_status}%</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, goal.completion_status)}%`,
                          backgroundColor: goal.completion_status >= 100 ? "#10b981" : goal.completion_status > 0 ? "#f59e0b" : "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

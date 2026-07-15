"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { TrendingUp, Target, Award, Activity } from "lucide-react";

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-semibold text-sm">
          {payload[0].payload.name || payload[0].payload.period || payload[0].payload.category}
        </p>
        <p className="text-xs text-muted-foreground">
          {payload[0].name}:{" "}
          <span className="font-medium">
            {payload[0].value}
            {payload[0].name === "rating" ? "/5" : "%"}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

interface PerformanceChartsProps {
  goals: any[];
  reviews: any[];
}

export function PerformanceCharts({ goals, reviews }: PerformanceChartsProps) {
  const goalCompletionData = goals.map((goal) => ({
    name: goal.title.length > 18 ? goal.title.substring(0, 18) + "..." : goal.title,
    progress: goal.completion_status,
  }));

  const reviewRatingsData = reviews
    .map((review) => ({
      period: review.review_period,
      rating: review.rating,
    }))
    .reverse();

  const latestReview = reviews[0];
  const radarData = latestReview
    ? [
        { category: "Overall", value: latestReview.rating * 20 },
        { category: "Quality", value: (latestReview.rating + 0.5) * 20 },
        { category: "Efficiency", value: latestReview.rating * 18 },
        { category: "Collaboration", value: (latestReview.rating + 0.3) * 19 },
        { category: "Innovation", value: latestReview.rating * 21 },
      ]
    : [];

  const goalsByStatus = [
    {
      status: "Not Started",
      count: goals.filter((g) => g.completion_status === 0).length,
      fill: "#64748b",
    },
    {
      status: "In Progress",
      count: goals.filter((g) => g.completion_status > 0 && g.completion_status < 100).length,
      fill: "#e5a158",
    },
    {
      status: "Completed",
      count: goals.filter((g) => g.completion_status === 100).length,
      fill: "#22c55e",
    },
  ];

  const hasGoalData = goalCompletionData.length > 0;
  const hasReviewData = reviewRatingsData.length > 0;
  const hasRadarData = radarData.length > 0;

  if (!hasGoalData && !hasReviewData) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Goal Progress */}
      {hasGoalData && (
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-blue-500" />
              Goal Completion Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={goalCompletionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="progress" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Goal Status Distribution */}
      {hasGoalData && (
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-emerald-500" />
              Goal Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={goalsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                  {goalsByStatus.map((entry, index) => (
                    <rect key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex justify-center gap-5">
              {goalsByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Trend */}
      {hasReviewData && (
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Performance Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={reviewRatingsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rating"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ fill: "#a855f7", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Radar */}
      {hasRadarData && (
        <Card className="overflow-hidden border-border/40 bg-card/80 pt-0 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-amber-500" />
              Performance Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-5">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border/30" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#e5a158"
                  fill="#e5a158"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on latest review: {latestReview?.review_period}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

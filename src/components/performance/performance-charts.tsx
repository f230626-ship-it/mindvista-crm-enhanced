"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import { TrendingUp, Target, Award, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceChartsProps {
  goals: any[];
  reviews: any[];
}

export function PerformanceCharts({ goals, reviews }: PerformanceChartsProps) {
  // Goal completion data
  const goalCompletionData = goals.map((goal, index) => ({
    name: goal.title.length > 20 ? goal.title.substring(0, 20) + '...' : goal.title,
    progress: goal.completion_status,
    target: 100,
  }));

  // Review ratings over time
  const reviewRatingsData = reviews.map(review => ({
    period: review.review_period,
    rating: review.rating,
  })).reverse();

  // Performance radar chart data (latest review)
  const latestReview = reviews[0];
  const radarData = latestReview ? [
    { category: 'Overall', value: latestReview.rating * 20 },
    { category: 'Quality', value: (latestReview.rating + 0.5) * 20 },
    { category: 'Efficiency', value: latestReview.rating * 18 },
    { category: 'Collaboration', value: (latestReview.rating + 0.3) * 19 },
    { category: 'Innovation', value: latestReview.rating * 21 },
  ] : [];

  // Goals by status
  const goalsByStatus = [
    { status: 'Not Started', count: goals.filter(g => g.completion_status === 0).length, fill: '#ef4444' },
    { status: 'In Progress', count: goals.filter(g => g.completion_status > 0 && g.completion_status < 100).length, fill: '#f59e0b' },
    { status: 'Completed', count: goals.filter(g => g.completion_status === 100).length, fill: '#10b981' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-semibold">{payload[0].payload.name || payload[0].payload.period || payload[0].payload.category}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].name}: <span className="font-medium">{payload[0].value}{payload[0].name === 'rating' ? '/5' : '%'}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Goal Progress Chart */}
      {goalCompletionData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                Goal Completion Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalCompletionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="progress" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Goal Status Distribution */}
      {goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-green-500/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-green-600" />
                Goal Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={goalsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="status" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {goalsByStatus.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-6">
                {goalsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review Ratings Timeline */}
      {reviewRatingsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-purple-500/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Performance Rating Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reviewRatingsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis domain={[0, 5]} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Radar Chart */}
      {radarData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 to-amber-500/10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-amber-600" />
                Performance Dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="category" className="text-xs" />
                  <PolarRadiusAxis domain={[0, 100]} className="text-xs" />
                  <Radar 
                    name="Performance" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Based on latest review: {latestReview?.review_period}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

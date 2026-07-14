"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Package, Clock, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalEmployees: number;
  totalAssets: number;
  pendingLeaves: number;
  avgPerformance: number;
  teamSize: number;
  isManager: boolean;
}

export function StatsCards({
  totalEmployees,
  totalAssets,
  pendingLeaves,
  avgPerformance,
  teamSize,
  isManager,
}: StatsCardsProps) {
  const stats = [
    {
      title: isManager ? "Total Employees" : "Team Size",
      value: isManager ? totalEmployees : teamSize,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      change: "+12%",
    },
    {
      title: "Assets Assigned",
      value: totalAssets,
      icon: Package,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      change: "+8%",
    },
    {
      title: "Pending Requests",
      value: pendingLeaves,
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
      change: "-3%",
    },
    {
      title: "Avg Performance",
      value: `${Math.round(avgPerformance)}%`,
      icon: Target,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      change: "+15%",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${stat.bgColor}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

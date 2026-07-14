"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, Bell, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  module: string;
}

const TYPE_CONFIG = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-600",
  },
  danger: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    badge: "bg-red-500/15 text-red-600",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/15 text-blue-600",
  },
};

export function SalesAlertsClient({
  alerts,
  error,
}: {
  alerts: Alert[];
  error: string | null;
}) {
  const dangers = alerts.filter((a) => a.type === "danger");
  const warnings = alerts.filter((a) => a.type === "warning");
  const infos = alerts.filter((a) => a.type === "info");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Sales Alerts
          </h2>
          <p className="text-sm text-muted-foreground">
            {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {dangers.length > 0 && (
            <Badge className="bg-red-500/15 text-red-600">{dangers.length} critical</Badge>
          )}
          {warnings.length > 0 && (
            <Badge className="bg-amber-500/15 text-amber-600">{warnings.length} warning</Badge>
          )}
          {infos.length > 0 && (
            <Badge className="bg-blue-500/15 text-blue-600">{infos.length} info</Badge>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 ? (
        <Card className="border-dashed border-green-500/30 bg-green-500/5">
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-3 h-10 w-10 text-green-500/60" />
            <p className="font-semibold text-green-600">All clear!</p>
            <p className="text-sm text-muted-foreground">No active alerts for the sales module.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Critical alerts first */}
          {dangers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Critical</h3>
              {dangers.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Warnings</h3>
              {warnings.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {infos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wider">Information</h3>
              {infos.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const config = TYPE_CONFIG[alert.type];
  const Icon = config.icon;

  return (
    <Card className={cn("border", config.border, config.bg)}>
      <CardContent className="flex items-start gap-4 py-4">
        <div className={cn("mt-0.5 shrink-0", config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{alert.title}</p>
            <Badge className={cn("text-[10px] capitalize", config.badge)}>
              {alert.module}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

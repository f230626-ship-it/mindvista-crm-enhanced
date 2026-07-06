import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardCardsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardLeaveBalanceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats Cards */}
      <DashboardStatsSkeleton />

      {/* Main Content Cards */}
      <DashboardCardsSkeleton />

      {/* Leave Balance */}
      <DashboardLeaveBalanceSkeleton />
    </div>
  );
}
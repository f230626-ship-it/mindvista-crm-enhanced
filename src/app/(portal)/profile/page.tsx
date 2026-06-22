import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  EMPLOYEE_STATUS_LABELS,
  ROLE_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { isAdmin } from "@/lib/auth";

export default async function ProfilePage() {
  const employee = await requireAuth();
  const initials = employee.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <PageHeader title="My Profile" description="View and update your personal information" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarImage src={employee.profile_photo_url ?? undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{employee.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Badge>{ROLE_LABELS[employee.role]}</Badge>
              <Badge variant="outline">{EMPLOYEE_STATUS_LABELS[employee.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span>{employee.department?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{formatDate(employee.joining_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{EMPLOYMENT_TYPE_LABELS[employee.employment_type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{WORK_LOCATION_LABELS[employee.work_location]}</span>
            </div>
            {isAdmin(employee.role) && employee.basic_salary && (
              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Salary</span>
                <span>PKR {employee.basic_salary.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ProfileForm employee={employee} />
        </div>
      </div>
    </div>
  );
}

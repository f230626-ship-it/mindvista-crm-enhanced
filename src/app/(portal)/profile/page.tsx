import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div>
      <PageHeader title="My Profile" description="View and update your personal information" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <ProfilePhotoUpload
              employeeId={employee.id}
              fullName={employee.full_name}
              currentUrl={employee.profile_photo_url}
            />
            <CardTitle className="mt-4">{employee.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{employee.designation}</p>
            <div className="flex justify-center gap-2 pt-2">
              <Badge>{ROLE_LABELS[employee.role]}</Badge>
              <Badge variant="outline">{EMPLOYEE_STATUS_LABELS[employee.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {employee.employee_code && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium">{employee.employee_code}</span>
              </div>
            )}
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
            {employee.date_of_birth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span>{formatDate(employee.date_of_birth)}</span>
              </div>
            )}
            {employee.cnic_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNIC</span>
                <span>{employee.cnic_number}</span>
              </div>
            )}
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
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Employee ID, DOB, joining date, and CNIC can only be updated by admin.
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ProfileForm employee={employee} />
        </div>
      </div>
    </div>
  );
}

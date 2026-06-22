import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AttendancePage() {
  await requireAuth();

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Time tracking is managed through Hubstaff"
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            Hubstaff Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Daily check-in and time tracking are handled in Hubstaff, not in MindVista HRMS.
            Use Hubstaff to clock in, track hours, and manage your work activity.
          </p>
          <p className="text-sm text-muted-foreground">
            Leave requests and balances are still managed here in the CRM.
          </p>
          <Link
            href="https://hubstaff.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Hubstaff
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

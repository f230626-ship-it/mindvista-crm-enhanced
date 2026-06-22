import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { HolidayForm } from "@/components/admin/holiday-form";
import { DeleteHolidayButton } from "@/components/admin/delete-holiday-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/date";

export default async function AdminHolidaysPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: holidays } = await supabase
    .from("holidays")
    .select("*")
    .order("date");

  return (
    <div>
      <PageHeader
        title="Holiday Calendar"
        description="Manage company holidays excluded from leave calculations"
        action={<HolidayForm />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Company Holidays ({holidays?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {holidays && holidays.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>{formatDate(holiday.date)}</TableCell>
                    <TableCell>{holiday.description ?? "—"}</TableCell>
                    <TableCell>
                      <DeleteHolidayButton holidayId={holiday.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No holidays configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

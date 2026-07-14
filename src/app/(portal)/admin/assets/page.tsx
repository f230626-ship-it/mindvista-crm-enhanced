import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AssetForm, AssignAssetForm } from "@/components/admin/asset-forms";
import { ReturnAssetButton } from "@/components/admin/return-asset-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from "@/lib/constants";
import { asAssets, asAssetAssignments } from "@/lib/supabase/cast";
import { formatDate } from "@/lib/utils/date";
import type { Employee } from "@/types/database";

export default async function AdminAssetsPage() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const [assetsRes, assignmentsRes, employeesRes] = await Promise.all([
    supabase.from("assets").select("*").order("created_at", { ascending: false }),
    supabase
      .from("asset_assignments")
      .select("*, asset:assets(*), employee:employees(full_name)")
      .is("return_date", null)
      .order("assigned_date", { ascending: false }),
    supabase
      .from("employees")
      .select("id, full_name, email, profile_photo_url")
      .eq("status", "active")
      .order("full_name"),
  ]);

  const assets = asAssets(assetsRes.data);
  const assignments = asAssetAssignments(assignmentsRes.data);
  const employees = employeesRes.data as Pick<Employee, "id" | "full_name" | "email" | "profile_photo_url">[] | null;

  return (
    <div>
      <PageHeader
        title="Asset Management"
        description="Track and assign company equipment"
        action={
          <div className="flex gap-2">
            <AssetForm />
            <AssignAssetForm assets={assets ?? []} employees={employees ?? []} />
          </div>
        }
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]">
        <Card>
          <CardHeader>
            <CardTitle>Asset Registry ({assets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{ASSET_TYPE_LABELS[asset.asset_type]}</TableCell>
                    <TableCell>{asset.serial_number ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === "available" ? "default" : "secondary"}>
                        {ASSET_STATUS_LABELS[asset.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            {assignments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.asset?.name}</TableCell>
                      <TableCell>{a.employee?.full_name}</TableCell>
                      <TableCell>{formatDate(a.assigned_date)}</TableCell>
                      <TableCell>
                        <ReturnAssetButton assignmentId={a.id} assetId={a.asset_id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No active assignments</p>
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(min(350px,100%),1fr))]">
        <Card>
          <CardHeader>
            <CardTitle>Asset Registry ({assets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            <Table style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 sm:px-3 w-[35%]">Name</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 sm:px-3 w-[25%]">Type</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 sm:px-3 w-[22%] text-right">Serial</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 sm:px-3 w-[18%]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} className="border-b border-border/30">
                      <TableCell className="py-2 sm:py-2.5 px-2 sm:px-3 font-medium text-xs sm:text-sm truncate">{asset.name}</TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-2 sm:px-3 text-[10px] sm:text-sm">{ASSET_TYPE_LABELS[asset.asset_type]}</TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-2 sm:px-3 text-right tabular-nums font-mono text-[10px] sm:text-sm">{asset.serial_number ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-2 sm:px-3">
                        <Badge variant={asset.status === "available" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
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
            <CardTitle className="text-sm sm:text-base">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
            {assignments.length > 0 ? (
              <Table style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 pl-2 sm:pl-4 pr-2 w-[30%]">Asset</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 w-[30%]">Employee</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 px-2 w-[22%]">Since</TableHead>
                    <TableHead className="font-semibold text-[10px] sm:text-xs tracking-wider uppercase text-muted-foreground py-2 sm:py-2.5 pr-2 sm:pr-4 pl-2 w-[18%]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => (
                    <TableRow key={a.id} className="border-b border-border/30">
                      <TableCell className="py-2 sm:py-2.5 pl-2 sm:pl-4 pr-2 font-medium text-xs sm:text-sm overflow-hidden">
                        <div className="truncate">{a.asset?.name}</div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-2 text-[10px] sm:text-sm overflow-hidden">
                        <div className="truncate">{a.employee?.full_name}</div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 px-2 text-[10px] sm:text-sm overflow-hidden">
                        <div className="truncate">{formatDate(a.assigned_date)}</div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-2.5 pr-2 sm:pr-4 pl-2 overflow-hidden">
                        <ReturnAssetButton assignmentId={a.id} assetId={a.asset_id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No active assignments</p>
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

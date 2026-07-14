import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesOwner } from "@/lib/auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
import { Plus, Pencil, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteProfileButton } from "@/components/sales/delete-profile-button";

export default async function AdminProfilesPage() {
  await requireSalesOwner();
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from("sales_profiles")
    .select("*, employee:employees(full_name, email)")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Outreach profiles</h2>
          <p className="text-sm text-muted-foreground">Map each LinkedIn/email account to a rep</p>
        </div>
        <Link href="/sales/admin/profiles/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          Add profile
        </Link>
      </div>

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base">All profiles ({profiles?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!profiles?.length ? (
            <div className="py-12 text-center">
              <Link2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No profiles yet. Create your first outreach profile.</p>
              <Link href="/sales/admin/profiles/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                Add profile
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Sheet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{(p.employee as { full_name: string })?.full_name ?? "—"}</TableCell>
                    <TableCell className="capitalize">{p.platform}</TableCell>
                    <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                      {p.google_sheet_id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "outline"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/sales/admin/profiles/${p.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteProfileButton profileId={p.id} profileName={p.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

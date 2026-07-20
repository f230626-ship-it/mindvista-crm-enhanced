import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PolicyForm } from "@/components/admin/policy-form";
import { DeletePolicyButton } from "@/components/admin/delete-policy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { POLICY_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { Download } from "lucide-react";

export default async function AdminPoliciesPage() {
  await requireRole("admin");
  const supabase = createAdminClient();

  const { data: policies } = await supabase
    .from("policies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Policy Management"
        description="Upload and manage company policies and documents"
        action={<PolicyForm />}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Policies ({policies?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          {policies && policies.length > 0 ? (
            <Table style={{ tableLayout: 'fixed' }}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[30%]">Title</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[20%]">Category</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[18%]">Updated</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[20%]">File</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[12%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} className="border-b border-border/30">
                      <TableCell className="py-2.5 px-3 font-medium truncate">{policy.title}</TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Badge variant="outline">
                          {POLICY_CATEGORY_LABELS[policy.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-sm">{formatDate(policy.updated_at)}</TableCell>
                      <TableCell className="py-2.5 px-3">
                        {policy.file_url ? (
                          <a
                            href={policy.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            {policy.file_name ?? "Download"}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <DeletePolicyButton policyId={policy.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No policies uploaded yet</p>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

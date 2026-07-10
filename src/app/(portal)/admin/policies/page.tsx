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
          {policies && policies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {POLICY_CATEGORY_LABELS[policy.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(policy.updated_at)}</TableCell>
                    <TableCell>
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
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <DeletePolicyButton policyId={policy.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No policies uploaded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

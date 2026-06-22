import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { POLICY_CATEGORY_LABELS } from "@/lib/constants";
import { asPolicies } from "@/lib/supabase/cast";
import type { Policy } from "@/types/database";
import { formatDate } from "@/lib/utils/date";
import { FileText, Download } from "lucide-react";

export default async function PoliciesPage() {
  await requireAuth();
  const supabase = await createClient();

  const { data: policiesData } = await supabase
    .from("policies")
    .select("*")
    .order("created_at", { ascending: false });

  const policies = asPolicies(policiesData);

  const grouped = policies.reduce<Record<string, Policy[]>>((acc, policy) => {
    const cat = policy.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(policy);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Company Policies"
        description="Access company handbooks, policies, and documents"
      />

      {policies.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-4 text-lg font-semibold">
                {POLICY_CATEGORY_LABELS[category as keyof typeof POLICY_CATEGORY_LABELS]}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((policy) => (
                  <Card key={policy.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <FileText className="h-5 w-5 text-primary" />
                        <Badge variant="outline">
                          {POLICY_CATEGORY_LABELS[policy.category]}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{policy.title}</CardTitle>
                      {policy.description && (
                        <CardDescription>{policy.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(policy.updated_at)}
                      </span>
                      {policy.file_url && (
                        <a
                          href={policy.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No policies available"
          description="Company policies will appear here once uploaded by admin"
        />
      )}
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { getTeamWithMembers } from "@/actions/teams";
import { notFound } from "next/navigation";
import { TeamDetailClient } from "@/components/admin/team-detail-client";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();
  const { id } = await params;
  const team = await getTeamWithMembers(id);

  if (!team) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={team.name}
        description={`Team code: ${team.code}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/admin/teams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link href={`/admin/teams/${id}/edit`}>
              <Button size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Team
              </Button>
            </Link>
          </div>
        }
      />

      <TeamDetailClient team={team} />
    </div>
  );
}

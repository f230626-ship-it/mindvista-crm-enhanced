import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TeamForm } from "@/components/admin/team-form";
import { getActiveEmployees, getTeamWithMembers } from "@/actions/teams";
import { notFound } from "next/navigation";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();
  const { id } = await params;
  const [team, employees] = await Promise.all([
    getTeamWithMembers(id),
    getActiveEmployees(),
  ]);

  if (!team) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={`Edit Team: ${team.name}`}
        description={`Team code: ${team.code}`}
        action={
          <Link href={`/admin/teams/${id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team
            </Button>
          </Link>
        }
      />

      <TeamForm
        team={team}
        employees={employees}
      />
    </div>
  );
}

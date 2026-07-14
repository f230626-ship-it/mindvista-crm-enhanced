import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TeamsClient } from "@/components/admin/teams-client";
import { getAllTeams } from "@/actions/teams";

export default async function AdminTeamsPage() {
  await requireAdminAccess();
  const teams = await getAllTeams();

  return (
    <div>
      <PageHeader
        title="Team Management"
        description="Create and manage organizational teams"
        action={
          <Link href="/admin/teams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </Link>
        }
      />

      <TeamsClient teams={teams} />
    </div>
  );
}

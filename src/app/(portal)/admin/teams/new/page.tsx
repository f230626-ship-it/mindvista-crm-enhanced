import { requireAdminAccess } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TeamForm } from "@/components/admin/team-form";
import { getActiveEmployees } from "@/actions/teams";

export default async function NewTeamPage() {
  await requireAdminAccess();
  const employees = await getActiveEmployees();

  return (
    <div>
      <PageHeader
        title="Create Team"
        description="Set up a new organizational team"
        action={
          <Link href="/admin/teams">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        }
      />

      <TeamForm employees={employees} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSalesProfile } from "@/actions/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save } from "lucide-react";
import { EmployeeTilePicker } from "@/components/sales/employee-tile-picker";

export function ProfileFormPage({
  employees,
  initial,
  profileId,
}: {
  employees: { id: string; full_name: string; email: string; pm_role: string }[];
  initial?: {
    name: string;
    employee_id: string;
    platform: string;
    google_sheet_id: string | null;
    sheet_tab_name: string | null;
    is_active: boolean;
  };
  profileId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(initial?.employee_id ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "linkedin");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!employeeId) {
      toast.error("Select an employee");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("employee_id", employeeId);
    formData.set("platform", platform);
    formData.set("is_active", isActive ? "true" : "false");

    const { updateSalesProfile } = await import("@/actions/sales");
    const result = profileId
      ? await updateSalesProfile(profileId, formData)
      : await createSalesProfile(formData);

    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(profileId ? "Profile updated" : "Profile created");
      router.push("/sales/admin/profiles");
      router.refresh();
    }
  }

  const platforms = [
    { id: "linkedin", label: "LinkedIn", desc: "Primary outreach channel" },
    { id: "email", label: "Email", desc: "Cold email account" },
    { id: "other", label: "Other", desc: "Custom platform" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/sales/admin/profiles" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
        <ArrowLeft className="h-4 w-4" />
        Back to profiles
      </Link>

      <Card className="border-primary/20 shadow-xl">
        <CardHeader>
          <CardTitle>{profileId ? "Edit profile" : "New outreach profile"}</CardTitle>
          <CardDescription>Link a Google Sheet tab to track active leads for this account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="name">Profile name</Label>
              <Input id="name" name="name" defaultValue={initial?.name} placeholder="Ali – LinkedIn Profile 1" required className="text-base" />
            </div>

            <div className="space-y-3">
              <Label>Assign to rep</Label>
              <EmployeeTilePicker
                employees={employees}
                value={employeeId}
                onChange={setEmployeeId}
              />
            </div>

            <div className="space-y-3">
              <Label>Platform</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      platform === p.id
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <p className="font-semibold">{p.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="google_sheet_id">Google Sheet ID</Label>
                <Input id="google_sheet_id" name="google_sheet_id" defaultValue={initial?.google_sheet_id ?? ""} placeholder="From sheet URL" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet_tab_name">Tab name</Label>
                <Input id="sheet_tab_name" name="sheet_tab_name" defaultValue={initial?.sheet_tab_name ?? ""} placeholder="Sheet1 or profile name" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-3 text-sm font-medium",
                  isActive ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border"
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={cn(
                  "flex-1 rounded-xl border-2 py-3 text-sm font-medium",
                  !isActive ? "border-red-500 bg-red-500/10 text-red-600" : "border-border"
                )}
              >
                Inactive
              </button>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

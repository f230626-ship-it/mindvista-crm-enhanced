"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Employee } from "@/types/database";

export function ProfileForm({ employee }: { employee: Employee }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={employee.phone ?? ""}
                placeholder="03XX-XXXXXXX or +92-XXX-XXXXXXX"
                pattern="^[\d\s\-\+\(\)]+$"
                title="Please enter a valid phone number (digits, spaces, +, -, () only)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic">CNIC (read-only)</Label>
              <Input id="cnic" value={employee.cnic_number ?? ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" defaultValue={employee.address ?? ""} rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                defaultValue={employee.emergency_contact_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                defaultValue={employee.emergency_contact_phone ?? ""}
                placeholder="03XX-XXXXXXX or +92-XXX-XXXXXXX"
                pattern="^[\d\s\-\+\(\)]+$"
                title="Please enter a valid phone number (digits, spaces, +, -, () only)"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

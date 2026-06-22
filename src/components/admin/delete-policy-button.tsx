"use client";

import { useState } from "react";
import { deletePolicy } from "@/actions/policies";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeletePolicyButton({ policyId }: { policyId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this policy?")) return;
    setLoading(true);
    const result = await deletePolicy(policyId);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else toast.success("Policy deleted");
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

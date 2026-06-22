"use client";

import { useState } from "react";
import { returnAsset } from "@/actions/assets";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReturnAssetButton({
  assignmentId,
  assetId,
}: {
  assignmentId: string;
  assetId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    setLoading(true);
    const result = await returnAsset(assignmentId, assetId);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else toast.success("Asset returned");
  }

  return (
    <Button size="sm" variant="outline" onClick={handleReturn} disabled={loading}>
      {loading ? "..." : "Return"}
    </Button>
  );
}

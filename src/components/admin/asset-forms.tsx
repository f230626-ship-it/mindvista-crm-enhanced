"use client";

import { useState } from "react";
import { createAsset, assignAsset } from "@/actions/assets";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, UserPlus } from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Asset, AssetType, Employee } from "@/types/database";

export function AssetForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>("laptop");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("asset_type", assetType);
    const result = await createAsset(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Asset created");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add Asset
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={assetType} onValueChange={(v) => v && setAssetType(v as AssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input id="serial_number" name="serial_number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase Date</Label>
            <Input id="purchase_date" name="purchase_date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Input id="condition" name="condition" placeholder="Good, Fair, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AssignAssetForm({
  assets,
  employees,
}: {
  assets: Asset[];
  employees: Pick<Employee, "id" | "full_name">[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const availableAssets = assets.filter((a) => a.status === "available");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("asset_id", assetId);
    formData.set("employee_id", employeeId);
    const result = await assignAsset(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Asset assigned");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        <UserPlus className="mr-2 h-4 w-4" />
        Assign Asset
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset to Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={(v) => setAssetId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.serial_number ?? "no serial"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_date">Assignment Date</Label>
            <Input id="assigned_date" name="assigned_date" type="date" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !assetId || !employeeId}>
            {loading ? "Assigning..." : "Assign Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

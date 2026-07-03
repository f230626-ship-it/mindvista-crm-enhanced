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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, UserPlus, Package, Hash, Calendar, Info, FileText, User } from "lucide-react";
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from "@/lib/constants";
import type { Asset, AssetType, AssetStatus, Employee } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AssetForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState<AssetType>("laptop");
  const [status, setStatus] = useState<AssetStatus>("available");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("asset_type", assetType);
    formData.set("status", status);
    const result = await createAsset(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Asset registered successfully");
      setOpen(false);
      e.currentTarget.reset();
      setAssetType("laptop");
      setStatus("available");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setAssetType("laptop");
        setStatus("available");
      }
    }}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add Asset
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Register New Asset
          </DialogTitle>
          <DialogDescription>
            Add a new asset to the company inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Info className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="required">
                  Asset Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., MacBook Pro 16-inch"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Asset Type *</Label>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serial_number">
                  <Hash className="inline h-3 w-3 mr-1" />
                  Serial Number
                </Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  placeholder="SN123456789"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Initial Status *</Label>
                <Select value={status} onValueChange={(v) => v && setStatus(v as AssetStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Purchase Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select name="condition">
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Add any relevant notes, specifications, or details..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Registering..." : "Register Asset"}
            </Button>
          </div>
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
  employees: Pick<Employee, "id" | "full_name" | "email" | "profile_photo_url">[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");

  const availableAssets = assets.filter((a) => a.status === "available");
  const selectedAsset = availableAssets.find((a) => a.id === assetId);
  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assetId || !employeeId) {
      toast.error("Please select both an asset and an employee");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("asset_id", assetId);
    formData.set("employee_id", employeeId);
    const result = await assignAsset(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Asset assigned successfully");
      setOpen(false);
      setAssetId("");
      setEmployeeId("");
      setSearchEmployee("");
      e.currentTarget.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setAssetId("");
        setEmployeeId("");
        setSearchEmployee("");
      }
    }}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        <UserPlus className="mr-2 h-4 w-4" />
        Assign Asset
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Assign Asset to Employee
          </DialogTitle>
          <DialogDescription>
            Allocate company equipment to an employee
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              Select Asset *
            </h3>
            {availableAssets.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No available assets to assign
                </p>
              </div>
            ) : (
              <>
                <Select value={assetId} onValueChange={(v) => setAssetId(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an available asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {ASSET_TYPE_LABELS[a.asset_type]}
                          </Badge>
                          {a.serial_number && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {a.serial_number}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAsset && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{selectedAsset.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">
                            {ASSET_TYPE_LABELS[selectedAsset.asset_type]}
                          </Badge>
                          {selectedAsset.serial_number && (
                            <span className="font-mono">SN: {selectedAsset.serial_number}</span>
                          )}
                          {selectedAsset.condition && (
                            <span>Condition: {selectedAsset.condition}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              Select Employee *
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Search by name or email..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full"
              />
              <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.slice(0, 50).map((e) => {
                    const initials = e.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <SelectItem key={e.id} value={e.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{e.full_name}</span>
                            {e.email && (
                              <span className="text-xs text-muted-foreground">{e.email}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedEmployee.profile_photo_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedEmployee.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{selectedEmployee.full_name}</p>
                      {selectedEmployee.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedEmployee.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Assignment Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assigned_date">Assignment Date *</Label>
                <Input
                  id="assigned_date"
                  name="assigned_date"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="e.g., For remote work"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !assetId || !employeeId || availableAssets.length === 0}
            >
              {loading ? "Assigning..." : "Assign Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

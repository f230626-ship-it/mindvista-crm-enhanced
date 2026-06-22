"use client";

import { useState } from "react";
import { createPolicy } from "@/actions/policies";
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
import { Plus } from "lucide-react";
import { POLICY_CATEGORY_LABELS } from "@/lib/constants";
import type { PolicyCategory } from "@/types/database";

export function PolicyForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<PolicyCategory>("handbook");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("category", category);
    const result = await createPolicy(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Policy added");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add Policy
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Policy Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v as PolicyCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POLICY_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_url">Document URL</Label>
            <Input id="file_url" name="file_url" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_name">File Name</Label>
            <Input id="file_name" name="file_name" placeholder="handbook.pdf" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Add Policy"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

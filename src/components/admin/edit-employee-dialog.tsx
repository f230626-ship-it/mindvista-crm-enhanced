"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { updateEmployee } from "@/actions/employees";
import { adminSaveEmployeePhotoUrl } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Pencil, Camera } from "lucide-react";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  ROLE_LABELS,
  PM_ROLE_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from "@/lib/constants";
import {
  NONE_VALUE,
  departmentLabel,
  formGridClass,
  formSelectTriggerClass,
  mergePersonOptions,
  personLabel,
  type PersonOption,
} from "@/components/admin/employee-select-utils";
import type {
  Department,
  Employee,
  EmploymentType,
  UserRole,
  PMRole,
  WorkLocation,
  EmployeeStatus,
} from "@/types/database";

export function EditEmployeeDialog({
  employee,
  departments,
  managers,
}: {
  employee: Employee & {
    department?: Department;
    manager?: Pick<Employee, "id" | "full_name" | "employee_code">;
    lead?: Pick<Employee, "id" | "full_name" | "employee_code">;
  };
  departments: Department[];
  managers: PersonOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(employee.profile_photo_url);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<UserRole>(employee.role);
  const [pmRole, setPmRole] = useState<PMRole>(employee.pm_role || "developer");
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(employee.employment_type);
  const [workLocation, setWorkLocation] = useState<WorkLocation>(employee.work_location);
  const [departmentId, setDepartmentId] = useState(employee.department_id ?? "");
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [leadId, setLeadId] = useState(employee.lead_id ?? "");

  useEffect(() => {
    if (open) {
      setRole(employee.role);
      setPmRole(employee.pm_role || "developer");
      setStatus(employee.status);
      setEmploymentType(employee.employment_type);
      setWorkLocation(employee.work_location);
      setDepartmentId(employee.department_id ?? "");
      setManagerId(employee.manager_id ?? "");
      setLeadId(employee.lead_id ?? "");
      setPhotoPreview(employee.profile_photo_url);
    }
  }, [open, employee]);

  const managerOptions = useMemo(
    () =>
      mergePersonOptions(
        managers,
        employee.manager
          ? {
              id: employee.manager.id,
              full_name: employee.manager.full_name,
              employee_code: employee.manager.employee_code ?? null,
            }
          : null,
        employee.lead
          ? {
              id: employee.lead.id,
              full_name: employee.lead.full_name,
              employee_code: employee.lead.employee_code ?? null,
            }
          : null
      ).filter((m) => m.id !== employee.id),
    [managers, employee]
  );

  const selectedDepartment = departmentLabel(departments, departmentId);
  const selectedManager = managerOptions.find((m) => m.id === managerId);
  const selectedLead = managerOptions.find((m) => m.id === leadId);

  const initials = employee.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setPhotoLoading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${employee.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);
      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const result = await adminSaveEmployeePhotoUrl(employee.id, photoUrl);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPhotoPreview(photoUrl);
      toast.success("Profile photo updated");
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("role", role);
    formData.set("pm_role", pmRole);
    formData.set("status", status);
    formData.set("employment_type", employmentType);
    formData.set("work_location", workLocation);
    formData.set("department_id", departmentId);
    formData.set("manager_id", managerId);
    formData.set("lead_id", leadId);
    const result = await updateEmployee(employee.id, formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Employee updated");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {employee.full_name}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 border-b border-border/40 pb-4">
          <div className="group relative">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={photoPreview ?? undefined} />
              <AvatarFallback className="text-xl font-semibold text-primary bg-transparent border border-primary/20">
                {initials}
              </AvatarFallback>
            </Avatar>
            {photoLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                <Spinner size="sm" />
              </div>
            )}
            <button
              type="button"
              disabled={photoLoading}
              onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Profile Photo</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click the avatar to upload · Max 5MB · JPG, PNG, WebP
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={formGridClass}>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_employee_code">Employee ID</Label>
              <Input
                id="edit_employee_code"
                name="employee_code"
                defaultValue={employee.employee_code ?? ""}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_joining_date">Joining Date</Label>
              <Input
                id="edit_joining_date"
                name="joining_date"
                type="date"
                defaultValue={employee.joining_date}
                required
              />
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input id="edit_full_name" name="full_name" defaultValue={employee.full_name} required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_dob">Date of Birth</Label>
              <Input
                id="edit_dob"
                name="date_of_birth"
                type="date"
                defaultValue={employee.date_of_birth ?? ""}
                required
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_cnic">CNIC</Label>
              <Input
                id="edit_cnic"
                name="cnic_number"
                defaultValue={employee.cnic_number ?? ""}
                required
                pattern="^\d{5}-\d{7}-\d{1}$"
                title="Format: 12345-1234567-1"
                placeholder="12345-1234567-1"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input id="edit_phone" name="phone" defaultValue={employee.phone ?? ""} pattern="^[\d\s\-\+\(\)]+$" title="Please enter a valid phone number" />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_designation">Designation</Label>
              <Input
                id="edit_designation"
                name="designation"
                defaultValue={employee.designation}
                required
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Department</Label>
              <Select
                value={departmentId || NONE_VALUE}
                onValueChange={(v) => setDepartmentId(v === NONE_VALUE ? "" : (v ?? ""))}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue placeholder="Select department">
                    {selectedDepartment ?? "Select department"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Reporting To</Label>
              <Select
                value={managerId || NONE_VALUE}
                onValueChange={(v) => setManagerId(v === NONE_VALUE ? "" : (v ?? ""))}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue placeholder="Select manager">
                    {selectedManager ? personLabel(selectedManager) : "Select manager"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {managerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {personLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Lead</Label>
              <Select
                value={leadId || NONE_VALUE}
                onValueChange={(v) => setLeadId(v === NONE_VALUE ? "" : (v ?? ""))}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue placeholder="Select lead">
                    {selectedLead ? personLabel(selectedLead) : "Select lead"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {managerOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {personLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v as EmployeeStatus)}>
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Project Management Role</Label>
              <Select value={pmRole} onValueChange={(v) => v && setPmRole(v as PMRole)}>
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PM_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={employmentType}
                onValueChange={(v) => v && setEmploymentType(v as EmploymentType)}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Work Location</Label>
              <Select
                value={workLocation}
                onValueChange={(v) => v && setWorkLocation(v as WorkLocation)}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_LOCATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_salary">Basic Salary</Label>
              <Input
                id="edit_salary"
                name="basic_salary"
                type="number"
                defaultValue={employee.basic_salary ?? ""}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

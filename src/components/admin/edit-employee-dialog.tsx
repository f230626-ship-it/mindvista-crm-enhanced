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
  EMPLOYEE_STATUS_LABELS,
} from "@/lib/constants";
import {
  NONE_VALUE,
  formGridClass,
  formSelectTriggerClass,
  mergePersonOptions,
  personLabel,
  type PersonOption,
} from "@/components/admin/employee-select-utils";
import type {
  Employee,
  EmploymentType,
  UserRole,
  WorkLocation,
  EmployeeStatus,
  PaymentCycle,
  Department,
} from "@/types/database";

export function EditEmployeeDialog({
  employee,
  managers,
  departments,
}: {
  employee: Employee & {
    manager?: Pick<Employee, "id" | "full_name" | "employee_code">;
    lead?: Pick<Employee, "id" | "full_name" | "employee_code">;
  };
  managers: PersonOption[];
  departments: Pick<Department, "id" | "name">[];
}) {
  const PAYMENT_CYCLE_LABELS: Record<string, string> = {
    monthly: "Monthly",
    bi_weekly: "Bi-Weekly",
    weekly: "Weekly",
  };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(employee.profile_photo_url);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<UserRole>(employee.role);
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(employee.employment_type);
  const [workLocation, setWorkLocation] = useState<WorkLocation>(employee.work_location);
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [leadId, setLeadId] = useState(employee.lead_id ?? "");
  const [departmentId, setDepartmentId] = useState(employee.department_id ?? "");
  const [paymentCycle, setPaymentCycle] = useState(employee.payment_cycle ?? "monthly");

  useEffect(() => {
    if (open) {
      const applyChanges = () => {
        setRole(employee.role);
        setStatus(employee.status);
        setEmploymentType(employee.employment_type);
        setWorkLocation(employee.work_location);
        setManagerId(employee.manager_id ?? "");
        setLeadId(employee.lead_id ?? "");
        setDepartmentId(employee.department_id ?? "");
        setPaymentCycle(employee.payment_cycle ?? "monthly");
        setPhotoPreview(employee.profile_photo_url);
      };
      
      if (role !== employee.role) {
        // Only update state if it's actually different to avoid cascading
        setTimeout(applyChanges, 0);
      } else {
        applyChanges();
      }
    }
  }, [open, employee, role]);

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
    formData.set("pm_role", employee.pm_role || "developer");
    formData.set("status", status);
    formData.set("employment_type", employmentType);
    formData.set("work_location", workLocation);
    formData.set("manager_id", managerId);
    formData.set("lead_id", leadId);
    formData.set("department_id", departmentId);
    formData.set("payment_cycle", paymentCycle);
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
              <Label htmlFor="edit_address">Address</Label>
              <Input id="edit_address" name="address" defaultValue={employee.address ?? ""} placeholder="Full address" />
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
                    {departments.find((d) => d.id === departmentId)?.name ?? "Select department"}
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
                items={[{ value: NONE_VALUE, label: "None" }, ...managerOptions.map((m) => ({ value: m.id, label: personLabel(m) }))]}
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
                items={[{ value: NONE_VALUE, label: "None" }, ...managerOptions.map((m) => ({ value: m.id, label: personLabel(m) }))]}
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
                  <SelectValue render={(props: any) => <span {...props}>{EMPLOYEE_STATUS_LABELS[status]}</span>} />
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
                  <SelectValue render={(props: any) => <span {...props}>{ROLE_LABELS[role]}</span>} />
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
              <Label>Employment Type</Label>
              <Select
                value={employmentType}
                onValueChange={(v) => v && setEmploymentType(v as EmploymentType)}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue render={(props: any) => <span {...props}>{EMPLOYMENT_TYPE_LABELS[employmentType]}</span>} />
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
                  <SelectValue render={(props: any) => <span {...props}>{WORK_LOCATION_LABELS[workLocation]}</span>} />
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
            <div className="min-w-0 space-y-2">
              <Label htmlFor="edit_allowances">Allowances</Label>
              <Input id="edit_allowances" name="allowances" type="number" defaultValue={employee.allowances ?? ""} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Emergency Contact</p>
            <div className={formGridClass}>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit_emergency_name">Contact Name</Label>
                <Input id="edit_emergency_name" name="emergency_contact_name" defaultValue={employee.emergency_contact_name ?? ""} placeholder="Emergency contact name" />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit_emergency_phone">Contact Phone</Label>
                <Input id="edit_emergency_phone" name="emergency_contact_phone" defaultValue={employee.emergency_contact_phone ?? ""} placeholder="Emergency contact phone" />
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Compensation Details</p>
            <div className={formGridClass}>
              <div className="min-w-0 space-y-2">
                <Label>Payment Cycle</Label>
                <Select value={paymentCycle} onValueChange={(v) => v && setPaymentCycle(v as any)}>
                  <SelectTrigger className={formSelectTriggerClass}>
                    <SelectValue render={(props: any) => <span {...props}>{PAYMENT_CYCLE_LABELS[paymentCycle]}</span>} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit_bank_name">Bank Name</Label>
                <Input id="edit_bank_name" name="bank_name" defaultValue={employee.bank_name ?? ""} placeholder="e.g. HBL, Meezan" />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit_bank_account">Account Number</Label>
                <Input id="edit_bank_account" name="bank_account_number" defaultValue={employee.bank_account_number ?? ""} placeholder="Bank account number" />
              </div>
            </div>
          </div>

          {/* Work Schedule */}
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Work Schedule</p>
            <div className={formGridClass}>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit_weekly_days">Weekly Working Days</Label>
                <Input id="edit_weekly_days" name="weekly_working_days" type="number" min={1} max={7} defaultValue={employee.weekly_working_days ?? ""} />
              </div>
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

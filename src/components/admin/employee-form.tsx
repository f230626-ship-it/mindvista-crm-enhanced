"use client";

import { useMemo, useState } from "react";
import { createEmployee } from "@/actions/employees";
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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  ROLE_LABELS,
  PM_ROLE_LABELS,
} from "@/lib/constants";
import {
  NONE_VALUE,
  departmentLabel,
  formGridClass,
  formSelectTriggerClass,
  personLabel,
  type PersonOption,
} from "@/components/admin/employee-select-utils";
import type { Department, EmploymentType, UserRole, WorkLocation, PMRole } from "@/types/database";

export function EmployeeForm({
  departments,
  managers,
}: {
  departments: Department[];
  managers: PersonOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("employee");
  const [pmRole, setPmRole] = useState<PMRole>("developer");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
  const [workLocation, setWorkLocation] = useState<WorkLocation>("onsite");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [leadId, setLeadId] = useState("");

  const selectedDepartment = departmentLabel(departments, departmentId);
  const selectedManager = useMemo(
    () => managers.find((m) => m.id === managerId),
    [managers, managerId]
  );
  const selectedLead = useMemo(
    () => managers.find((m) => m.id === leadId),
    [managers, leadId]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("role", role);
    formData.set("pm_role", pmRole);
    formData.set("employment_type", employmentType);
    formData.set("work_location", workLocation);
    if (departmentId) formData.set("department_id", departmentId);
    if (managerId) formData.set("manager_id", managerId);
    if (leadId) formData.set("lead_id", leadId);
    const result = await createEmployee(formData);
    setLoading(false);

    if (result.error) toast.error(result.error);
    else {
      toast.success("Employee created successfully");
      setOpen(false);
      setDepartmentId("");
      setManagerId("");
      setLeadId("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        Add Employee
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden flex-1">
          <div className={cn(formGridClass, "overflow-y-auto p-1 flex-1")}>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="joining_date">Joining Date</Label>
              <Input id="joining_date" name="joining_date" type="date" required />
            </div>
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" required />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="cnic_number">CNIC</Label>
              <Input id="cnic_number" name="cnic_number" placeholder="12345-1234567-1" required pattern="^\d{5}-\d{7}-\d{1}$" title="Format: 12345-1234567-1" />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" pattern="^[\d\s\-\+\(\)]+$" title="Please enter a valid phone number" />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" required />
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
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {personLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>Lead (Leave Approver)</Label>
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
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {personLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label>System Role</Label>
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
              <Label htmlFor="basic_salary">Basic Salary (PKR)</Label>
              <Input id="basic_salary" name="basic_salary" type="number" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

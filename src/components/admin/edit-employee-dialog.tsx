"use client";

import { useState } from "react";
import { updateEmployee } from "@/actions/employees";
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
import { Pencil } from "lucide-react";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  ROLE_LABELS,
  PM_ROLE_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from "@/lib/constants";
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
  employee: Employee & { department?: Department };
  departments: Department[];
  managers: Pick<Employee, "id" | "full_name" | "employee_code">[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(employee.role);
  const [pmRole, setPmRole] = useState<PMRole>(employee.pm_role || "developer");
  const [status, setStatus] = useState<EmployeeStatus>(employee.status);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(employee.employment_type);
  const [workLocation, setWorkLocation] = useState<WorkLocation>(employee.work_location);
  const [departmentId, setDepartmentId] = useState(employee.department_id ?? "");
  const [managerId, setManagerId] = useState(employee.manager_id ?? "");
  const [leadId, setLeadId] = useState(employee.lead_id ?? "");

  const personLabel = (p: Pick<Employee, "id" | "full_name" | "employee_code">) =>
    p.employee_code ? `${p.full_name} (${p.employee_code})` : p.full_name;

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_employee_code">Employee ID</Label>
              <Input
                id="edit_employee_code"
                name="employee_code"
                defaultValue={employee.employee_code ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_joining_date">Joining Date</Label>
              <Input
                id="edit_joining_date"
                name="joining_date"
                type="date"
                defaultValue={employee.joining_date}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input id="edit_full_name" name="full_name" defaultValue={employee.full_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_dob">Date of Birth</Label>
              <Input
                id="edit_dob"
                name="date_of_birth"
                type="date"
                defaultValue={employee.date_of_birth ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_cnic">CNIC</Label>
              <Input
                id="edit_cnic"
                name="cnic_number"
                defaultValue={employee.cnic_number ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input id="edit_phone" name="phone" defaultValue={employee.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_designation">Designation</Label>
              <Input
                id="edit_designation"
                name="designation"
                defaultValue={employee.designation}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reporting To</Label>
              <Select value={managerId} onValueChange={(v) => setManagerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Reporting to" />
                </SelectTrigger>
                <SelectContent>
                  {managers
                    .filter((m) => m.id !== employee.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {personLabel(m)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={leadId} onValueChange={(v) => setLeadId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Lead" />
                </SelectTrigger>
                <SelectContent>
                  {managers
                    .filter((m) => m.id !== employee.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {personLabel(m)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v as EmployeeStatus)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Project Management Role</Label>
              <Select value={pmRole} onValueChange={(v) => v && setPmRole(v as PMRole)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={employmentType}
                onValueChange={(v) => v && setEmploymentType(v as EmploymentType)}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Work Location</Label>
              <Select
                value={workLocation}
                onValueChange={(v) => v && setWorkLocation(v as WorkLocation)}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
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

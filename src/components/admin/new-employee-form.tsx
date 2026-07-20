"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createEmployee } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORK_LOCATION_LABELS,
  ROLE_LABELS,
} from "@/lib/constants";
import {
  NONE_VALUE,
  departmentLabel,
  formSelectTriggerClass,
  personLabel,
  type PersonOption,
} from "@/components/admin/employee-select-utils";
import type { Department, EmploymentType, UserRole, WorkLocation } from "@/types/database";

const DRAFT_KEY = "new_employee_draft";

interface DraftState {
  full_name: string;
  email: string;
  designation: string;
  phone: string;
  date_of_birth: string;
  cnic_number: string;
  joining_date: string;
  departmentId: string;
  leadId: string;
  role: UserRole;
  employmentType: EmploymentType;
  workLocation: WorkLocation;
  basic_salary: string;
}

const EMPTY_DRAFT: DraftState = {
  full_name: "",
  email: "",
  designation: "",
  phone: "",
  date_of_birth: "",
  cnic_number: "",
  joining_date: new Date().toISOString().split("T")[0],
  departmentId: "",
  leadId: "",
  role: "employee",
  employmentType: "full_time",
  workLocation: "onsite",
  basic_salary: "",
};

function loadDraft(): DraftState {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...EMPTY_DRAFT, ...JSON.parse(saved) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function saveDraft(draft: DraftState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage unavailable — silent
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // silent
  }
}

export function NewEmployeeForm({
  departments,
  managers,
}: {
  departments: Department[];
  managers: PersonOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const initialized = useRef(false);

  // Form state — mirrors DraftState
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadDraft();
    const hasAnyValue = Object.entries(saved).some(
      ([k, v]) => v !== "" && v !== EMPTY_DRAFT[k as keyof DraftState]
    );
    if (hasAnyValue) {
      setTimeout(() => {
        setDraft(saved);
        setHasDraft(true);
      }, 0);
    }
  }, []);

  // Auto-save draft on every change
  useEffect(() => {
    if (!initialized.current) return;
    saveDraft(draft);
  }, [draft]);

  function set(key: keyof DraftState, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    
    // Real-time email validation
    if (key === 'email') {
      validateEmailClient(value);
    }
  }

  function validateEmailClient(email: string) {
    if (!email) {
      setEmailError("");
      return;
    }

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
      return;
    }

    // Check for common typos
    const domain = email.split('@')[1]?.toLowerCase();
    const typoSuggestions: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'icould.com': 'icloud.com'
    };

    if (domain && typoSuggestions[domain]) {
      setEmailError(`Did you mean ${email.replace(domain, typoSuggestions[domain])}?`);
      return;
    }

    setEmailError("");
  }

  const selectedDepartment = departmentLabel(departments, draft.departmentId);
  const selectedLead = useMemo(
    () => managers.find((m) => m.id === draft.leadId),
    [managers, draft.leadId]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("role", draft.role);
    formData.set("pm_role", "developer");
    formData.set("employment_type", draft.employmentType);
    formData.set("work_location", draft.workLocation);
    if (draft.departmentId) formData.set("department_id", draft.departmentId);
    if (draft.leadId) formData.set("lead_id", draft.leadId);

    const result = await createEmployee(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    clearDraft();
    toast.success("Employee created successfully");
    router.push("/admin/employees");
    router.refresh();
  }

  const inputClass = "bg-background/50";
  const labelClass = "text-sm font-medium";

  return (
    <div className="space-y-6">
      {hasDraft && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertDescription className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span>A saved draft was restored. Your previous progress is loaded.</span>
            <button
              type="button"
              onClick={() => { clearDraft(); setDraft(EMPTY_DRAFT); setHasDraft(false); }}
              className="ml-4 text-xs underline hover:no-underline"
            >
              Clear draft
            </button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="full_name" className={labelClass}>Full Name *</Label>
              <Input
                id="full_name" name="full_name" required className={inputClass}
                value={draft.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={labelClass}>Email *</Label>
              <Input
                id="email" name="email" type="email" required className={inputClass}
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
              />
              {emailError && (
                <p className="text-sm text-amber-600 dark:text-amber-400">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={labelClass}>Password *</Label>
              <Input
                id="password" name="password" type="password" required
                className={inputClass} placeholder="Min. 12 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className={labelClass}>Date of Birth *</Label>
              <Input
                id="date_of_birth" name="date_of_birth" type="date" required className={inputClass}
                value={draft.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnic_number" className={labelClass}>CNIC *</Label>
              <Input
                id="cnic_number" name="cnic_number" required className={inputClass}
                placeholder="12345-1234567-1"
                pattern="^\d{5}-\d{7}-\d{1}$" title="Format: 12345-1234567-1"
                value={draft.cnic_number}
                onChange={(e) => set("cnic_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className={labelClass}>Phone</Label>
              <Input
                id="phone" name="phone" className={inputClass}
                pattern="^[\d\s\-\+\(\)]+$" title="Digits, spaces, +, -, () only"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="joining_date" className={labelClass}>Joining Date *</Label>
              <Input
                id="joining_date" name="joining_date" type="date" required className={inputClass}
                value={draft.joining_date}
                onChange={(e) => set("joining_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation" className={labelClass}>Designation *</Label>
              <Input
                id="designation" name="designation" required className={inputClass}
                value={draft.designation}
                onChange={(e) => set("designation", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Department</Label>
              <Select
                value={draft.departmentId || NONE_VALUE}
                onValueChange={(v) => set("departmentId", v === NONE_VALUE ? "" : (v ?? ""))}
                items={[{ value: NONE_VALUE, label: "None" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue placeholder="Select department">
                    {selectedDepartment ?? "Select department"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>System Role</Label>
              <Select value={draft.role} onValueChange={(v) => v && set("role", v)}>
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Team Lead</Label>
              <Select
                value={draft.leadId || NONE_VALUE}
                onValueChange={(v) => set("leadId", v === NONE_VALUE ? "" : (v ?? ""))}
                items={[{ value: NONE_VALUE, label: "None" }, ...managers.map((m) => ({ value: m.id, label: personLabel(m) }))]}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue placeholder="Select lead">
                    {selectedLead ? personLabel(selectedLead) : "Select lead"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{personLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Employment Type</Label>
              <Select
                value={draft.employmentType}
                onValueChange={(v) => v && set("employmentType", v)}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Work Location</Label>
              <Select
                value={draft.workLocation}
                onValueChange={(v) => v && set("workLocation", v)}
              >
                <SelectTrigger className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORK_LOCATION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compensation (Admin Only)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basic_salary" className={labelClass}>Basic Salary (PKR)</Label>
              <Input
                id="basic_salary" name="basic_salary" type="number" className={inputClass}
                value={draft.basic_salary}
                onChange={(e) => set("basic_salary", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Employee"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/employees")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

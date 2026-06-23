"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Project, Employee } from "@/types/database";

interface ProjectFormProps {
  employees: Employee[];
  currentEmployee: Employee;
  project?: Project; // If provided, we are editing
}

export function ProjectForm({ employees, currentEmployee, project }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [industry, setIndustry] = useState(project?.industry || "Other");
  const [leadSource, setLeadSource] = useState(project?.lead_source || "Other");
  const [paymentStatus, setPaymentStatus] = useState(project?.payment_status || "Pending");
  const [status, setStatus] = useState(project?.status || "Lead Won");
  
  const [bdId, setBdId] = useState(project?.bd_id || "");
  const [managerId, setManagerId] = useState(project?.manager_id || "");
  const [closingDevId, setClosingDevId] = useState(project?.closing_developer_id || "");
  
  const [isMonthlyRetainer, setIsMonthlyRetainer] = useState(project?.is_monthly_retainer || false);
  const [currency, setCurrency] = useState(project?.currency || "USD");

  const isEditing = !!project;
  const isAdmin = currentEmployee.pm_role === "admin";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("industry", industry);
    formData.set("lead_source", leadSource);
    formData.set("payment_status", paymentStatus);
    formData.set("status", status);
    formData.set("is_monthly_retainer", String(isMonthlyRetainer));
    formData.set("currency", currency);
    
    if (bdId) formData.set("bd_id", bdId);
    if (managerId) formData.set("manager_id", managerId);
    if (closingDevId) formData.set("closing_developer_id", closingDevId);

    try {
      let result;
      if (isEditing && project) {
        result = await updateProject(project.id, formData);
      } else {
        result = await createProject(formData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Project updated successfully!" : "Project created successfully!");
        router.push(isEditing ? `/projects/${project.id}` : "/projects");
        router.refresh();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: General Details */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name || ""}
                placeholder="E.g. Real Estate Portal Design"
                required
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  defaultValue={project?.client_name || ""}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={project?.company_name || ""}
                  placeholder="E.g. Acme Corp"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  name="client_email"
                  type="email"
                  defaultValue={project?.client_email || ""}
                  placeholder="client@example.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client_contact_number">Client Phone</Label>
                <Input
                  id="client_contact_number"
                  name="client_contact_number"
                  defaultValue={project?.client_contact_number || ""}
                  placeholder="+1 (234) 567-890"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={(val) => setIndustry(val as Project["industry"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={project?.description || ""}
                placeholder="Provide a detailed overview of project milestones, scope, and parameters..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Ownership & Status */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Ownership & Pipeline Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <Label>BD Representative</Label>
                  <Select value={bdId} onValueChange={(val) => setBdId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select BD" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.pm_role === "bd" || e.pm_role === "admin")
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Lead Source</Label>
                  <Select value={leadSource} onValueChange={(val) => setLeadSource(val as Project["lead_source"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiverr">Fiverr</SelectItem>
                      <SelectItem value="Upwork">Upwork</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Cold Email">Cold Email</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <Label>Project Manager / PM</Label>
                  <Select value={managerId} onValueChange={(val) => setManagerId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PM" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.pm_role === "coordinator" || e.pm_role === "admin")
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Closing Developer (Optional)</Label>
                  <Select value={closingDevId} onValueChange={(val) => setClosingDevId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <Label>Project Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus(val as Project["status"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead Won">Lead Won</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      {/* Coordinator cannot change to/from Archived status unless they are Admin */}
                      {(isAdmin || project?.status === "Archived") && (
                        <SelectItem value="Archived">Archived</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(val) => setPaymentStatus(val as Project["payment_status"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Financials */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Financial Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="value">Project Value</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    step="0.01"
                    defaultValue={project?.value || ""}
                    placeholder="E.g. 5000"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val || "USD")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PKR">PKR (₨)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 pb-1">
                <Checkbox
                  id="is_monthly_retainer"
                  checked={isMonthlyRetainer}
                  onCheckedChange={(checked) => setIsMonthlyRetainer(!!checked)}
                />
                <Label
                  htmlFor="is_monthly_retainer"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Monthly Retainer Project
                </Label>
              </div>

              {isMonthlyRetainer && (
                <div className="grid gap-4 grid-cols-2 animate-fade-in">
                  <div className="space-y-1">
                    <Label htmlFor="retainer_amount">Monthly Retainer Amount</Label>
                    <Input
                      id="retainer_amount"
                      name="retainer_amount"
                      type="number"
                      step="0.01"
                      defaultValue={project?.retainer_amount || ""}
                      placeholder="E.g. 1500"
                      required={isMonthlyRetainer}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="expected_profit">Expected Profit Margin (Val)</Label>
                    <Input
                      id="expected_profit"
                      name="expected_profit"
                      type="number"
                      step="0.01"
                      defaultValue={project?.expected_profit || ""}
                      placeholder="E.g. 2000"
                    />
                  </div>
                </div>
              )}

              {!isMonthlyRetainer && (
                <div className="space-y-1 animate-fade-in">
                  <Label htmlFor="expected_profit">Expected Profit Margin (Val)</Label>
                  <Input
                    id="expected_profit"
                    name="expected_profit"
                    type="number"
                    step="0.01"
                    defaultValue={project?.expected_profit || ""}
                    placeholder="E.g. 2000"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Timeline */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Timeline & Milestones</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={project?.start_date || ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expected_delivery_date">Expected Delivery</Label>
                <Input
                  id="expected_delivery_date"
                  name="expected_delivery_date"
                  type="date"
                  defaultValue={project?.expected_delivery_date || ""}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="actual_delivery_date">Actual Delivery</Label>
                <Input
                  id="actual_delivery_date"
                  name="actual_delivery_date"
                  type="date"
                  defaultValue={project?.actual_delivery_date || ""}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(isEditing ? `/projects/${project?.id}` : "/projects")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="font-semibold shadow-md px-6">
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

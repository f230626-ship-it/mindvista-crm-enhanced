"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import type { Employee, Project } from "@/types/database";
import { bulkImportProjects } from "@/actions/projects";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allEmployees: Employee[];
  existingProjects: Pick<Project, "name">[];
  onImportSuccess: () => void;
}

interface ParsedRow {
  rowNum: number;
  data: Partial<Project> & {
    manager_name?: string;
    team_members_raw?: string;
  };
  errors: string[];
  warnings: string[];
}

export function ImportDialog({
  open,
  onOpenChange,
  allEmployees,
  existingProjects,
  onImportSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setStats({ total: 0, valid: 0, invalid: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!importing) {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "Project Name",
        "Client Name",
        "Client Email",
        "Description",
        "Start Date",
        "End Date",
        "Project Manager",
        "Team Members",
        "Priority",
        "Status",
        "Budget",
        "Progress Percentage",
      ];

      // Resolve sample dynamic employee names
      const pm = allEmployees.find((e) => e.pm_role === "admin" || e.pm_role === "coordinator")?.full_name || "Daniel Foster";
      const devs = allEmployees
        .filter((e) => e.pm_role === "developer" || e.pm_role === "bd")
        .slice(0, 2)
        .map((e) => e.full_name)
        .join(", ") || "Arjun Mehta, Sophie Laurent";

      const sampleData = [
        {
          "Project Name": "Acme Web App Redesign",
          "Client Name": "Acme Corp",
          "Client Email": "billing@acme.com",
          "Description": "Modernizing the customer-facing web portal using Next.js and Tailwind CSS.",
          "Start Date": "2026-07-01",
          "End Date": "2026-10-31",
          "Project Manager": pm,
          "Team Members": devs,
          "Priority": "High",
          "Status": "In Progress",
          "Budget": 45000,
          "Progress Percentage": 15,
        },
        {
          "Project Name": "Nexus Billing API Integration",
          "Client Name": "Nexus Global",
          "Client Email": "api@nexus-global.io",
          "Description": "Backend API integration with Stripe for international subscription management.",
          "Start Date": "2026-08-15",
          "End Date": "2026-12-15",
          "Project Manager": pm,
          "Team Members": devs,
          "Priority": "Medium",
          "Status": "Onboarding",
          "Budget": 32000,
          "Progress Percentage": 0,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "mindvista_projects_import_template.xlsx");
      toast.success("Sample template downloaded successfully!");
    } catch {
      toast.error("Failed to generate template.");
    }
  };

  // Parse Excel File on Client
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size allowed is 5MB.");
      return;
    }

    // Validate type
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls") {
      toast.error("Invalid file format. Please upload an Excel sheet (.xlsx or .xls).");
      return;
    }

    setFile(selectedFile);
    parseExcel(selectedFile);
  };

  const parseExcel = (selectedFile: File) => {
    setParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

        if (rows.length === 0) {
          toast.error("Excel sheet is empty.");
          setParsing(false);
          return;
        }

        const parsed: ParsedRow[] = [];
        let validCount = 0;
        let invalidCount = 0;

        const existingProjectNames = new Set(
          existingProjects.map((p) => p.name.toLowerCase().trim())
        );

        rows.forEach((row, index) => {
          const rowNum = index + 2; // Row number in Excel sheet (header is row 1)
          const errors: string[] = [];
          const warnings: string[] = [];

          // Column Mapping
          const rawName = String(row["Project Name"] || "").trim();
          const rawClientName = String(row["Client Name"] || "").trim();
          const rawClientEmail = String(row["Client Email"] || "").trim();
          const rawDescription = String(row["Description"] || "").trim();
          const rawStartDate = String(row["Start Date"] || "").trim();
          const rawEndDate = String(row["End Date"] || "").trim();
          const rawPM = String(row["Project Manager"] || "").trim();
          const rawTeam = String(row["Team Members"] || "").trim();
          const rawPriority = String(row["Priority"] || "").trim();
          const rawStatus = String(row["Status"] || "").trim();
          const rawBudget = parseFloat(String(row["Budget"] || "0"));
          const rawProgress = parseInt(String(row["Progress Percentage"] || "0"), 10);

          // Validation Rules
          if (!rawName) errors.push("Project Name is required.");
          if (!rawClientName) errors.push("Client Name is required.");
          if (!rawStartDate) errors.push("Start Date is required.");
          if (!rawEndDate) errors.push("End Date is required.");

          // Validate Dates
          const startDateParsed = new Date(rawStartDate);
          const endDateParsed = new Date(rawEndDate);
          if (rawStartDate && isNaN(startDateParsed.getTime())) {
            errors.push(`Invalid Start Date format: "${rawStartDate}".`);
          }
          if (rawEndDate && isNaN(endDateParsed.getTime())) {
            errors.push(`Invalid End Date format: "${rawEndDate}".`);
          }
          if (rawStartDate && rawEndDate && !isNaN(startDateParsed.getTime()) && !isNaN(endDateParsed.getTime())) {
            if (endDateParsed < startDateParsed) {
              errors.push("End Date cannot be before Start Date.");
            }
          }

          // Duplicate checking in file and DB
          if (rawName && existingProjectNames.has(rawName.toLowerCase())) {
            errors.push(`Duplicate: A project named "${rawName}" already exists in the database.`);
          }
          
          const fileDuplicate = parsed.some((p) => p.data.name?.toLowerCase() === rawName.toLowerCase());
          if (rawName && fileDuplicate) {
            errors.push(`Duplicate in sheet: Project "${rawName}" appears multiple times in this Excel file.`);
          }

          // Map PM Name to Employee ID
          let managerId: string | undefined = undefined;
          if (rawPM) {
            const match = allEmployees.find(
              (e) => e.full_name.toLowerCase() === rawPM.toLowerCase()
            );
            if (match) {
              managerId = match.id;
            } else {
              warnings.push(`Project Manager "${rawPM}" not found in CRM. Row will be imported without an assigned PM.`);
            }
          }

          // Map Team Members Names to list
          const teamMemberNames = rawTeam ? rawTeam.split(",").map((name) => name.trim()).filter(Boolean) : [];
          const matchedTeamIds: string[] = [];
          teamMemberNames.forEach((name) => {
            const match = allEmployees.find((e) => e.full_name.toLowerCase() === name.toLowerCase());
            if (match) {
              matchedTeamIds.push(match.id);
            } else {
              warnings.push(`Team Member "${name}" not found in CRM. Will skip assignment.`);
            }
          });

          // Validate Status
          const validStatuses = [
            "Lead Won", "Onboarding", "In Progress", "On Hold", "Completed",
            "Maintenance", "Paused", "Cancelled", "Archived"
          ];
          let status = "Lead Won";
          if (rawStatus) {
            const matchedStatus = validStatuses.find(
              (s) => s.toLowerCase() === rawStatus.toLowerCase()
            );
            if (matchedStatus) {
              status = matchedStatus;
            } else {
              warnings.push(`Status "${rawStatus}" is invalid. Defaulting to "Lead Won".`);
            }
          }

          // Validate Priority
          const validPriorities = ["Low", "Medium", "High"];
          let priority = "Medium";
          if (rawPriority) {
            const matchedPriority = validPriorities.find(
              (p) => p.toLowerCase() === rawPriority.toLowerCase()
            );
            if (matchedPriority) {
              priority = matchedPriority;
            } else {
              warnings.push(`Priority "${rawPriority}" is invalid. Defaulting to "Medium".`);
            }
          }

          // Validate Budget
          if (isNaN(rawBudget) || rawBudget < 0) {
            errors.push(`Invalid Budget value: "${row["Budget"]}". Must be a non-negative number.`);
          }

          // Validate Progress Percentage
          if (isNaN(rawProgress) || rawProgress < 0 || rawProgress > 100) {
            errors.push(`Invalid Progress Percentage: "${row["Progress Percentage"]}". Must be between 0 and 100.`);
          }

          // Generate placeholder client email if missing
          const clientEmail = rawClientEmail || `${rawClientName.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;

          if (errors.length > 0) {
            invalidCount++;
          } else {
            validCount++;
          }

          parsed.push({
            rowNum,
            data: {
              name: rawName,
              client_name: rawClientName,
              client_email: clientEmail,
              description: rawDescription || null,
              start_date: rawStartDate,
              expected_delivery_date: rawEndDate,
              manager_id: managerId || null,
              status: status as Project["status"],
              priority: priority as "Low" | "Medium" | "High",
              value: rawBudget,
              progress_percentage: rawProgress,
              manager_name: rawPM || undefined,
              team_members_raw: rawTeam || undefined,
              // extra metadata for server action handling resource creation
              ...({ team_employee_ids: matchedTeamIds } as unknown as object),
            },
            errors,
            warnings,
          });
        });

        setParsedRows(parsed);
        setStats({ total: rows.length, valid: validCount, invalid: invalidCount });
        toast.success(`Excel file parsed: ${validCount} rows valid, ${invalidCount} skipped/invalid.`);
      } catch (err) {
        console.error("Error reading excel file:", err);
        toast.error("Failed to parse the Excel file. Make sure the structure matches the template.");
      } finally {
        setParsing(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Submit parsed valid projects to Server Action
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast.error("No valid records to import.");
      return;
    }

    setImporting(true);
    try {
      const importPayload = validRows.map((r) => ({
        ...r.data,
        team_employee_ids: (r.data as unknown as { team_employee_ids: string[] }).team_employee_ids,
      }));

      const response = await bulkImportProjects(importPayload);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(`Import complete! Created ${response.successCount} projects successfully.`);
        onImportSuccess();
        handleClose(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed. Please check backend logs.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="pm-glass-dialog sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Bulk Project Import</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="pm-btn-outline flex items-center gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Download Sample Template
            </Button>
          </div>
          <DialogDescription className="text-xs mt-1">
            Upload an Excel sheet (.xlsx or .xls) to import multiple projects simultaneously. Required fields will be validated before import.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Zone */}
        {!file && (
          <div className="pm-upload-zone mt-4">
            <UploadCloud className="h-10 w-10 text-primary/60 mb-3" />
            <p className="text-sm font-semibold mb-1">Drag and drop your Excel file here</p>
            <p className="text-xs text-muted-foreground mb-4">Or search from directory (.xlsx, .xls up to 5MB)</p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="pm-btn-primary text-primary-foreground"
            >
              Select File
            </Button>
          </div>
        )}

        {parsing && (
          <div className="flex flex-col items-center justify-center p-8 mt-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Parsing Excel rows...</p>
          </div>
        )}

        {file && !parsing && (
          <div className="space-y-4 mt-4 flex-1">
            {/* File info bar */}
            <div className="flex items-center justify-between bg-muted/40 border rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {!importing && (
                <Button variant="ghost" size="icon" onClick={resetState} className="h-7 w-7 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="pm-kpi pm-stagger-1 border-l-4 border-l-slate-400 p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total Rows</p>
                <p className="text-lg font-black">{stats.total}</p>
              </div>
              <div className="pm-kpi pm-stagger-2 border-l-4 border-l-green-500 p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-green-600 dark:text-green-400">Ready to Import</p>
                <p className="text-lg font-black text-green-600 dark:text-green-400">{stats.valid}</p>
              </div>
              <div className="pm-kpi pm-stagger-3 border-l-4 border-l-red-500 p-3 text-center">
                <p className="text-[10px] uppercase font-semibold text-red-600 dark:text-red-400">Skipped (Errors)</p>
                <p className="text-lg font-black text-red-600 dark:text-red-400">{stats.invalid}</p>
              </div>
            </div>

            {/* Preview Table */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">Data Import Preview</p>
              <div className="pm-table-card max-h-[300px] overflow-y-auto">
                <Table className="pm-table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 text-center">Row</TableHead>
                      <TableHead>Status / Validation</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Manager</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row) => (
                      <TableRow
                        key={row.rowNum}
                        className={
                          row.errors.length > 0
                            ? "bg-red-500/5 hover:bg-red-500/10 border-red-200/20 dark:border-red-900/10"
                            : "hover:bg-muted/30"
                        }
                      >
                        <TableCell className="text-center font-mono text-xs">{row.rowNum}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <div className="flex flex-col gap-1 text-[11px] text-destructive font-medium">
                              {row.errors.map((err, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 shrink-0" /> {err}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="h-3 w-3 shrink-0" /> Valid
                              </span>
                              {row.warnings.map((warn, i) => (
                                <span key={i} className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  ⚠️ {warn}
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-xs">{row.data.name || "—"}</TableCell>
                        <TableCell className="text-xs">{row.data.client_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.data.value ? `$${row.data.value.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{row.data.manager_name || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 border-t border-border/40 pt-4 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)} disabled={importing} className="pm-btn-outline">
            Cancel
          </Button>
          {file && !parsing && (
            <Button
              onClick={handleImportSubmit}
              disabled={importing || stats.valid === 0}
              className="pm-btn-primary text-primary-foreground flex items-center gap-1.5"
              size="sm"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing {stats.valid} Projects...
                </>
              ) : (
                `Confirm Import (${stats.valid} records)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { reviewLeave } from "@/actions/leaves";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface PendingLeave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  employee?: {
    full_name: string;
    designation: string;
    employee_code: string | null;
  };
}

export function PendingLeaveApprovals({ leaves }: { leaves: PendingLeave[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (leaves.length === 0) return null;

  async function handleReview(leaveId: string, status: "approved" | "rejected") {
    setLoadingId(leaveId);
    const result = await reviewLeave(leaveId, status);
    setLoadingId(null);

    if (result.error) toast.error(result.error);
    else toast.success(`Leave ${status}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Pending Approvals</h3>
        <Badge variant="secondary">{leaves.length}</Badge>
      </div>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{leave.employee?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {leave.employee?.employee_code ?? leave.employee?.designation}
                  </p>
                </div>
              </TableCell>
              <TableCell>{LEAVE_TYPE_LABELS[leave.leave_type]}</TableCell>
              <TableCell>
                {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
              </TableCell>
              <TableCell>{leave.days_count}</TableCell>
              <TableCell className="max-w-[160px] truncate">{leave.reason}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    disabled={loadingId === leave.id}
                    onClick={() => handleReview(leave.id, "approved")}
                  >
                    {loadingId === leave.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    disabled={loadingId === leave.id}
                    onClick={() => handleReview(leave.id, "rejected")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

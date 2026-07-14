"use client";

import { useState } from "react";
import { createSalesMeeting, updateSalesMeeting, deleteSalesMeeting } from "@/actions/sales-meetings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, CalendarDays, Trash2, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { SalesMeeting, MeetingStatus } from "@/types/database";

const STATUS_COLORS: Record<MeetingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-red-500/15 text-red-600",
};

export function SalesMeetingsClient({
  meetings: initialMeetings,
  error,
}: {
  meetings: SalesMeeting[];
  error: string | null;
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    meeting_date: "",
    meeting_link: "",
    notes: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newMeeting.meeting_date) {
      toast.error("Meeting date is required");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("meeting_date", newMeeting.meeting_date);
    formData.set("meeting_link", newMeeting.meeting_link);
    formData.set("notes", newMeeting.notes);
    const result = await createSalesMeeting(formData);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Meeting scheduled");
      setCreateOpen(false);
      setNewMeeting({ meeting_date: "", meeting_link: "", notes: "" });
      window.location.reload();
    }
  }

  async function handleStatusChange(meetingId: string, status: MeetingStatus) {
    const formData = new FormData();
    formData.set("status", status);
    const result = await updateSalesMeeting(meetingId, formData);
    if (result.error) toast.error(result.error);
    else {
      setMeetings((prev) => prev.map((m) => m.id === meetingId ? { ...m, status } : m));
      toast.success(`Meeting marked as ${status}`);
    }
  }

  async function handleDelete(meetingId: string) {
    const result = await deleteSalesMeeting(meetingId);
    if (result.error) toast.error(result.error);
    else {
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      toast.success("Meeting deleted");
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const pending = meetings.filter((m) => m.status === "pending");
  const completed = meetings.filter((m) => m.status === "completed");
  const cancelled = meetings.filter((m) => m.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Sales Meetings</h2>
          <p className="text-sm text-muted-foreground">
            {pending.length} upcoming · {completed.length} completed · {cancelled.length} cancelled
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {[
          { label: "Upcoming", count: pending.length, color: "text-amber-500" },
          { label: "Completed", count: completed.length, color: "text-green-500" },
          { label: "Cancelled", count: cancelled.length, color: "text-red-500" },
          { label: "Total", count: meetings.length, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 bg-card/70">
            <CardContent className="py-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardContent className="pt-6">
          {meetings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No meetings scheduled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Rep</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(meeting.meeting_date)}
                      </TableCell>
                      <TableCell>
                        {meeting.lead ? (
                          <div>
                            <p className="font-medium">{meeting.lead.lead_name}</p>
                            <p className="text-xs text-muted-foreground">{meeting.lead.company_name}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${STATUS_COLORS[meeting.status]}`}>
                          {meeting.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {meeting.meeting_link ? (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Join
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {meeting.employee?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {meeting.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(meeting.id, "completed")}
                                className="text-xs text-green-600 hover:text-green-600"
                              >
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(meeting.id, "cancelled")}
                                className="text-xs text-red-600 hover:text-red-600"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(meeting.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>Book a new meeting with a prospect.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Meeting date & time *</Label>
              <Input
                type="datetime-local"
                value={newMeeting.meeting_date}
                onChange={(e) => setNewMeeting((m) => ({ ...m, meeting_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting link</Label>
              <Input
                value={newMeeting.meeting_link}
                onChange={(e) => setNewMeeting((m) => ({ ...m, meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newMeeting.notes}
                onChange={(e) => setNewMeeting((m) => ({ ...m, notes: e.target.value }))}
                placeholder="Agenda, preparation notes..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Scheduling..." : "Schedule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

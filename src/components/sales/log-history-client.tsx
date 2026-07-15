"use client";

import { useState } from "react";
import { getLogHistory } from "@/actions/sales";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Search, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  log_date: string;
  connections_sent: number;
  connections_accepted: number;
  messages_sent: number;
  replies_received: number;
  follow_ups_done: number;
  meetings_booked: number;
  leads_added: number;
  proposals_sent: number;
  notes: string | null;
  profile: { name: string; platform: string } | null;
  employee: { full_name: string } | null;
}

export function LogHistoryClient({
  logs: initialLogs,
  error,
}: {
  logs: LogEntry[];
  error: string | null;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function handleFilter() {
    setLoading(true);
    const result = await getLogHistory({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setLoading(false);
    if (result.error) toast.error(result.error);
    else setLogs(result.logs);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Daily Log History
          </CardTitle>
          <CardDescription>View and filter past outreach logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleFilter} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Filtering..." : "Filter"}
            </Button>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  handleFilter();
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur-md">
        <CardContent className="pt-6">
          {error && (
            <p className="text-sm text-destructive mb-4">{error}</p>
          )}
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No logs found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table style={{ tableLayout: 'fixed' }}>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[12%]">Date</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[12%]">Rep</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[14%]">Profile</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">Conn.</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">Accept</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">Msg</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">Reply</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">F/Up</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[8%] text-right">Meet</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[7%] text-right">Leads</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground py-2.5 px-3 w-[7%] text-right">Prop.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-b border-border/30">
                    <TableCell className="py-2.5 px-3 font-medium whitespace-nowrap text-sm">
                      {formatDate(log.log_date)}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-sm truncate">{log.employee?.full_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm truncate">{log.profile?.name ?? <span className="text-muted-foreground">—</span>}</span>
                        {log.profile?.platform && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {log.profile.platform}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums font-semibold">{log.connections_sent}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.connections_accepted}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.messages_sent}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.replies_received}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.follow_ups_done}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.meetings_booked}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.leads_added}</TableCell>
                    <TableCell className="py-2.5 px-3 text-right tabular-nums">{log.proposals_sent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

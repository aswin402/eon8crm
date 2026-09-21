"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Tag,
  User,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { formatHoursMinutes, formatINR, formatDate } from "@/lib/utils";
import { ManualTimeEntryModal } from "@/components/time";
import { MetricCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TimeEntry {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  projectId: string;
  project: { id: string; name: string };
  taskId: string | null;
  task: { id: string; title: string } | null;
  description: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  isBillable: boolean;
  isBilled: boolean;
  isApproved: boolean;
  costRate: string | number;
  billingRate: string | number;
}

interface ProjectOption {
  id: string;
  name: string;
}

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Form
  const [formData, setFormData] = useState({
    projectId: "",
    description: "",
    hours: "1",
    minutes: "30",
    date: new Date().toISOString().split("T")[0],
    isBillable: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    logger.info("DATA", "Fetching timesheets and project allocations...");
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        api.get("/api/v1/time/entries"),
        api.get("/api/v1/projects"),
      ]);
      const entryList = entriesRes.data.entries || [];
      const projectList = projectsRes.data.projects || [];
      setEntries(entryList);
      setProjects(projectList);
      if (projectList.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: projectList[0].id }));
      }
      logger.info("DATA", `Loaded ${entryList.length} time entries across ${projectList.length} projects`);
    } catch (err) {
      logger.error("DATA", "Failed to load time data:", err);
      toast.error("Failed to load time tracking records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);

    const totalMinutes = parseInt(formData.hours || "0", 10) * 60 + parseInt(formData.minutes || "0", 10);
    if (totalMinutes <= 0) {
      setFeedbackMsg({ type: "error", text: "Duration must be greater than 0 minutes." });
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/v1/time/entries", {
        projectId: formData.projectId,
        description: formData.description,
        startTime: new Date(`${formData.date}T09:00:00Z`).toISOString(),
        durationMinutes: totalMinutes,
        isBillable: formData.isBillable,
      });

      setFeedbackMsg({ type: "success", text: "Timesheet entry recorded successfully." });
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, description: "", hours: "1", minutes: "0" }));
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to record manual time entry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveEntry = async (id: string) => {
    try {
      await api.patch(`/api/v1/time/entries/${id}/approve`);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isApproved: true } : e))
      );
      setFeedbackMsg({ type: "success", text: "Time entry approved." });
      toast.success("Time entry approved.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to approve time entry");
    }
  };

  // Aggregations
  const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
  const billableMinutes = entries.filter((e) => e.isBillable).reduce((acc, e) => acc + e.durationMinutes, 0);
  const totalBillableValue = entries.reduce((acc, e) => {
    if (!e.isBillable) return acc;
    return acc + (e.durationMinutes / 60) * Number(e.billingRate);
  }, 0);
  const unbilledMinutes = entries.filter((e) => e.isBillable && !e.isBilled).reduce((acc, e) => acc + e.durationMinutes, 0);

  const handleExportTimesheet = async () => {
    try {
      const res = await api.get("/api/v1/time/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheet_labor_logs_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Timesheet exported successfully.");
    } catch (err) {
      toast.error("Failed to download timesheet export.");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-amber-500 dark:text-amber-400 font-semibold">Time Tracking & Timesheets</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Time & Billable Hours Studio</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Labor costing engine snapshotting internal cost and client billing rates for invoice aggregation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTimesheet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-xs amber-glow"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Manual Time</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Overview Strip */}
      {isLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Time Logged</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {formatHoursMinutes(totalMinutes)}
            </div>
            <p className="text-[11px] text-muted-foreground">{entries.length} logged entries</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Billable Ratio</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0}%
            </div>
            <p className="text-[11px] text-muted-foreground">{formatHoursMinutes(billableMinutes)} client billable</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Billable Value</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {formatINR(totalBillableValue)}
            </div>
            <p className="text-[11px] text-muted-foreground">Gross client labor value</p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-medium">Unbilled Backlog</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {formatHoursMinutes(unbilledMinutes)}
            </div>
            <p className="text-[11px] text-muted-foreground">Ready for invoice pull</p>
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : (
        <div className="rounded-xl bg-card/60 border border-border/80 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-foreground uppercase tracking-wider">
              Timesheet Records <span className="text-amber-500 dark:text-amber-400">({entries.length})</span>
            </span>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/80 bg-muted/30">
                <TableHead className="font-mono text-[11px]">Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Project & Task</TableHead>
                <TableHead>Work Description</TableHead>
                <TableHead className="text-right font-mono text-[11px]">Duration</TableHead>
                <TableHead className="text-right font-mono text-[11px]">Billing Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Approval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No time entries recorded yet. Start the stopwatch dock or log time manually.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  return (
                    <TableRow key={entry.id} className="hover:bg-amber-500/[0.03] transition-colors">
                      <TableCell className="font-mono text-muted-foreground">
                        {formatDate(entry.startTime)}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span>{entry.user.name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="font-medium text-foreground">{entry.project.name}</p>
                        {entry.task && (
                          <p className="text-[11px] text-muted-foreground">{entry.task.title}</p>
                        )}
                      </TableCell>

                      <TableCell className="text-foreground max-w-xs truncate">
                        {entry.description}
                      </TableCell>

                      <TableCell className="text-right font-mono font-medium text-foreground tabular-nums">
                        {formatHoursMinutes(entry.durationMinutes)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                        {entry.isBillable ? (
                          <span className="text-foreground font-medium">{formatINR(entry.billingRate)}/hr</span>
                        ) : (
                          <span className="text-muted-foreground">Non-billable</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {entry.isBilled ? (
                          <Badge variant="outline" className="font-mono text-[10px] bg-muted/40 text-muted-foreground border-border/80">
                            Billed
                          </Badge>
                        ) : entry.isBillable ? (
                          <Badge variant="outline" className="font-mono text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25">
                            Unbilled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-[10px] bg-muted/20 text-muted-foreground border-border/60">
                            Internal
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {entry.isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveEntry(entry.id)}
                            className="text-xs px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium transition-colors cursor-pointer shadow-2xs"
                          >
                            Approve
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Manual Time Entry Modal */}
      <ManualTimeEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateManualEntry}
        isSubmitting={isSubmitting}
        formData={formData}
        setFormData={setFormData}
        projects={projects}
      />
    </div>
  );
}

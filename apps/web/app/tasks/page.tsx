"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Play,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Circle,
  Filter,
  RefreshCw,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toast";
import { MetricCardSkeleton, ListSkeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isCompleted: boolean;
  dueDate: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    client: {
      companyName: string;
    };
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "COMPLETED">("PENDING");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    logger.info("DATA", "Fetching task backlog...");
    try {
      const res = await api.get("/api/v1/projects/all/tasks");
      const list = res.data.tasks || [];
      setTasks(list);
      logger.info("DATA", `Loaded ${list.length} tasks`);
    } catch (err) {
      logger.error("DATA", "Failed to load tasks:", err);
      toast.error("Failed to load task backlog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      logger.info("DATA", `Toggling task ${taskId} completion to ${nextStatus}`);
      await api.patch(`/api/v1/projects/tasks/${taskId}`, {
        isCompleted: nextStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: nextStatus } : t))
      );
      toast.success(nextStatus ? "Task marked as completed." : "Task reopened.");
    } catch (err) {
      logger.error("DATA", "Failed to update task:", err);
      toast.error("Failed to update task status");
    }
  };

  const startTimerOnTask = async (task: TaskItem) => {
    try {
      logger.info("DATA", `Starting timer on task ${task.id} (${task.title})`);
      await api.post("/api/v1/time/timer/start", {
        projectId: task.project.id,
        taskId: task.id,
        description: `Working on: ${task.title}`,
      });
      toast.success(`Timer started for: ${task.title}`);
      window.location.reload(); // Refresh to trigger floating timer dock sync
    } catch (err: any) {
      logger.error("DATA", "Failed to start timer:", err);
      toast.error(err.response?.data?.error || "Failed to start timer");
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "PENDING" && t.isCompleted) return false;
    if (activeTab === "COMPLETED" && !t.isCompleted) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.project.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getPriorityBadge = (p: TaskItem["priority"]) => {
    switch (p) {
      case "URGENT":
        return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200";
      case "HIGH":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const urgentCount = tasks.filter((t) => !t.isCompleted && (t.priority === "URGENT" || t.priority === "HIGH")).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground font-medium">Task Backlog</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-muted-foreground" />
            <span>Tasks & Engineering Deliverables</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-project backlog linked to milestones, billable work, and live timer tracking.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* KPI Overview Strip */}
      {isLoading ? (
        <MetricCardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Active Open Tasks</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">{pendingCount}</div>
            <p className="text-[11px] text-muted-foreground">Requires completion</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Urgent / High Priority</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {urgentCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Critical delivery path</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Completed Deliverables</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Ready for client invoicing</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-card border border-border/80 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
            {(["PENDING", "ALL", "COMPLETED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "PENDING" ? `Open (${pendingCount})` : tab === "COMPLETED" ? `Completed (${completedCount})` : "All"}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-background border border-border/80 rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="bg-card border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <ListSkeleton items={6} />
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No tasks found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All tasks in this view are completed or no matching items found.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskCompletion(task.id, task.isCompleted)}
                    className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={task.isCompleted ? "Reopen task" : "Mark as done"}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/60" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === "URGENT"
                              ? "bg-rose-500"
                              : task.priority === "HIGH"
                              ? "bg-amber-500"
                              : "bg-sky-500"
                          }`}
                        />
                        {task.priority}
                      </span>

                      <Link
                        href="/projects"
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                      >
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span>{task.project.name}</span>
                        <span className="text-muted-foreground/60">({task.project.client.companyName})</span>
                      </Link>
                    </div>

                    <h3
                      className={`text-sm font-medium ${
                        task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                  {task.assignee && (
                    <div className="text-right text-xs">
                      <span className="text-[10px] text-muted-foreground block font-mono">Assignee</span>
                      <span className="font-medium text-foreground flex items-center gap-1 text-xs">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {task.assignee.name}
                      </span>
                    </div>
                  )}

                  {!task.isCompleted && (
                    <button
                      onClick={() => startTimerOnTask(task)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                      title="Start live timer on this task"
                    >
                      <Play className="w-3 h-3 fill-current text-muted-foreground" />
                      <span>Start Timer</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

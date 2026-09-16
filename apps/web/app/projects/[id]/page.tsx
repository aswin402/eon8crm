"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
  User,
  X,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import { Chatter } from "@/components/common/Chatter";

interface Assignee {
  id: string;
  name: string;
  email: string;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isCompleted: boolean;
  dueDate: string | null;
  assignee: Assignee | null;
  createdAt: string;
}

interface MilestoneItem {
  id: string;
  title: string;
  description: string | null;
  amount: string | number;
  completionDate: string | null;
  isApproved: boolean;
  isBilled: boolean;
}

interface TimeEntryItem {
  id: string;
  durationMinutes: number;
  costRate: string | number;
  billingRate: string | number;
  isBillable: boolean;
  startTime: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  task: {
    id: string;
    title: string;
  } | null;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  totalAmount: string | number;
  paidAmount: string | number;
  status: string;
  issueDate: string;
  dueDate: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  clientId: string;
  managerId: string;
  budget: string | number;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "REVIEW" | "COMPLETED" | "ARCHIVED";
  startDate: string | null;
  dueDate: string | null;
  description: string | null;
  client: {
    id: string;
    clientNumber: string;
    companyName: string;
    email: string;
    phone: string | null;
  };
  manager: {
    id: string;
    name: string;
    email: string;
  };
  milestones: MilestoneItem[];
  tasks: TaskItem[];
  timeEntries: TimeEntryItem[];
  invoices: InvoiceItem[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "milestones" | "time" | "invoices" | "chatter">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [assignableStaff, setAssignableStaff] = useState<Assignee[]>([]);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
    assigneeId: "",
    dueDate: "",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    amount: 0,
    completionDate: "",
  });

  const fetchProject = () => {
    setLoading(true);
    api
      .get(`/api/v1/projects/${projectId}`)
      .then((res) => {
        setProject(res.data.project);
      })
      .catch((err) => {
        console.error("Project fetch error:", err);
        setFeedback({ type: "error", text: "Failed to load project details." });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
      api
        .get("/api/v1/users/assignable")
        .then((res) => {
          if (res.data.users) setAssignableStaff(res.data.users);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    try {
      await api.patch(`/api/v1/projects/${projectId}/status`, { status: newStatus });
      setProject({ ...project, status: newStatus as any });
      setFeedback({ type: "success", text: `Project status updated to ${newStatus}.` });
    } catch (err: any) {
      setFeedback({ type: "error", text: "Failed to update project status." });
    }
  };

  const handleToggleTask = async (task: TaskItem) => {
    const updatedStatus = !task.isCompleted;
    // Optimistic update
    setProject((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, isCompleted: updatedStatus } : t)),
      };
    });

    try {
      await api.patch(`/api/v1/projects/tasks/${task.id}`, { isCompleted: updatedStatus });
    } catch (err) {
      fetchProject(); // Revert on failure
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/projects/${projectId}/tasks`, {
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || undefined,
        dueDate: taskForm.dueDate || undefined,
      });

      setFeedback({ type: "success", text: "Task created successfully." });
      setIsTaskModalOpen(false);
      setTaskForm({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
      fetchProject();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error || "Failed to create task." });
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/projects/${projectId}/milestones`, {
        title: milestoneForm.title,
        description: milestoneForm.description || undefined,
        amount: Number(milestoneForm.amount) || 0,
        completionDate: milestoneForm.completionDate || undefined,
      });

      setFeedback({ type: "success", text: "Milestone created successfully." });
      setIsMilestoneModalOpen(false);
      setMilestoneForm({ title: "", description: "", amount: 0, completionDate: "" });
      fetchProject();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.error || "Failed to create milestone." });
    }
  };

  const handleToggleMilestoneApproval = async (milestone: MilestoneItem) => {
    try {
      await api.patch(`/api/v1/projects/milestones/${milestone.id}`, {
        isApproved: !milestone.isApproved,
      });
      fetchProject();
    } catch (err: any) {
      setFeedback({ type: "error", text: "Failed to update milestone." });
    }
  };

  const formatINR = (val: number) => {
    if (!val) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Calculations
  const totalTasks = project?.tasks.length || 0;
  const completedTasks = project?.tasks.filter((t) => t.isCompleted).length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let totalMinutes = 0;
  let totalLaborCost = 0;
  if (project?.timeEntries) {
    for (const te of project.timeEntries) {
      totalMinutes += te.durationMinutes;
      totalLaborCost += (te.durationMinutes / 60) * Number(te.costRate);
    }
  }

  const budgetNum = Number(project?.budget || 0);
  const grossProfit = budgetNum - totalLaborCost;
  const marginPct = budgetNum > 0 ? Math.round((grossProfit / budgetNum) * 100) : 0;

  const filteredTasks = (project?.tasks || []).filter((t) => {
    if (taskFilter === "pending") return !t.isCompleted;
    if (taskFilter === "completed") return t.isCompleted;
    return true;
  });

  const getPriorityDot = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-rose-500";
      case "HIGH":
        return "bg-amber-500";
      case "MEDIUM":
        return "bg-blue-500";
      default:
        return "bg-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-xs text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mb-2 text-foreground" />
        <span>Loading Project 360°...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        <p>Project not found.</p>
        <Link href="/projects" className="underline mt-2 inline-block">
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-foreground transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{project.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs font-mono font-medium px-2 py-0.5 rounded-md border border-border/80 bg-muted/30 text-foreground focus:outline-hidden cursor-pointer"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="REVIEW">REVIEW</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>Client:</span>
            <Link
              href={`/clients/${project.client.id}`}
              className="font-medium text-foreground hover:underline flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-muted-foreground" />
              <span>{project.client.companyName}</span>
            </Link>
            <span>•</span>
            <span>Manager: {project.manager?.name || "Unassigned"}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground text-xs font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-muted/40 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/40 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4-Metric Scoro/Gauzy Profitability Cockpit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Contract Budget</span>
            <DollarSign className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(budgetNum)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Agreed project deal value</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Tracked Time & Labor</span>
            <Clock className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {(totalMinutes / 60).toFixed(1)} hrs
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            Cost: {formatINR(totalLaborCost)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Gross Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {marginPct}%
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                marginPct >= 40 ? "bg-emerald-500" : marginPct >= 20 ? "bg-amber-500" : "bg-rose-500"
              }`}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            Net: {formatINR(grossProfit)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Task Progress</span>
            <CheckSquare className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {progressPct}%
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {completedTasks} of {totalTasks} completed
          </p>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="border-b border-border/80 flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "tasks"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tasks & Sprints ({project.tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "milestones"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Milestones ({project.milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("time")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "time"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timesheet Logs ({project.timeEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "invoices"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Billing & Invoices ({project.invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("chatter")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "chatter"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Project Chatter</span>
        </button>
      </div>

      {/* Tab: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center bg-muted/20 border border-border/80 p-0.5 rounded-md text-xs">
              <button
                onClick={() => setTaskFilter("all")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "all" ? "bg-foreground text-background shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({project.tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter("pending")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "pending" ? "bg-foreground text-background shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({project.tasks.filter((t) => !t.isCompleted).length})
              </button>
              <button
                onClick={() => setTaskFilter("completed")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "completed" ? "bg-foreground text-background shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed ({project.tasks.filter((t) => t.isCompleted).length})
              </button>
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>

          <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="divide-y divide-border/60">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No tasks found under this filter.
                </div>
              ) : (
                filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.isCompleted}
                        onChange={() => handleToggleTask(t)}
                        className="rounded border-border/80 text-foreground focus:ring-0 cursor-pointer w-4 h-4"
                      />
                      <div>
                        <h4
                          className={`text-xs font-medium ${
                            t.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(t.priority)}`} />
                        {t.priority}
                      </span>

                      {t.assignee && (
                        <span className="text-[11px] font-medium text-foreground font-mono bg-muted/30 px-2 py-0.5 rounded border border-border/60">
                          {t.assignee.name.split(" ")[0]}
                        </span>
                      )}

                      {t.dueDate && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {new Date(t.dueDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Milestones */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Milestone delivery deliverables, approval checkpoints, and billing triggers.
            </p>
            <button
              onClick={() => setIsMilestoneModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.milestones.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No delivery milestones created yet.
              </div>
            ) : (
              project.milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">{m.title}</h4>
                      {m.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{m.description}</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                      {formatINR(Number(m.amount))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMilestoneApproval(m)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] border cursor-pointer transition-colors ${
                          m.isApproved
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted/40 border-border/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{m.isApproved ? "Approved by Client" : "Pending Sign-off"}</span>
                      </button>
                    </div>

                    {m.completionDate && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Target: {new Date(m.completionDate).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Timesheet Logs */}
      {activeTab === "time" && (
        <div className="space-y-4">
          <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3 font-mono text-[11px]">Date</th>
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3">Associated Task</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Duration</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Cost Rate</th>
                  <th className="py-2.5 px-3 text-center">Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {project.timeEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No time entries logged for this project yet. Use the top Stopwatch dock to track time.
                    </td>
                  </tr>
                ) : (
                  project.timeEntries.map((te) => (
                    <tr key={te.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground tabular-nums">
                        {new Date(te.startTime).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{te.user?.name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{te.task?.title || "Project Delivery"}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground">
                        {(te.durationMinutes / 60).toFixed(1)}h ({te.durationMinutes}m)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground tabular-nums">
                        ₹{Number(te.costRate).toLocaleString("en-IN")}/hr
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-foreground">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              te.isBillable ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                          />
                          {te.isBillable ? "Billable" : "Internal"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3 font-mono text-[11px]">Invoice #</th>
                  <th className="py-2.5 px-3 font-mono text-[11px]">Issue Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Billed Total</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Paid Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {project.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No invoices billed against this project yet. Go to Invoices to pull unbilled hours.
                    </td>
                  </tr>
                ) : (
                  project.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        <Link href="/invoices" className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground tabular-nums">
                        {new Date(inv.issueDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 font-mono text-[11px] text-foreground">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "PAID"
                                ? "bg-emerald-500"
                                : inv.status === "OVERDUE"
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`}
                          />
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground">
                        ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground tabular-nums">
                        ₹{Number(inv.paidAmount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Project Chatter */}
      {activeTab === "chatter" && (
        <div className="space-y-4">
          <Chatter clientId={project.client.id} />
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Assign Project Task</h3>
                <p className="text-[11px] text-muted-foreground">{project.name}</p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth SSO Flow"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-[11px]">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-[11px]">Assignee</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
                  >
                    <option value="">Unassigned</option>
                    {assignableStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Target Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Task Notes & Criteria</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Acceptance criteria or implementation details..."
                  className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-border/80 text-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors shadow-2xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Milestone Modal */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add Project Milestone</h3>
                <p className="text-[11px] text-muted-foreground">{project.name}</p>
              </div>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1: Core API & Architecture"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground text-[11px]">Milestone Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="150000"
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-foreground text-[11px]">Target Date</label>
                  <input
                    type="date"
                    value={milestoneForm.completionDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, completionDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground text-[11px]">Scope & Deliverables</label>
                <textarea
                  rows={2}
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="Key deliverables required for client sign-off..."
                  className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-border/80 text-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors shadow-2xs"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

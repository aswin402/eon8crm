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
  Users,
  BarChart3,
  Receipt,
  ExternalLink,
  X,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatINR, formatCompactINR, formatDate } from "@/lib/utils";
import { Chatter } from "@/components/common/Chatter";
import {
  CreateTaskModal,
  CreateMilestoneModal,
  TaskFormData,
  MilestoneFormData,
} from "@/components/projects";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TeamCostContribution {
  user: { id: string; name: string; email: string; avatarUrl?: string | null };
  hoursLogged: number;
  laborCost: number;
  billableValue: number;
  netMargin: number;
}

interface ProfitabilityMetrics {
  budget: number;
  budgetBurnAmount: number;
  budgetBurnPercentage: number;
  budgetRemaining: number;
  isOverBudget: boolean;

  totalInvoiced: number;
  totalCollected: number;
  pendingReceivables: number;

  totalHoursLogged: number;
  billableHoursLogged: number;
  nonBillableHoursLogged: number;

  totalLaborCost: number;
  totalBillableValue: number;

  unbilledHours: number;
  unbilledLaborCost: number;
  unbilledBillableValue: number;

  grossProfit: number;
  marginPercentage: number;
  marginHealth: string;

  teamCostContributions: TeamCostContribution[];

  totalTasks: number;
  completedTasks: number;
  taskProgressPercentage: number;

  totalMilestones: number;
  totalMilestoneValue: number;
  billedMilestoneValue: number;
  unbilledMilestoneValue: number;
}

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
  const [profitability, setProfitability] = useState<ProfitabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profitability" | "tasks" | "milestones" | "time" | "invoices" | "chatter">("profitability");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [assignableStaff, setAssignableStaff] = useState<Assignee[]>([]);

  // Form states
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
  });

  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>({
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
        if (res.data.profitability) {
          setProfitability(res.data.profitability);
        }
      })
      .catch((err: any) => {
        logger.warn("DATA", "Project fetch error", err?.message);
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-semibold transition-all shadow-xs amber-glow cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer"
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

      {/* 5-Metric ERP Cost Center & Profitability Cockpit */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Contract Budget */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Contract Budget</span>
            <DollarSign className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(profitability?.budget ?? budgetNum)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Burn: {profitability?.budgetBurnPercentage ?? 0}%</span>
            <span>Rem: {formatCompactINR(profitability?.budgetRemaining ?? 0)}</span>
          </div>
        </div>

        {/* Card 2: Invoiced & Cash Realization */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Invoiced Revenue</span>
            <FileText className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(profitability?.totalInvoiced ?? 0)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            Collected: {formatCompactINR(profitability?.totalCollected ?? 0)}
          </p>
        </div>

        {/* Card 3: Tracked Labor Cost */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Internal Labor Cost</span>
            <Clock className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(profitability?.totalLaborCost ?? totalLaborCost)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            {profitability?.totalHoursLogged ?? (totalMinutes / 60).toFixed(1)} hrs logged
          </p>
        </div>

        {/* Card 4: Gross Profit Margin */}
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Gross Operating Margin</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {profitability?.marginPercentage ?? marginPct}%
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                (profitability?.marginPercentage ?? marginPct) >= 40
                  ? "bg-emerald-500"
                  : (profitability?.marginPercentage ?? marginPct) >= 20
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            Profit: {formatCompactINR(profitability?.grossProfit ?? grossProfit)}
          </p>
        </div>

        {/* Card 5: Unbilled Work In Progress (WIP) */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] shadow-2xs backdrop-blur-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Unbilled Accrual (WIP)</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
            {formatINR(profitability?.unbilledBillableValue ?? 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            {profitability?.unbilledHours ?? 0} billable hrs ready
          </p>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="border-b border-border/80 flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("profitability")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "profitability"
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Cost Center & P&L</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "tasks"
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
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
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
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
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
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
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
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
              ? "border-amber-500 text-amber-500 dark:text-amber-400 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Project Chatter</span>
        </button>
      </div>

      {/* Tab: Cost Center & Profitability P&L (ERPNext-Inspired) */}
      {activeTab === "profitability" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Row: Budget Burn Visual & Cash Realization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget Run Rate */}
            <div className="p-5 rounded-xl border border-border/80 bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
                    Contract Budget Run Rate
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Labor cost consumed against baseline commercial budget
                  </p>
                </div>
                {profitability?.isOverBudget && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    OVER BUDGET
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="text-muted-foreground">
                    Burned: {formatINR(profitability?.budgetBurnAmount ?? totalLaborCost)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {profitability?.budgetBurnPercentage ?? 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (profitability?.budgetBurnPercentage ?? 0) > 100
                        ? "bg-rose-500"
                        : (profitability?.budgetBurnPercentage ?? 0) > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, profitability?.budgetBurnPercentage ?? 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono pt-1">
                  <span>Target: {formatINR(profitability?.budget ?? budgetNum)}</span>
                  <span>Remaining: {formatINR(profitability?.budgetRemaining ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Invoiced & Unbilled Work In Progress */}
            <div className="p-5 rounded-xl border border-border/80 bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
                    Revenue & Unbilled WIP Realization
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Cash flow, client collections, and accrued unbilled services
                  </p>
                </div>
                <Link
                  href="/invoices"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  <span>Invoices</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 border border-border/80 rounded-lg text-center font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">INVOICED</span>
                  <span className="font-semibold text-foreground text-xs">
                    {formatINR(profitability?.totalInvoiced ?? 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">COLLECTED</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                    {formatINR(profitability?.totalCollected ?? 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block">UNBILLED WIP</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">
                    {formatINR(profitability?.unbilledBillableValue ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Resource Labor Cost & Margin Contribution */}
          <div className="p-5 rounded-xl border border-border/80 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
                  Team Resource Labor Cost & Margin Contribution
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Internal hourly labor cost vs client billable value generated per consultant
                </p>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {(profitability?.teamCostContributions || []).length} Contributors
              </span>
            </div>

            <div className="border border-border/80 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 bg-muted/20">
                    <TableHead className="py-2.5 px-3 font-mono text-[10px]">TEAM MEMBER</TableHead>
                    <TableHead className="py-2.5 px-3 text-right font-mono text-[10px]">HOURS LOGGED</TableHead>
                    <TableHead className="py-2.5 px-3 text-right font-mono text-[10px]">INTERNAL LABOR COST</TableHead>
                    <TableHead className="py-2.5 px-3 text-right font-mono text-[10px]">BILLABLE VALUE</TableHead>
                    <TableHead className="py-2.5 px-3 text-right font-mono text-[10px]">NET CONTRIBUTION MARGIN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!profitability?.teamCostContributions || profitability.teamCostContributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                        No time entries logged on this project yet. Start the timer dock to track labor costs.
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitability.teamCostContributions.map((tc, idx) => (
                      <TableRow key={idx} className="hover:bg-amber-500/[0.03] transition-colors">
                        <TableCell className="py-2.5 px-3">
                          <div className="font-medium text-foreground">{tc.user.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{tc.user.email}</div>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                          {tc.hoursLogged} hrs
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                          {formatINR(tc.laborCost)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground">
                          {formatINR(tc.billableValue)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-mono font-medium tabular-nums">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${
                              tc.netMargin >= 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {tc.netMargin >= 0 ? "+" : ""}
                            {formatINR(tc.netMargin)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Analytical Profit & Loss Statement (ERPNext Cost Center view) */}
          <div className="p-5 rounded-xl border border-border/80 bg-card/60 space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-foreground uppercase font-mono tracking-wider">
                Analytical Cost Center P&L Statement
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Service delivery profit & loss breakdown benchmarked against project budget
              </p>
            </div>

            <div className="p-4 bg-muted/20 border border-border/80 rounded-lg space-y-2 font-mono text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>(+) Gross Billed Tax Invoices:</span>
                <span className="text-foreground">{formatINR(profitability?.totalInvoiced ?? 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>(+) Unbilled WIP Accrued Value:</span>
                <span className="text-amber-600 dark:text-amber-400">
                  +{formatINR(profitability?.unbilledBillableValue ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>(=) Total Effective Project Revenue:</span>
                <span className="font-semibold text-foreground">
                  {formatINR(
                    (profitability?.totalInvoiced || 0) + (profitability?.unbilledBillableValue || 0)
                  )}
                </span>
              </div>
              <div className="h-px bg-border/60 my-1.5" />
              <div className="flex justify-between text-muted-foreground">
                <span>
                  (-) Direct Internal Labor Cost ({profitability?.totalHoursLogged ?? 0} hrs):
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  -{formatINR(profitability?.totalLaborCost ?? 0)}
                </span>
              </div>
              <div className="h-px bg-border/60 my-1.5" />
              <div className="flex justify-between text-sm font-bold">
                <span>(=) Net Operating Gross Margin:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatINR(profitability?.grossProfit ?? 0)} ({profitability?.marginPercentage ?? 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTaskFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "all" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({project.tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter("pending")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "pending" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({project.tasks.filter((t) => !t.isCompleted).length})
              </button>
              <button
                onClick={() => setTaskFilter("completed")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  taskFilter === "completed" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed ({project.tasks.filter((t) => t.isCompleted).length})
              </button>
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer shadow-2xs"
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
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-amber-500/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.isCompleted}
                        onChange={() => handleToggleTask(t)}
                        className="rounded border-border/80 text-amber-500 focus:ring-0 cursor-pointer w-4 h-4 accent-amber-500"
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
                      <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-muted/40 text-foreground border-border/80">
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(t.priority)}`} />
                        {t.priority}
                      </Badge>

                      {t.assignee && (
                        <span className="text-[11px] font-medium text-foreground font-mono bg-muted/30 px-2 py-0.5 rounded border border-border/60">
                          {t.assignee.name.split(" ")[0]}
                        </span>
                      )}

                      {t.dueDate && (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {formatDate(t.dueDate)}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer shadow-2xs"
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
                  className="p-4 rounded-xl border border-border/80 hover:border-amber-500/30 bg-card/60 shadow-2xs space-y-3 transition-colors"
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
                        Target: {formatDate(m.completionDate)}
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
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/30">
                  <TableHead className="py-2.5 px-3 font-mono text-[11px]">Date</TableHead>
                  <TableHead className="py-2.5 px-3">Team Member</TableHead>
                  <TableHead className="py-2.5 px-3">Associated Task</TableHead>
                  <TableHead className="py-2.5 px-3 font-mono text-right text-[11px]">Duration</TableHead>
                  <TableHead className="py-2.5 px-3 font-mono text-right text-[11px]">Cost Rate</TableHead>
                  <TableHead className="py-2.5 px-3 text-center">Billable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.timeEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No time entries logged for this project yet. Use the top Stopwatch dock to track time.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.timeEntries.map((te) => (
                    <TableRow key={te.id} className="hover:bg-amber-500/[0.03] transition-colors">
                      <TableCell className="py-2.5 px-3 font-mono text-muted-foreground tabular-nums">
                        {formatDate(te.startTime)}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 font-medium text-foreground">{te.user?.name}</TableCell>
                      <TableCell className="py-2.5 px-3 text-muted-foreground">{te.task?.title || "Project Delivery"}</TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground">
                        {(te.durationMinutes / 60).toFixed(1)}h ({te.durationMinutes}m)
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground tabular-nums">
                        {formatINR(Number(te.costRate))}/hr
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={`gap-1 font-mono text-[10px] ${
                            te.isBillable
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-muted/40 text-muted-foreground border-border/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              te.isBillable ? "bg-amber-500" : "bg-zinc-400"
                            }`}
                          />
                          {te.isBillable ? "Billable" : "Internal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/30">
                  <TableHead className="py-2.5 px-3 font-mono text-[11px]">Invoice #</TableHead>
                  <TableHead className="py-2.5 px-3 font-mono text-[11px]">Issue Date</TableHead>
                  <TableHead className="py-2.5 px-3">Status</TableHead>
                  <TableHead className="py-2.5 px-3 font-mono text-right text-[11px]">Billed Total</TableHead>
                  <TableHead className="py-2.5 px-3 font-mono text-right text-[11px]">Paid Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No invoices billed against this project yet. Go to Invoices to pull unbilled hours.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-amber-500/[0.03] transition-colors">
                      <TableCell className="py-2.5 px-3 font-mono font-medium text-foreground">
                        <Link href="/invoices" className="hover:text-amber-500 hover:underline transition-colors">
                          {inv.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 font-mono text-muted-foreground tabular-nums">
                        {formatDate(inv.issueDate)}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 font-mono text-[10px] ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : inv.status === "OVERDUE"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "PAID"
                                ? "bg-emerald-500"
                                : inv.status === "OVERDUE"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground">
                        {formatINR(Number(inv.totalAmount))}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground tabular-nums">
                        {formatINR(Number(inv.paidAmount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        projectName={project.name}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        assignableStaff={assignableStaff}
      />

      {/* Create Milestone Modal */}
      <CreateMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSubmit={handleCreateMilestone}
        projectName={project.name}
        milestoneForm={milestoneForm}
        setMilestoneForm={setMilestoneForm}
      />
    </div>
  );
}

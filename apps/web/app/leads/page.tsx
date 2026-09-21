"use client";

import React, { useState, useEffect } from "react";
import {
  Kanban,
  List,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  Search,
  CheckCircle2,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Briefcase,
  Layers,
  Sparkles,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { formatCompactINR, formatDate } from "@/lib/utils";
import { ConvertLeadModal } from "@/components/leads/ConvertLeadModal";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { MetricCardSkeleton, KanbanColumnSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PIPELINE_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

const getStageBadgeVariant = (stage: PipelineStage) => {
  switch (stage) {
    case "WON":
      return "success" as const;
    case "NEGOTIATION":
    case "PROPOSAL":
      return "amber" as const;
    case "QUALIFIED":
    case "MEETING":
      return "info" as const;
    default:
      return "secondary" as const;
  }
};

interface Lead {
  id: string;
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: string;
  industry?: string | null;
  serviceInterest?: string | null;
  estimatedValue: number;
  status: PipelineStage;
  notes?: string | null;
  createdAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  convertedClient?: {
    id: string;
    clientNumber: string;
    companyName: string;
  } | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // Drag & drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<PipelineStage | null>(null);

  // Selected lead for Slide-Over Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modals state
  const [convertTargetLead, setConvertTargetLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    logger.info("DATA", "Fetching lead pipeline opportunities...");
    api
      .get("/api/v1/leads")
      .then((res) => {
        const leadList = res.data.leads || [];
        setLeads(leadList);
        logger.info("DATA", `Loaded ${leadList.length} pipeline opportunities`);
      })
      .catch((err) => {
        logger.error("DATA", "Failed to fetch leads", err);
        toast.error("Failed to load lead opportunities. Please refresh.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: PipelineStage) => {
    if (newStatus === "WON") {
      const target = leads.find((l) => l.id === leadId);
      if (target && !target.convertedClient) {
        setConvertTargetLead(target);
        return;
      }
    }

    // Optimistic UI state update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      logger.info("DATA", `Updating lead ${leadId} status to ${newStatus}`);
      await api.patch(`/api/v1/leads/${leadId}/status`, { status: newStatus });
      toast.success(`Deal moved to stage: ${newStatus}`);
    } catch (err) {
      logger.error("DATA", "Failed to update lead status", err);
      toast.error("Failed to update deal stage. Reverting...");
      fetchLeads(); // Revert on failure
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetStage !== stage) {
      setDropTargetStage(stage);
    }
  };

  const handleDragLeave = (stage: PipelineStage) => {
    if (dropTargetStage === stage) {
      setDropTargetStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    setDropTargetStage(null);
    setDraggedLeadId(null);

    if (leadId) {
      handleStatusChange(leadId, targetStage);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leadNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      sourceFilter === "ALL" || l.source.toLowerCase() === sourceFilter.toLowerCase();

    return matchesSearch && matchesSource;
  });

  // Calculate Pipeline Metrics
  const activeLeads = leads.filter((l) => l.status !== "WON");
  const wonLeads = leads.filter((l) => l.status === "WON");
  const totalPipelineValue = activeLeads.reduce(
    (sum, l) => sum + Number(l.estimatedValue || 0),
    0
  );
  const totalWonValue = wonLeads.reduce(
    (sum, l) => sum + Number(l.estimatedValue || 0),
    0
  );
  const winRate =
    leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avgDealSize =
    leads.length > 0
      ? Math.round(
          leads.reduce((s, l) => s + Number(l.estimatedValue || 0), 0) /
            leads.length
        )
      : 0;

  const getStageDot = (stage: PipelineStage) => {
    switch (stage) {
      case "WON":
        return "bg-emerald-500";
      case "NEGOTIATION":
        return "bg-amber-500";
      case "PROPOSAL":
        return "bg-blue-500";
      case "MEETING":
        return "bg-purple-500";
      case "QUALIFIED":
        return "bg-cyan-500";
      case "CONTACTED":
        return "bg-indigo-400";
      default:
        return "bg-zinc-400";
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 space-y-4 max-w-[1700px] mx-auto overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span>Sales</span>
            <span>/</span>
            <span className="text-foreground">Deal Pipeline</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Pipeline Opportunities
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage stage progression, drag-and-drop deals, and execute 1-click client conversions.
          </p>
        </div>

        {/* Actions & View Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter company, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 w-44 sm:w-56 text-foreground placeholder:text-muted-foreground transition-colors"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/20 border border-border/80 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* New Lead Action */}
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-semibold transition-all shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-card/70 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-md hover:shadow-amber-500/5 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Active Pipeline</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1.5 text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatCompactINR(totalPipelineValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{activeLeads.length} open opportunities</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 hover:border-border transition-all shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Closed Won</span>
              <TrendingUp className="w-4 h-4 text-emerald-500/80" />
            </div>
            <div className="mt-1.5 text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatCompactINR(totalWonValue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{wonLeads.length} converted accounts</p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/15 bg-card/60 hover:border-amber-500/30 transition-all shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Win Rate</span>
              <CheckCircle2 className="w-4 h-4 text-amber-500/80" />
            </div>
            <div className="mt-1.5 text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {winRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Won vs. total pipeline</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 hover:border-border transition-all shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Average Deal Size</span>
              <Briefcase className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <div className="mt-1.5 text-xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatCompactINR(avgDealSize)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Per captured lead</p>
          </div>
        </div>
      )}

      {/* Main Board Canvas */}
      {loading ? (
        viewMode === "kanban" ? (
          <KanbanColumnSkeleton count={6} />
        ) : (
          <TableSkeleton rows={8} columns={7} />
        )
      ) : viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex gap-3 min-w-[1450px] h-full items-start">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              const totalValue = stageLeads.reduce(
                (sum, l) => sum + Number(l.estimatedValue || 0),
                0
              );
              const isDropTarget = dropTargetStage === stage;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => handleDragLeave(stage)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`w-72 shrink-0 flex flex-col h-full bg-muted/15 border rounded-xl p-2.5 space-y-2.5 transition-all ${
                    isDropTarget
                      ? "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : "border-border/80"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getStageDot(stage)}`} />
                      <span className="text-xs font-semibold text-foreground tracking-tight">
                        {stage}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/50 text-muted-foreground border border-border/60">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground tabular-nums">
                      {formatCompactINR(totalValue)}
                    </span>
                  </div>

                  {/* Cards Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-lg bg-card/90 border border-border/80 shadow-2xs hover:border-amber-500/40 hover:shadow-md hover:shadow-amber-500/5 transition-all space-y-2 group cursor-pointer select-none ${
                          draggedLeadId === lead.id ? "opacity-40" : ""
                        }`}
                      >
                        {/* Header: Lead Number & Value */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-muted-foreground font-mono">
                            <GripVertical className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                            <span>{lead.leadNumber}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground tabular-nums">
                            {formatCompactINR(Number(lead.estimatedValue))}
                          </span>
                        </div>

                        {/* Company & Contact */}
                        <div>
                          <h4 className="font-medium text-xs text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:underline leading-tight truncate transition-colors">
                            {lead.companyName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {lead.contactPerson}
                          </p>
                        </div>

                        {/* Metadata Tag Strip */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/60 font-mono">
                          <span className="truncate max-w-[110px]">{lead.source}</span>
                          <span className="text-foreground/80 font-medium">
                            {lead.assignedTo?.name?.split(" ")[0] || "Unassigned"}
                          </span>
                        </div>

                        {/* Stage Quick Mover */}
                        <div className="pt-1 flex items-center justify-between gap-1.5">
                          {stage !== "WON" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextIndex = PIPELINE_STAGES.indexOf(stage) + 1;
                                if (nextIndex < PIPELINE_STAGES.length) {
                                  handleStatusChange(lead.id, PIPELINE_STAGES[nextIndex]);
                                }
                              }}
                              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 bg-muted/30 hover:bg-amber-500/10 border border-border/80 hover:border-amber-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer w-full justify-center"
                            >
                              <span>Next Stage</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 w-full justify-center py-0.5 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Won & Converted
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-[11px] text-muted-foreground/50 border border-dashed border-border/60 rounded-lg">
                        Drop deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View using Shadcn Table Suite */
        <div className="flex-1 overflow-auto rounded-xl bg-card border border-border/80 shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[11px]">Lead Ref</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="font-mono text-right text-[11px]">Estimated Value</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="cursor-pointer group"
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {lead.leadNumber}
                  </TableCell>
                  <TableCell className="font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {lead.companyName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.contactPerson}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStageBadgeVariant(lead.status)} className="gap-1.5 font-mono text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${getStageDot(lead.status)}`} />
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                    {formatCompactINR(Number(lead.estimatedValue))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.assignedTo?.name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    {lead.status !== "WON" ? (
                      <button
                        onClick={() => handleStatusChange(lead.id, "WON")}
                        className="text-[11px] px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium transition-colors cursor-pointer shadow-2xs"
                      >
                        Convert to Client
                      </button>
                    ) : (
                      <Badge variant="success" className="font-mono text-[11px]">
                        Won
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Slide-Over Drawer for Selected Lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border-l border-border/80 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/80 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>{selectedLead.leadNumber}</span>
                  <span>•</span>
                  <span>{formatDate(selectedLead.createdAt)}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mt-1">
                  {selectedLead.companyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Estimated Deal Value Banner */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Estimated Value</p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums mt-0.5">
                    {formatCompactINR(Number(selectedLead.estimatedValue))}
                  </p>
                </div>
                {selectedLead.status !== "WON" ? (
                  <button
                    onClick={() => {
                      const target = selectedLead;
                      setSelectedLead(null);
                      setConvertTargetLead(target);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground hover:bg-foreground/90 text-background font-medium shadow-2xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert Deal</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Won Client
                  </span>
                )}
              </div>

              {/* Interactive Stage Pipeline Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-foreground">Pipeline Stage</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PIPELINE_STAGES.map((s) => {
                    const isCurrent = selectedLead.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedLead.id, s)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left cursor-pointer border ${
                          isCurrent
                            ? "bg-foreground text-background border-foreground font-semibold shadow-2xs"
                            : "bg-muted/20 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStageDot(s)}`} />
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <h4 className="font-semibold text-foreground text-xs">Contact Details</h4>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Contact Person</span>
                    <span className="font-medium text-foreground">{selectedLead.contactPerson}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Address</span>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="font-mono text-foreground hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{selectedLead.email}</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone Number</span>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="font-mono text-foreground hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{selectedLead.phone}</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lead Source</span>
                    <span className="font-medium text-foreground">{selectedLead.source}</span>
                  </div>
                  {selectedLead.serviceInterest && (
                    <div className="flex items-center justify-between">
                      <span>Service Interest</span>
                      <span className="font-medium text-foreground">{selectedLead.serviceInterest}</span>
                    </div>
                  )}
                  {selectedLead.assignedTo && (
                    <div className="flex items-center justify-between">
                      <span>Opportunity Owner</span>
                      <span className="font-medium text-foreground">{selectedLead.assignedTo.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Converted Client Reference */}
              {selectedLead.convertedClient && (
                <div className="p-3 rounded-md bg-muted/30 border border-border/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono">LINKED CLIENT ACCOUNT</p>
                    <p className="font-semibold text-foreground text-xs">{selectedLead.convertedClient.companyName}</p>
                  </div>
                  <Link
                    href={`/clients/${selectedLead.convertedClient.id}`}
                    className="inline-flex items-center gap-1 text-xs text-foreground hover:underline font-medium"
                  >
                    <span>View 360°</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <h4 className="font-semibold text-foreground text-xs">Opportunity Notes</h4>
                  <p className="p-3 rounded-md bg-muted/20 border border-border/80 text-muted-foreground text-[11px] whitespace-pre-wrap">
                    {selectedLead.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Convert Lead Modal */}
      {convertTargetLead && (
        <ConvertLeadModal
          lead={convertTargetLead}
          onClose={() => setConvertTargetLead(null)}
          onSuccess={() => {
            setConvertTargetLead(null);
            fetchLeads();
          }}
        />
      )}

      {/* New Lead Creation Modal */}
      {showNewLeadModal && (
        <NewLeadModal
          onClose={() => setShowNewLeadModal(false)}
          onSuccess={() => {
            setShowNewLeadModal(false);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}

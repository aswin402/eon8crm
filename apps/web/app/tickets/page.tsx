"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Filter,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { Chatter } from "@/components/common/Chatter";
import { toast } from "@/components/ui/toast";
import { CreateTicketModal } from "@/components/tickets";
import { MetricCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchTickets = () => {
    setLoading(true);
    logger.info("DATA", `Fetching tickets (priorityFilter=${priorityFilter || "all"})...`);
    const query = priorityFilter ? `?priority=${priorityFilter}` : "";
    api
      .get(`/api/v1/tickets${query}`)
      .then((res) => {
        const list = res.data.tickets || [];
        setTickets(list);
        logger.info("DATA", `Loaded ${list.length} support tickets`);
      })
      .catch((err) => {
        logger.error("DATA", "Tickets error:", err);
        toast.error("Failed to load support tickets");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [priorityFilter]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      logger.info("DATA", `Updating ticket ${ticketId} status to ${newStatus}`);
      await api.patch(`/api/v1/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Ticket status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      logger.error("DATA", "Failed to update ticket status:", err);
      toast.error("Failed to update ticket status");
    }
  };

  // KPI calculations
  const totalCount = tickets.length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length;
  const breachedCount = tickets.filter((t) => t.sla?.isBreached && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground font-medium">Customer Support & SLAs</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Headphones className="w-5 h-5 text-muted-foreground" />
            <span>Support Tickets & SLA Tracking</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Client issue resolution with priority-driven SLA countdown timers and threaded activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Filter */}
          <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setPriorityFilter("")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                priorityFilter === "" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter("URGENT")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                priorityFilter === "URGENT" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setPriorityFilter("HIGH")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                priorityFilter === "HIGH" ? "bg-amber-500 text-slate-950 font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              High
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Tickets</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {totalCount}
            </div>
            <p className="text-[11px] text-muted-foreground">All client support requests</p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-card/70 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-md hover:shadow-amber-500/5 space-y-1 backdrop-blur-xs">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Urgent / High</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {urgentCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Critical path resolution</p>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/20 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">SLA Breached</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {breachedCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Requires immediate review</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Resolved</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Closed client issues</p>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px]">Ticket #</TableHead>
                <TableHead className="py-3 px-4 font-medium">Client</TableHead>
                <TableHead className="py-3 px-4 font-medium">Subject & Summary</TableHead>
                <TableHead className="py-3 px-4 font-medium">Priority</TableHead>
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px]">SLA Countdown</TableHead>
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px]">Status</TableHead>
                <TableHead className="py-3 px-4 font-medium text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => {
                const isBreached = t.sla?.isBreached;
                const remainingMins = t.sla?.timeRemainingMinutes;

                return (
                  <TableRow
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="group cursor-pointer"
                  >
                    <TableCell className="py-3.5 px-4 font-mono font-medium text-foreground">{t.ticketNumber}</TableCell>
                    <TableCell className="py-3.5 px-4 font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t.client?.companyName}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-foreground truncate">{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t.description}</p>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-mono">
                      <Badge
                        variant={
                          t.priority === "URGENT"
                            ? "destructive"
                            : t.priority === "HIGH"
                            ? "amber"
                            : "info"
                        }
                        className="gap-1.5 font-mono text-[10px]"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.priority === "URGENT"
                              ? "bg-rose-500"
                              : t.priority === "HIGH"
                              ? "bg-amber-500"
                              : "bg-sky-500"
                          }`}
                        />
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-mono text-xs">
                      {t.status === "RESOLVED" || t.status === "CLOSED" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : isBreached ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> SLA Breached
                        </span>
                      ) : remainingMins !== null ? (
                        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {Math.floor(remainingMins / 60)}h {remainingMins % 60}m remaining
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Standard</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(
                            t.id,
                            t.status === "RESOLVED" ? "OPEN" : "RESOLVED"
                          );
                        }}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
                          t.status === "RESOLVED"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                            : "border-border/80 bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {t.status === "RESOLVED" ? "Re-open" : "Mark Resolved"}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {tickets.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No support tickets found for this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Ticket Details Sheet Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-card h-full border-l border-border/80 shadow-2xl flex flex-col p-6 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <div>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {selectedTicket.ticketNumber}
                </span>
                <h2 className="text-base font-semibold text-foreground mt-0.5">{selectedTicket.subject}</h2>
                <p className="text-xs text-muted-foreground">
                  Client: {selectedTicket.client?.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-lg bg-muted/20 border border-border/80 space-y-1.5 text-xs">
              <span className="font-medium text-foreground">Issue Description:</span>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-xs">
                {selectedTicket.description}
              </p>
            </div>

            {/* Embedded Universal Chatter */}
            <div className="pt-2">
              <h3 className="text-xs font-mono tracking-wider text-muted-foreground uppercase mb-3">
                Resolution Stream
              </h3>
              <Chatter clientId={selectedTicket.clientId} />
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}

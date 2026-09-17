"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  FileText,
  Briefcase,
  Headphones,
  MessageSquare,
  ChevronRight,
  Filter,
  CheckCircle2,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  type: "PROJECT_DEADLINE" | "INVOICE_DUE" | "TICKET_SLA" | "ACTIVITY";
  date: string;
  status?: string;
  priority?: string;
  amount?: number;
  entityId: string;
  link: string;
  description?: string;
  metadata?: Record<string, any>;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/calendar/events");
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (activeFilter !== "ALL" && ev.type !== activeFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.description && ev.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getEventBadge = (type: CalendarEvent["type"], status?: string, priority?: string) => {
    switch (type) {
      case "INVOICE_DUE":
        if (status === "OVERDUE") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Overdue
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Invoice Due
          </span>
        );
      case "PROJECT_DEADLINE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Project Target
          </span>
        );
      case "TICKET_SLA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                priority === "URGENT" ? "bg-rose-500" : "bg-amber-500"
              }`}
            />
            SLA Target
          </span>
        );
      case "ACTIVITY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Follow-up
          </span>
        );
    }
  };

  const getRelativeDays = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((targetMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "Today", isUrgent: true, isPast: false };
    if (diffDays === 1) return { label: "Tomorrow", isUrgent: false, isPast: false };
    if (diffDays > 1) return { label: `In ${diffDays} days`, isUrgent: false, isPast: false };
    if (diffDays === -1) return { label: "Yesterday", isUrgent: true, isPast: true };
    return { label: `${Math.abs(diffDays)} days ago`, isUrgent: true, isPast: true };
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground font-medium">Centralized Schedule</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <span>Master Operational Calendar</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unified chronological schedule of project milestones, invoice settlements, and support SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Project Milestones</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {events.filter((e) => e.type === "PROJECT_DEADLINE").length}
          </div>
          <p className="text-[11px] text-muted-foreground">Pending delivery deadlines</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Invoices Due</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {events.filter((e) => e.type === "INVOICE_DUE").length}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {events.filter((e) => e.type === "INVOICE_DUE" && e.status === "OVERDUE").length} currently overdue
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Support SLAs</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {events.filter((e) => e.type === "TICKET_SLA").length}
          </div>
          <p className="text-[11px] text-muted-foreground">Active ticket targets</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Client Activities</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {events.filter((e) => e.type === "ACTIVITY").length}
          </div>
          <p className="text-[11px] text-muted-foreground">Logged touchpoints</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-card border border-border/80 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
            {[
              { key: "ALL", label: "All Items" },
              { key: "PROJECT_DEADLINE", label: "Deadlines" },
              { key: "INVOICE_DUE", label: "Invoices" },
              { key: "TICKET_SLA", label: "SLAs" },
              { key: "ACTIVITY", label: "Activities" },
            ].map((tab) => {
              const isSelected = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search schedule events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>

      {/* Event Agenda & Timeline */}
      <div className="bg-card border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Operational Schedule Timeline ({filteredEvents.length})
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">Chronological order</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
            Loading centralized calendar schedule...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No events found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              There are no scheduled deliverables or invoice due dates matching your filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredEvents.map((ev) => {
              const rel = getRelativeDays(ev.date);
              const eventDate = new Date(ev.date);

              return (
                <div
                  key={ev.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date Block */}
                    <div className="w-12 h-12 rounded-lg border border-border/80 bg-muted/30 flex flex-col items-center justify-center shrink-0 text-center font-mono">
                      <span className="text-[10px] uppercase font-medium text-muted-foreground">
                        {eventDate.toLocaleString("default", { month: "short" })}
                      </span>
                      <span className="text-base font-semibold leading-none text-foreground">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEventBadge(ev.type, ev.status, ev.priority)}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border border-border/60 ${
                            rel.isPast && rel.isUrgent
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
                              : rel.isUrgent
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                              : "bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {rel.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-foreground">
                        {ev.title}
                      </h3>

                      {ev.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {ev.amount !== undefined && (
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-mono">Balance Due</span>
                        <span className="text-sm font-semibold font-mono text-foreground tabular-nums">
                          {formatINR(ev.amount)}
                        </span>
                      </div>
                    )}

                    <Link
                      href={ev.link}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border/80 bg-background text-foreground hover:bg-muted transition-colors shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

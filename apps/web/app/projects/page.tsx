"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  CheckSquare,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import { formatCompactINR as formatINR } from "@/lib/utils";
import { MetricCardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchProjects = () => {
    setLoading(true);
    logger.info("DATA", `Fetching projects (filter=${statusFilter || "all"})...`);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    api
      .get(`/api/v1/projects${query}`)
      .then((res) => {
        const list = res.data.projects || [];
        setProjects(list);
        logger.info("DATA", `Loaded ${list.length} projects`);
      })
      .catch((err) => {
        logger.error("DATA", "Projects error:", err);
        toast.error("Failed to load client projects");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  // Summary metrics
  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalHours = projects.reduce((sum, p) => sum + Number(p.stats?.totalHoursLogged || 0), 0);
  const avgMargin =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + Number(p.stats?.marginPercentage || 0), 0) /
            projects.length
        )
      : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground font-medium">Projects & Delivery</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <span>Client Projects & Margin Engine</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time project profitability, billable hour tracking, and deliverable task progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "ACTIVE" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("PLANNING")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "PLANNING" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Planning
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Active Projects</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {activeCount}
            </div>
            <p className="text-[11px] text-muted-foreground">{projects.length} total portfolios</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Contract Budget</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {formatINR(totalBudget)}
            </div>
            <p className="text-[11px] text-muted-foreground">Aggregated deal value</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Hours Tracked</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
              {totalHours} hrs
            </div>
            <p className="text-[11px] text-muted-foreground">Logged labor time</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Avg Gross Margin</span>
            <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {avgMargin}%
            </div>
            <p className="text-[11px] text-muted-foreground">Across delivery fleet</p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-card/60 border border-border/80 shadow-2xs space-y-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-muted/60 rounded w-2/3" />
                <div className="h-3 bg-muted/40 rounded w-1/3" />
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex justify-between">
                  <div className="h-3 bg-muted/40 rounded w-1/4" />
                  <div className="h-3 bg-muted/50 rounded w-1/4" />
                </div>
                <div className="h-2 bg-muted/40 rounded-full w-full" />
              </div>
              <div className="pt-2 flex justify-between items-center">
                <div className="h-4 bg-muted/50 rounded w-1/3" />
                <div className="h-4 bg-muted/50 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
          const stats = p.stats || {};
          const isHighMargin = stats.marginHealth === "HIGH";
          const isDangerMargin = stats.marginHealth === "DANGER";

          return (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-card border border-border/80 shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Header: Title & Status */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                    {p.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.status === "ACTIVE" ? "bg-emerald-500" : "bg-sky-500"
                      }`}
                    />
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Client: <span className="font-medium text-foreground">{p.client?.companyName}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Lead: {p.manager?.name || "Unassigned"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1 font-medium">
                    <CheckSquare className="w-3 h-3 text-muted-foreground" />
                    Task Progress
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {stats.completedTasks} / {stats.totalTasks} ({stats.progressPercentage}%)
                  </span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-500"
                    style={{ width: `${stats.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Real-Time Profitability Box */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-sans flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    Hours Logged
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {stats.totalHoursLogged} hrs
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground text-[11px] font-sans">Labor Cost</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatINR(stats.totalLaborCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-foreground text-[11px] font-sans font-medium">Gross Margin</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-medium text-foreground">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isHighMargin
                          ? "bg-emerald-500"
                          : isDangerMargin
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {stats.marginPercentage}% ({formatINR(stats.grossProfit)})
                  </span>
                </div>
              </div>

              <Link
                href={`/projects/${p.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/50 text-xs font-medium text-foreground transition-colors"
              >
                <span>Open Project 360°</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}

        {projects.length === 0 && !loading && (
          <div className="col-span-3 p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            No projects found. Convert a qualified lead to provision a project.
          </div>
        )}
      </div>
      )}
    </div>
  );
}

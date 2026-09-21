"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  Receipt,
  Layers,
  ChevronRight,
  Kanban,
  FileText,
  Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { formatCompactINR } from "@/lib/utils";
import { MetricCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/skeleton";
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
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/v1/analytics/dashboard")
      .then((res) => {
        setDashboardData(res.data);
      })
      .catch((err) => {
        logger.warn("DATA", "Dashboard fetch skipped or unauthenticated", err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const kpis = dashboardData?.kpis;
  const leadFunnel = dashboardData?.leadFunnel || [];
  const projectProfits = dashboardData?.projectProfits || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Executive Cockpit</span>
            <span>/</span>
            <span className="text-foreground">Real-Time Overview</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Business Operations & Telemetry
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link href="/leads">
            <Button variant="outline" size="sm" className="gap-1.5 border-border/80 hover:border-amber-500/40">
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>New Lead</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button variant="amber" size="sm" className="gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Accounts */}
          <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-sm space-y-2 group">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Active Clients</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis?.activeClients ?? "—"}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Badge variant="success" className="text-[10px] py-0 px-1.5">100% active</Badge>
              <span>Single source of truth</span>
            </div>
          </div>

          {/* Active Projects */}
          <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-sm space-y-2 group">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Open Projects</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis?.openProjects ?? "—"}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Badge variant="amber" className="text-[10px] py-0 px-1.5">Active</Badge>
              <span>In delivery pipeline</span>
            </div>
          </div>

          {/* Cleared Cash Collections */}
          <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-sm space-y-2 group">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Cash Collected</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {kpis ? formatCompactINR(kpis.totalCollected) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Bank settled revenue
            </div>
          </div>

          {/* Outstanding Receivables */}
          <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-amber-500/40 transition-all shadow-2xs hover:shadow-sm space-y-2 group">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Receivables Outstanding</span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis ? formatCompactINR(kpis.totalOutstanding) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              {kpis?.overdueAmount > 0 ? (
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                  {formatCompactINR(kpis.overdueAmount)} overdue
                </Badge>
              ) : (
                <Badge variant="success" className="text-[10px] py-0 px-1.5">0 overdue</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Middle Section: Sales Funnel & Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Funnel */}
        <div className="p-5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pipeline Stages
            </h3>
            <Link
              href="/leads"
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-mono flex items-center gap-1"
            >
              <span>Kanban</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : leadFunnel.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No active leads in pipeline.
              </p>
            ) : (
              leadFunnel.map((stage: any) => {
                const total = kpis?.totalLeads || 1;
                const pct = Math.round((stage.count / total) * 100);
                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">{stage.count} leads</span>
                        <span className="text-foreground font-mono font-semibold">
                          {formatCompactINR(stage.value)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(5, pct)}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Funnel Leads:</span>
            <span className="font-mono font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/60">
              {kpis?.totalLeads ?? 0}
            </span>
          </div>
        </div>

        {/* Project Margin Rankings Table */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Project Gross Margins
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Billed Client Revenue vs Internal Labor Cost Rate
              </p>
            </div>
            <Link
              href="/projects"
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-mono flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Project & Client</TableHead>
                  <TableHead className="text-right">Invoiced</TableHead>
                  <TableHead className="text-right">Labor Cost</TableHead>
                  <TableHead className="text-right">Gross Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectProfits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No active projects with logged billable time.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectProfits.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.client}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground">
                        {formatCompactINR(p.billed)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatCompactINR(p.laborCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={p.margin >= 40 ? "success" : p.margin >= 20 ? "amber" : "destructive"}
                          className="font-mono text-[10px]"
                        >
                          {p.margin}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Bottom Nav Cards: Quick Jump Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/calendar"
          className="p-4 rounded-lg bg-card border border-border hover:border-foreground/40 transition-colors shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Schedule & Deadlines</p>
              <p className="text-[11px] text-muted-foreground">Deliverables & Invoice Due Dates</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>

        <Link
          href="/analytics"
          className="p-4 rounded-lg bg-card border border-border hover:border-foreground/40 transition-colors shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Executive BI Reports</p>
              <p className="text-[11px] text-muted-foreground">6M Cash Flow & AR Aging Matrix</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>

        <Link
          href="/team"
          className="p-4 rounded-lg bg-card border border-border hover:border-foreground/40 transition-colors shadow-2xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Team Roster & Rates</p>
              <p className="text-[11px] text-muted-foreground">Costing & Billable Charge-outs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      </div>
    </div>
  );
}

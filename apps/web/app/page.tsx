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
        console.error("Dashboard error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatINR = (val: number) => {
    if (!val) return "₹0";
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

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
          <Link
            href="/leads"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            <span>New Lead</span>
          </Link>
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground hover:bg-foreground/90 text-background rounded-md text-xs font-medium transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Accounts */}
        <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Active Clients</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {kpis?.activeClients ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% active</span>
            <span>• Single source of truth</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Open Projects</span>
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {kpis?.openProjects ?? "—"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            <span className="text-foreground font-medium">In delivery pipeline</span>
          </div>
        </div>

        {/* Cleared Cash Collections */}
        <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Cash Collected</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {kpis ? formatINR(kpis.totalCollected) : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Bank settled revenue
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Receivables Outstanding</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {kpis ? formatINR(kpis.totalOutstanding) : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            {kpis?.overdueAmount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {formatINR(kpis.overdueAmount)} overdue
              </span>
            ) : (
              <span className="text-emerald-600">0 overdue</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Sales Funnel & Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Funnel */}
        <div className="p-5 rounded-lg bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Pipeline Stages
            </h3>
            <Link
              href="/leads"
              className="text-[11px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
            >
              <span>Kanban</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {leadFunnel.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active leads in pipeline.
              </div>
            ) : (
              leadFunnel.map((stage: any) => {
                const totalLeads = kpis?.totalLeads || 1;
                const pct = Math.round((stage.count / totalLeads) * 100);

                return (
                  <div key={stage.status} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                        {stage.status}
                      </span>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        <span className="text-foreground font-semibold">{stage.count}</span> ({formatINR(stage.value)})
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(5, pct)}%` }}
                        className="h-full bg-foreground rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Funnel Leads:</span>
            <span className="font-mono font-bold text-foreground">{kpis?.totalLeads ?? 0}</span>
          </div>
        </div>

        {/* Project Margin Rankings Table */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-card border border-border shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Active Project Gross Margins
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Billed Client Revenue vs Internal Labor Cost Rate
              </p>
            </div>
            <Link
              href="/projects"
              className="text-[11px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="pb-2 font-normal">Project & Client</th>
                  <th className="pb-2 font-normal text-right">Invoiced</th>
                  <th className="pb-2 font-normal text-right">Labor Cost</th>
                  <th className="pb-2 font-normal text-right">Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projectProfits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No active projects with logged billable time.
                    </td>
                  </tr>
                ) : (
                  projectProfits.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.client}</p>
                      </td>
                      <td className="py-2.5 text-right font-mono text-foreground">
                        {formatINR(p.billed)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {formatINR(p.laborCost)}
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            p.margin >= 40
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : p.margin >= 20
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.margin >= 40
                                ? "bg-emerald-500"
                                : p.margin >= 20
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

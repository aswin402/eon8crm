"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatINR } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CashflowMonth {
  month: string;
  billed: number;
  collected: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

interface AgingBucket {
  label: string;
  total: number;
  count: number;
}

interface AgingData {
  summary: {
    totalOutstanding: number;
    buckets: {
      current: AgingBucket;
      days1to30: AgingBucket;
      days31to60: AgingBucket;
      days60plus: AgingBucket;
    };
  };
  clientBreakdown: Array<{
    client: { id: string; clientNumber: string; companyName: string; email: string };
    current: number;
    days1to30: number;
    days31to60: number;
    days60plus: number;
    totalOutstanding: number;
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      dueDate: string;
      daysOverdue: number;
      total: number;
      paid: number;
      balance: number;
      bucket: string;
    }>;
  }>;
}

interface DashboardKpi {
  activeClients: number;
  openProjects: number;
  totalLeads: number;
  totalOutstanding: number;
  overdueAmount: number;
  totalCollected: number;
  totalBilled: number;
}

interface ProjectProfit {
  id: string;
  name: string;
  client: string;
  billed: number;
  laborCost: number;
  profit: number;
  margin: number;
}

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<DashboardKpi | null>(null);
  const [cashflowTrends, setCashflowTrends] = useState<CashflowMonth[]>([]);
  const [cashflowTotals, setCashflowTotals] = useState<{ billed: number; collected: number; expenses: number; netProfit: number } | null>(null);
  const [agingData, setAgingData] = useState<AgingData | null>(null);
  const [projectProfits, setProjectProfits] = useState<ProjectProfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [dashRes, cashRes, agingRes] = await Promise.all([
        api.get("/api/v1/analytics/dashboard"),
        api.get("/api/v1/analytics/cashflow"),
        api.get("/api/v1/analytics/aging"),
      ]);

      setKpis(dashRes.data.kpis);
      setProjectProfits(dashRes.data.projectProfits || []);
      setCashflowTrends(cashRes.data.trends || []);
      setCashflowTotals(cashRes.data.totals || null);
      setAgingData(agingRes.data);
    } catch (err: any) {
      logger.warn("DATA", "Failed to load analytics data", err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalOutstanding = agingData?.summary.totalOutstanding || 0;
  const currentTotal = agingData?.summary.buckets.current.total || 0;
  const days1to30Total = agingData?.summary.buckets.days1to30.total || 0;
  const days31to60Total = agingData?.summary.buckets.days31to60.total || 0;
  const days60plusTotal = agingData?.summary.buckets.days60plus.total || 0;

  const currentPct = totalOutstanding > 0 ? Math.round((currentTotal / totalOutstanding) * 100) : 0;
  const days1to30Pct = totalOutstanding > 0 ? Math.round((days1to30Total / totalOutstanding) * 100) : 0;
  const days31to60Pct = totalOutstanding > 0 ? Math.round((days31to60Total / totalOutstanding) * 100) : 0;
  const days60plusPct = totalOutstanding > 0 ? Math.round((days60plusTotal / totalOutstanding) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Management</span>
            <span>/</span>
            <span className="text-foreground font-medium">Financial Telemetry</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <span>Executive Business Cockpit</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time cash flow trends, receivables aging matrix, and project gross profit margin telemetry.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 self-start sm:self-auto shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Top 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Invoiced</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {formatINR(kpis?.totalBilled || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Cumulative billed client revenue</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Cleared Cash Inflow</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatINR(kpis?.totalCollected || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Bank account settlements</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Receivables (AR)</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatINR(kpis?.totalOutstanding || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Pending collections</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Overdue Risk Exposure</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatINR(kpis?.overdueAmount || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Past payment maturity</p>
        </div>
      </div>

      {/* 6-Month Cash Flow Trend Table & Metrics */}
      <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-xs font-mono font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              6-Month Cash Flow & Net Margin
            </h2>
          </div>
          {cashflowTotals && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-muted-foreground">
                Total Net Margin:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatINR(cashflowTotals.netProfit)}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">Period</th>
                <th className="py-3 px-4 font-medium text-right">Invoiced (₹)</th>
                <th className="py-3 px-4 font-medium text-right">Cash Inflow (₹)</th>
                <th className="py-3 px-4 font-medium text-right">Expenses (₹)</th>
                <th className="py-3 px-4 font-medium text-right">Net Profit (₹)</th>
                <th className="py-3 px-4 font-medium text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
                    Calculating cash flow telemetry...
                  </td>
                </tr>
              ) : cashflowTrends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                    No historical cash flow data logged yet.
                  </td>
                </tr>
              ) : (
                cashflowTrends.map((row) => (
                  <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground font-sans">{row.month}</td>
                    <td className="py-3 px-4 text-right text-foreground tabular-nums">
                      {formatINR(row.billed)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                      {formatINR(row.collected)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground tabular-nums">
                      {formatINR(row.expenses)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">
                      <span className={row.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {row.netProfit >= 0 ? "+" : ""}{formatINR(row.netProfit)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.margin >= 30
                              ? "bg-emerald-500"
                              : row.margin >= 10
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {row.margin}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounts Receivable (AR) Aging Analysis */}
      <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-mono font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Accounts Receivable (AR) Aging Analysis
            </h2>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-muted-foreground">Total Pending: </span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatINR(totalOutstanding)}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Aging Distribution Visual Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              <div
                style={{ width: `${currentPct}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Current: ${formatINR(currentTotal)} (${currentPct}%)`}
              />
              <div
                style={{ width: `${days1to30Pct}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`1-30 Days: ${formatINR(days1to30Total)} (${days1to30Pct}%)`}
              />
              <div
                style={{ width: `${days31to60Pct}%` }}
                className="bg-orange-500 h-full transition-all"
                title={`31-60 Days: ${formatINR(days31to60Total)} (${days31to60Pct}%)`}
              />
              <div
                style={{ width: `${days60plusPct}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`60+ Days: ${formatINR(days60plusTotal)} (${days60plusPct}%)`}
              />
            </div>

            {/* Bucket Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Current (Not Due)</span>
                </div>
                <p className="font-semibold text-foreground tabular-nums">{formatINR(currentTotal)}</p>
                <p className="text-[10px] text-muted-foreground font-sans">{currentPct}% of total</p>
              </div>

              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>1 - 30 Days</span>
                </div>
                <p className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatINR(days1to30Total)}</p>
                <p className="text-[10px] text-muted-foreground font-sans">{days1to30Pct}% of total</p>
              </div>

              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>31 - 60 Days</span>
                </div>
                <p className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">{formatINR(days31to60Total)}</p>
                <p className="text-[10px] text-muted-foreground font-sans">{days31to60Pct}% of total</p>
              </div>

              <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-muted-foreground font-sans text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>60+ Days (Critical)</span>
                </div>
                <p className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{formatINR(days60plusTotal)}</p>
                <p className="text-[10px] text-muted-foreground font-sans">{days60plusPct}% of total</p>
              </div>
            </div>
          </div>

          {/* Client-wise Aging Breakdown Table */}
          <div className="pt-2 border-t border-border/60">
            <div className="rounded-xl border border-border/80 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 px-4 font-medium">Client Organization</TableHead>
                    <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">Current</TableHead>
                    <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">1-30 Days</TableHead>
                    <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">31-60 Days</TableHead>
                    <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">60+ Days</TableHead>
                    <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">Total Owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingData?.clientBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground font-sans text-xs">
                        No outstanding receivables. All invoices settled.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agingData?.clientBreakdown.map((row) => (
                      <TableRow key={row.client.id} className="group">
                        <TableCell className="py-3 px-4 font-sans">
                          <Link
                            href={`/clients/${row.client.id}`}
                            className="font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1 transition-colors"
                          >
                            <span>{row.client.companyName}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                          </Link>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {row.client.clientNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-muted-foreground font-mono tabular-nums">
                          {formatINR(row.current)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                          {formatINR(row.days1to30)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-orange-600 dark:text-orange-400 font-mono tabular-nums">
                          {formatINR(row.days31to60)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-medium font-mono tabular-nums">
                          {formatINR(row.days60plus)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-foreground font-mono tabular-nums">
                          {formatINR(row.totalOutstanding)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Project Profitability Margins */}
      <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-xs font-mono font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-muted-foreground" />
              Project Gross Margins & Labor Telemetry
            </h2>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Direct Cost Realization
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
              Loading margin profiles...
            </div>
          ) : projectProfits.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No active project financial logs available.
            </div>
          ) : (
            projectProfits.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{p.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-muted-foreground" /> {p.client}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Billed</span>
                    <span className="font-medium text-foreground tabular-nums">{formatINR(p.billed)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Labor Cost</span>
                    <span className="text-muted-foreground tabular-nums">{formatINR(p.laborCost)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block font-sans">Gross Profit</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{formatINR(p.profit)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground block text-right font-sans">Margin</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-mono font-medium text-foreground">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.margin >= 50
                            ? "bg-emerald-500"
                            : p.margin >= 25
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {p.margin}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

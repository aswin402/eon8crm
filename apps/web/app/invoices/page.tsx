"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Sparkles,
  X,
  Loader2,
  Printer,
  Clock,
  TrendingDown,
  ShieldAlert,
  AlertTriangle,
  Send,
  Copy,
  FileText,
  ChevronRight,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  Mail,
  User,
} from "lucide-react";
import api from "@/lib/api";
import {
  InvoicePreviewModal,
  CreateInvoiceModal,
  RecordPaymentModal,
  DunningNoticeModal,
} from "@/components/invoices";
import { toast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import { Invoice, AgingReportResponse } from "@/types/schema";
import { MetricCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // AR Aging & Debtor Cockpit State
  const [activeTab, setActiveTab] = useState<"ledger" | "aging">("ledger");
  const [agingData, setAgingData] = useState<AgingReportResponse | null>(null);
  const [loadingAging, setLoadingAging] = useState(false);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<string | null>(null);
  const [dunningTargetInvoice, setDunningTargetInvoice] = useState<Invoice | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleDownloadExport = async (type: "gstr1" | "tally" | "gstr1-json") => {
    setIsExportOpen(false);
    try {
      const res = await api.get(`/api/v1/invoices/export/${type}`, { responseType: "blob" });
      const mimeType = type === "gstr1-json" ? "application/json" : "text/csv";
      const filename =
        type === "gstr1-json"
          ? `gstr1_b2b_gstn_${new Date().getFullYear()}.json`
          : type === "gstr1"
          ? `gstr1_b2b_${new Date().getFullYear()}.csv`
          : `tally_sales_${new Date().getFullYear()}.csv`;

      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported ${type === "gstr1-json" ? "GSTR-1 JSON (GSTN)" : type.toUpperCase()} successfully.`);
    } catch (err) {
      toast.error("Failed to download export file.");
    }
  };

  const fetchInvoices = () => {
    setLoading(true);
    logger.info("DATA", `Fetching invoices (filter=${statusFilter || "all"})...`);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    api
      .get(`/api/v1/invoices${query}`)
      .then((res) => {
        const list = res.data.invoices || [];
        setInvoices(list);
        logger.info("DATA", `Loaded ${list.length} invoices`);
      })
      .catch((err) => {
        logger.error("DATA", "Invoices fetch error:", err);
        toast.error("Failed to load tax invoices");
      })
      .finally(() => setLoading(false));
  };

  const fetchAgingData = () => {
    setLoadingAging(true);
    logger.info("DATA", "Fetching AR aging & debtors report...");
    api
      .get("/api/v1/invoices/aging")
      .then((res) => {
        setAgingData(res.data);
        logger.info("DATA", "Loaded AR aging report successfully");
      })
      .catch((err) => {
        logger.error("DATA", "Failed to fetch AR aging:", err);
        toast.error("Failed to load AR aging data");
      })
      .finally(() => setLoadingAging(false));
  };

  useEffect(() => {
    fetchInvoices();
    fetchAgingData();
  }, [statusFilter]);

  // KPIs
  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount || 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const overdueCount = invoices.filter(
    (inv) => inv.status !== "PAID" && new Date(inv.dueDate) < new Date()
  ).length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
            <span>Finance</span>
            <span>/</span>
            <span className="text-foreground font-medium">Invoices & Billing</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-muted-foreground" />
            <span>Tax Invoices & GST Ledger</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated billable hour aggregation, CGST/SGST/IGST tax calculation, and collection tracking.
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
              onClick={() => setStatusFilter("PARTIAL")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "PARTIAL" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "PAID" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paid
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export</span>
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-card border border-border/80 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleDownloadExport("gstr1-json")}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-foreground transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-xs flex items-center justify-between">
                    <span>GSTR-1 JSON</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">Direct Upload</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Direct JSON payload for gst.gov.in portal</span>
                </button>
                <div className="h-px bg-border/60 my-0.5" />
                <button
                  onClick={() => handleDownloadExport("gstr1")}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-foreground transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-xs">GSTR-1 (Table 4 B2B CSV)</span>
                  <span className="text-[10px] text-muted-foreground">Official GST Portal offline tool CSV</span>
                </button>
                <div className="h-px bg-border/60 my-0.5" />
                <button
                  onClick={() => handleDownloadExport("tally")}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-foreground transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-xs">Tally / Accounting Ledger</span>
                  <span className="text-[10px] text-muted-foreground">Sales register with CGST/SGST/IGST</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs: Tax Invoices Ledger vs AR Aging & Debtors Cockpit */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px">
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-xs transition-colors cursor-pointer ${
            activeTab === "ledger"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Tax Invoices Ledger</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-mono">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("aging");
            fetchAgingData();
          }}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-xs transition-colors cursor-pointer ${
            activeTab === "aging"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>AR Aging & Debtors Cockpit</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-semibold">
              {overdueCount} Overdue
            </span>
          )}
        </button>
      </div>

      {activeTab === "ledger" && (
        loading ? (
          <div className="space-y-6">
            <MetricCardSkeleton count={4} />
            <TableSkeleton rows={8} columns={9} />
          </div>
        ) : (
        <div className="space-y-6">
          {/* Financial KPIs Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total Invoiced</span>
              <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
                {formatINR(totalInvoiced)}
              </div>
              <p className="text-[11px] text-muted-foreground">{invoices.length} total issued bills</p>
            </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Collected</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatINR(totalCollected)}
          </div>
          <p className="text-[11px] text-muted-foreground">Cleared bank receipts</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Outstanding AR</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatINR(totalOutstanding)}
          </div>
          <p className="text-[11px] text-muted-foreground">Pending settlements</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Overdue Bills</span>
          <div className="text-xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {overdueCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Past payment maturity</p>
        </div>
      </div>

      {/* Invoices High-Density Table */}
      <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">Invoice #</th>
                <th className="py-3 px-4 font-medium">Client & GSTIN</th>
                <th className="py-3 px-4 font-medium">Issue Date</th>
                <th className="py-3 px-4 font-medium">Due Date</th>
                <th className="py-3 px-4 font-medium">Total Amount</th>
                <th className="py-3 px-4 font-medium">Paid</th>
                <th className="py-3 px-4 font-medium">Balance</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.map((inv) => {
                const total = Number(inv.totalAmount);
                const paid = Number(inv.paidAmount);
                const balance = total - paid;
                const isOverdue = inv.status !== "PAID" && new Date(inv.dueDate) < new Date();

                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                      <button
                        onClick={() => setPreviewInvoiceId(inv.id)}
                        className="font-mono font-medium text-foreground hover:underline text-left cursor-pointer flex items-center gap-1 group"
                        title="View & Print Tax Invoice"
                      >
                        <span>{inv.invoiceNumber}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-foreground text-xs">{inv.client?.companyName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {inv.client?.gstin || "Unregistered"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground tabular-nums">
                      {formatINR(total)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                      {formatINR(paid)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      <span className={balance > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                        {formatINR(balance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-medium text-foreground font-mono">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === "PAID"
                              ? "bg-emerald-500"
                              : inv.status === "PARTIAL"
                              ? "bg-amber-500"
                              : isOverdue
                          ? "bg-rose-500"
                              : "bg-sky-500"
                          }`}
                        />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewInvoiceId(inv.id)}
                          className="p-1.5 rounded-md border border-border/80 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="View & Print Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {balance > 0 && isOverdue && (
                          <button
                            onClick={() => setDunningTargetInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2 py-1 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs"
                            title="Dispatch Formal Dunning Notice"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Dunning</span>
                          </button>
                        )}

                        {balance > 0 ? (
                          <button
                            onClick={() => setPaymentTargetInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border/80 bg-background hover:bg-muted text-foreground text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <CreditCard className="w-3 h-3 text-muted-foreground" />
                            <span>Record Pay</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono px-2 py-1">Settled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-xs">
                    No invoices found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
)}

      {/* AR Aging & Debtors Cockpit Tab View */}
      {activeTab === "aging" && (
        loadingAging ? (
          <div className="space-y-6">
            <MetricCardSkeleton count={4} />
            <TableSkeleton rows={6} columns={8} />
          </div>
        ) : (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Aging Performance & DSO Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Days Sales Outstanding
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    (agingData?.summary?.dso || 0) <= 30
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : (agingData?.summary?.dso || 0) <= 60
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {(agingData?.summary?.dso || 0) <= 30
                    ? "Optimal (<30d)"
                    : (agingData?.summary?.dso || 0) <= 60
                    ? "Standard (30-60d)"
                    : "Delinquent (>60d)"}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {agingData?.summary?.dso || 0} <span className="text-xs font-normal text-muted-foreground">Days DSO</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Average receivable realization cycle</p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Total Outstanding Receivables
              </span>
              <div className="text-2xl font-bold font-mono text-foreground tabular-nums">
                {formatINR(agingData?.summary?.totalOutstanding || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {agingData?.summary?.totalUnpaidInvoices || 0} active unpaid bills across all clients
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Total Delinquent / Overdue
              </span>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {formatINR(agingData?.summary?.totalOverdue || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">Matured past agreed payment credit terms</p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Critical Debtors (90+ Days)
              </span>
              <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 tabular-nums">
                {formatINR(agingData?.summary?.buckets?.overdue90Plus?.amount || 0)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {agingData?.summary?.buckets?.overdue90Plus?.count || 0} bills in legal recovery threshold
              </p>
            </div>
          </div>

          {/* 5 Interactive Aging Bucket Cards Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground font-mono uppercase tracking-wider text-[11px]">
                Aging Intervals & Buckets (Click to Filter View)
              </span>
              {selectedAgingBucket && (
                <button
                  onClick={() => setSelectedAgingBucket(null)}
                  className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
                >
                  Clear Filter (Show All)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {/* Bucket: Current */}
              <button
                onClick={() => setSelectedAgingBucket(selectedAgingBucket === "CURRENT" ? null : "CURRENT")}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedAgingBucket === "CURRENT"
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-border/80 bg-card/50 hover:bg-card"
                }`}
              >
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                  Current (0 - 30d)
                </div>
                <div className="text-base font-bold font-mono text-foreground mt-1 tabular-nums">
                  {formatINR(agingData?.summary?.buckets?.current?.amount || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agingData?.summary?.buckets?.current?.count || 0} invoices
                </div>
              </button>

              {/* Bucket: 1-30 Days Overdue */}
              <button
                onClick={() => setSelectedAgingBucket(selectedAgingBucket === "1-30" ? null : "1-30")}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedAgingBucket === "1-30"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                    : "border-border/80 bg-card/50 hover:bg-card"
                }`}
              >
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase">
                  1 - 30 Days Late
                </div>
                <div className="text-base font-bold font-mono text-foreground mt-1 tabular-nums">
                  {formatINR(agingData?.summary?.buckets?.overdue1to30?.amount || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agingData?.summary?.buckets?.overdue1to30?.count || 0} invoices
                </div>
              </button>

              {/* Bucket: 31-60 Days Overdue */}
              <button
                onClick={() => setSelectedAgingBucket(selectedAgingBucket === "31-60" ? null : "31-60")}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedAgingBucket === "31-60"
                    ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500"
                    : "border-border/80 bg-card/50 hover:bg-card"
                }`}
              >
                <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-semibold uppercase">
                  31 - 60 Days Late
                </div>
                <div className="text-base font-bold font-mono text-foreground mt-1 tabular-nums">
                  {formatINR(agingData?.summary?.buckets?.overdue31to60?.amount || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agingData?.summary?.buckets?.overdue31to60?.count || 0} invoices
                </div>
              </button>

              {/* Bucket: 61-90 Days Overdue */}
              <button
                onClick={() => setSelectedAgingBucket(selectedAgingBucket === "61-90" ? null : "61-90")}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedAgingBucket === "61-90"
                    ? "border-rose-500 bg-rose-500/10 ring-1 ring-rose-500"
                    : "border-border/80 bg-card/50 hover:bg-card"
                }`}
              >
                <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold uppercase">
                  61 - 90 Days Late
                </div>
                <div className="text-base font-bold font-mono text-foreground mt-1 tabular-nums">
                  {formatINR(agingData?.summary?.buckets?.overdue61to90?.amount || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agingData?.summary?.buckets?.overdue61to90?.count || 0} invoices
                </div>
              </button>

              {/* Bucket: 90+ Days Overdue */}
              <button
                onClick={() => setSelectedAgingBucket(selectedAgingBucket === "90+" ? null : "90+")}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedAgingBucket === "90+"
                    ? "border-rose-700 bg-rose-700/10 ring-1 ring-rose-700"
                    : "border-border/80 bg-card/50 hover:bg-card"
                }`}
              >
                <div className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-semibold uppercase">
                  90+ Days Delinquent
                </div>
                <div className="text-base font-bold font-mono text-foreground mt-1 tabular-nums">
                  {formatINR(agingData?.summary?.buckets?.overdue90Plus?.amount || 0)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {agingData?.summary?.buckets?.overdue90Plus?.count || 0} invoices
                </div>
              </button>
            </div>
          </div>

          {/* Debtor Concentration Ledger Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Debtor Client Exposure & Concentration Matrix
            </h3>

            <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-medium">Debtor Client</th>
                      <th className="py-3 px-3 font-medium text-center">Unpaid Bills</th>
                      <th className="py-3 px-3 font-medium text-right">Current</th>
                      <th className="py-3 px-3 font-medium text-right">1-30d</th>
                      <th className="py-3 px-3 font-medium text-right">31-60d</th>
                      <th className="py-3 px-3 font-medium text-right">61-90d</th>
                      <th className="py-3 px-3 font-medium text-right">90+d</th>
                      <th className="py-3 px-4 font-medium text-right">Total Outstanding</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {agingData?.debtors?.map((debtor: any) => (
                      <tr key={debtor.client.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground text-xs">
                            {debtor.client.companyName}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {debtor.client.contactPerson} • {debtor.client.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full bg-muted font-medium text-[11px]">
                            {debtor.invoicesCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-muted-foreground">
                          {formatINR(debtor.current)}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono tabular-nums ${
                            debtor.overdue1to30 > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {formatINR(debtor.overdue1to30)}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono tabular-nums ${
                            debtor.overdue31to60 > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {formatINR(debtor.overdue31to60)}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono tabular-nums ${
                            debtor.overdue61to90 > 0 ? "text-rose-600 font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {formatINR(debtor.overdue61to90)}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono tabular-nums ${
                            debtor.overdue90Plus > 0 ? "text-rose-700 font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {formatINR(debtor.overdue90Plus)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground tabular-nums">
                          {formatINR(debtor.totalOutstanding)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {debtor.totalOverdue > 0 ? (
                            <button
                              onClick={() => {
                                const oldestOverdueInv = debtor.invoices.find((i: any) => i.daysOverdue > 0);
                                if (oldestOverdueInv) {
                                  setDunningTargetInvoice({
                                    ...oldestOverdueInv,
                                    client: debtor.client,
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium text-xs transition-colors cursor-pointer"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Issue Dunning</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                              Current
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {(!agingData?.debtors || agingData.debtors.length === 0) && !loadingAging && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-muted-foreground text-xs">
                          No outstanding receivables found. All client accounts are settled!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    )}

      {/* Tax Invoice Preview & Print Modal */}
      {previewInvoiceId && (
        <InvoicePreviewModal
          invoiceId={previewInvoiceId}
          onClose={() => setPreviewInvoiceId(null)}
          onRecordPayment={() => {
            const inv = invoices.find((i) => i.id === previewInvoiceId);
            setPreviewInvoiceId(null);
            if (inv) setPaymentTargetInvoice(inv);
          }}
        />
      )}

      {/* Dunning Notice Generation Modal */}
      {dunningTargetInvoice && (
        <DunningNoticeModal
          invoice={dunningTargetInvoice}
          onClose={() => setDunningTargetInvoice(null)}
          onSuccess={() => {
            setDunningTargetInvoice(null);
            fetchInvoices();
            fetchAgingData();
          }}
        />
      )}

      {/* Payment Recording Modal */}
      {paymentTargetInvoice && (
        <RecordPaymentModal
          invoice={paymentTargetInvoice}
          onClose={() => setPaymentTargetInvoice(null)}
          onSuccess={() => {
            setPaymentTargetInvoice(null);
            fetchInvoices();
          }}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

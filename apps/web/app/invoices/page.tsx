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
import { InvoicePreviewModal } from "@/components/invoices/InvoicePreviewModal";
import { toast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // AR Aging & Debtor Cockpit State
  const [activeTab, setActiveTab] = useState<"ledger" | "aging">("ledger");
  const [agingData, setAgingData] = useState<any | null>(null);
  const [loadingAging, setLoadingAging] = useState(false);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<string | null>(null);
  const [dunningTargetInvoice, setDunningTargetInvoice] = useState<any | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
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
    const query = statusFilter ? `?status=${statusFilter}` : "";
    api
      .get(`/api/v1/invoices${query}`)
      .then((res) => {
        setInvoices(res.data.invoices || []);
      })
      .catch((err) => console.error("Invoices error:", err))
      .finally(() => setLoading(false));
  };

  const fetchAgingData = () => {
    setLoadingAging(true);
    api
      .get("/api/v1/invoices/aging")
      .then((res) => {
        setAgingData(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch AR aging:", err);
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
                      {new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={isOverdue ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                        {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
  )}

      {/* AR Aging & Debtors Cockpit Tab View */}
      {activeTab === "aging" && (
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

// Sub-component: Record Payment Modal (with Statutory TDS Withholding)
function RecordPaymentModal({ invoice, onClose, onSuccess }: any) {
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const [hasTds, setHasTds] = useState(false);
  const [tdsSection, setTdsSection] = useState("194J");
  const [tdsAmount, setTdsAmount] = useState<number>(0);
  const [amount, setAmount] = useState<number>(remaining);
  const [paymentMethod, setPaymentMethod] = useState("NEFT / Bank Transfer");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick helper to auto-calculate TDS based on standard section percentages of subTotal
  const handleAutoCalcTds = (section: string) => {
    setTdsSection(section);
    const baseAmount = Number(invoice.subTotal || invoice.totalAmount / 1.18);
    let rate = 0.10;
    if (section === "194C") rate = 0.02;
    if (section === "194H") rate = 0.05;
    const calculatedTds = Math.round(baseAmount * rate);
    setTdsAmount(calculatedTds);
    if (remaining >= calculatedTds) {
      setAmount(remaining - calculatedTds);
    }
  };

  const totalCleared = Number(amount || 0) + (hasTds ? Number(tdsAmount || 0) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/v1/invoices/${invoice.id}/payments`, {
        amount: Number(amount),
        tdsAmount: hasTds ? Number(tdsAmount) : 0,
        tdsSection: hasTds ? tdsSection : undefined,
        paymentMethod,
        referenceId: referenceId || undefined,
        notes: notes || undefined,
      });
      onSuccess();
      toast.success("Payment & statutory settlement recorded successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Record Payment Receipt</h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              Invoice #{invoice.invoiceNumber} • {invoice.client?.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="p-3 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-between font-mono">
            <span className="text-[11px] font-sans text-muted-foreground">Pending Balance</span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatINR(remaining)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Net Bank Remittance Received (₹) *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          {/* Indian TDS Withholding Section */}
          <div className="p-3 bg-muted/20 border border-border/80 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTds}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasTds(checked);
                    if (checked && tdsAmount === 0) {
                      handleAutoCalcTds("194J");
                    }
                  }}
                  className="rounded border-border"
                />
                <span>Client Withheld Statutory TDS (Income Tax)</span>
              </label>
            </div>

            {hasTds && (
              <div className="space-y-2 pt-1.5 border-t border-border/60">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Section</label>
                    <select
                      value={tdsSection}
                      onChange={(e) => handleAutoCalcTds(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md text-xs"
                    >
                      <option value="194J">194J (10% Tech/Prof)</option>
                      <option value="194C">194C (2% Contractor)</option>
                      <option value="194H">194H (5% Commission)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">TDS Deducted (₹)</label>
                    <input
                      type="number"
                      value={tdsAmount}
                      onChange={(e) => setTdsAmount(Number(e.target.value))}
                      min={0}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground bg-background p-2 rounded border border-border/60">
                  <span>Total Cleared:</span>
                  <span className="font-semibold text-foreground">{formatINR(totalCleared)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Payment Mode</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            >
              <option value="NEFT / Bank Transfer">NEFT / RTGS Bank Transfer</option>
              <option value="UPI">UPI (GPay / PhonePe / QR)</option>
              <option value="Payment Gateway">Payment Gateway (Razorpay / Stripe)</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="Cash">Cash Receipt</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Bank UTR / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. HDFC202609160012"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border/80 bg-background hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? "Recording..." : "Confirm Settlement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component: Create Invoice Modal
function CreateInvoiceModal({ onClose, onSuccess }: any) {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [isInterstate, setIsInterstate] = useState(false);
  const [items, setItems] = useState<any[]>([
    { description: "Professional Consulting & Development", sacCode: "998314", quantity: 1, unitPrice: 50000, taxRate: 18 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/clients").then((res) => {
      if (res.data.clients?.length > 0) {
        setClients(res.data.clients);
        setClientId(res.data.clients[0].id);
      }
    });
    api.get("/api/v1/projects").then((res) => {
      if (res.data.projects?.length > 0) {
        setProjects(res.data.projects);
        setProjectId(res.data.projects[0].id);
      }
    });
  }, []);

  const [pulledTimeEntryIds, setPulledTimeEntryIds] = useState<string[]>([]);
  const [pulledMilestoneIds, setPulledMilestoneIds] = useState<string[]>([]);

  const handlePullUnbilled = async () => {
    if (!projectId) return;
    try {
      const res = await api.post("/api/v1/invoices/pull-unbilled", { projectId });
      if (res.data.items?.length > 0) {
        setItems(res.data.items);
        setPulledTimeEntryIds(res.data.timeEntryIds || []);
        setPulledMilestoneIds(res.data.milestoneIds || []);
        toast.success(
          `Aggregated ${res.data.items.length} unbilled items (${res.data.timeEntryCount || 0} timesheets, ${res.data.milestoneCount || 0} milestones).`
        );
      } else {
        toast.info("No unbilled approved hours or milestones found for this project.");
      }
    } catch (err: any) {
      toast.error("Failed to pull unbilled items");
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "Software Implementation Services", sacCode: "998314", quantity: 1, unitPrice: 15000, taxRate: 18 },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const taxAmount = subTotal * 0.18;
  const grandTotal = subTotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/invoices", {
        clientId,
        projectId: projectId || undefined,
        dueDate,
        isInterstate,
        items,
        timeEntryIds: pulledTimeEntryIds.length > 0 ? pulledTimeEntryIds : undefined,
        milestoneIds: pulledMilestoneIds.length > 0 ? pulledMilestoneIds : undefined,
      });
      onSuccess();
      toast.success("GST Tax Invoice generated & billable hours cleared successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Create GST Tax Invoice</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Itemized billing compliant with Indian GST (SAC codes & tax schedules)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.gstin ? `(${c.gstin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              >
                <option value="">None / Retainer billing</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="interstate"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="interstate" className="font-medium text-foreground text-xs cursor-pointer">
                Inter-State (18% IGST instead of 9% CGST + 9% SGST)
              </label>
            </div>
          </div>

          {/* Pull Unbilled Hours Banner */}
          {projectId && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-xs">Pull Approved Billable Hours</p>
                <p className="text-[10px] text-muted-foreground">
                  Aggregates unbilled time entries logged against this project
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullUnbilled}
                className="flex items-center gap-1 px-2.5 py-1 bg-background hover:bg-muted text-foreground border border-border/80 text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-muted-foreground" />
                <span>Pull Hours</span>
              </button>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Line Items ({items.length})</label>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 border border-border/80 rounded-lg bg-card/50 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].description = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantity = Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].unitPrice = Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span className="font-sans">Subtotal (Pre-tax)</span>
              <span className="tabular-nums">{formatINR(subTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="font-sans">
                {isInterstate ? "IGST (18%)" : "CGST (9%) + SGST (9%)"}
              </span>
              <span className="tabular-nums">{formatINR(taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-border/80 font-medium text-foreground text-sm">
              <span className="font-sans">Total Tax Invoice Value</span>
              <span className="tabular-nums font-semibold">{formatINR(grandTotal)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border/80 bg-background hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: Multi-tier Dunning Notice Modal (ERPNext Engine)
// -------------------------------------------------------------
function DunningNoticeModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount || 0);
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffMs = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const [level, setLevel] = useState<"AUTO" | "LEVEL_1" | "LEVEL_2" | "LEVEL_3">("AUTO");
  const [includeInterest, setIncludeInterest] = useState(true);
  const [interestRate, setInterestRate] = useState(18);
  const [customRemarks, setCustomRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedNotice, setGeneratedNotice] = useState<any | null>(null);

  // Calculate live preview interest
  const effectiveLevel =
    level === "AUTO"
      ? daysOverdue <= 15
        ? "LEVEL_1"
        : daysOverdue <= 45
        ? "LEVEL_2"
        : "LEVEL_3"
      : level;

  const estimatedInterest =
    includeInterest && daysOverdue > 0 && effectiveLevel !== "LEVEL_1"
      ? Math.round(remaining * (interestRate / 100 / 365) * daysOverdue)
      : 0;

  const totalPayable = remaining + estimatedInterest;

  const handleDispatchDunning = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/invoices/${invoice.id}/dunning`, {
        level,
        includeInterest,
        interestRatePerAnnum: Number(interestRate),
        customRemarks: customRemarks.trim() || undefined,
      });

      setGeneratedNotice(res.data.notice);
      toast.success(`Dunning Notice ${res.data.notice.noticeReference} recorded and dispatched!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to dispatch dunning notice");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNotice = () => {
    if (!generatedNotice) return;
    const text = `
FORMAL PAYMENT DUNNING NOTICE [${generatedNotice.noticeReference}]
${generatedNotice.title.toUpperCase()}
Date: ${new Date(generatedNotice.generatedAt).toLocaleDateString("en-IN")}

Recipient: ${generatedNotice.clientName} (Attn: ${generatedNotice.contactPerson || "Finance Department"})
Tax Invoice Reference: #${generatedNotice.invoiceNumber}
Overdue Duration: ${generatedNotice.daysOverdue} Days past due

Principal Outstanding Balance: ₹${generatedNotice.principalBalance.toLocaleString("en-IN")}
Statutory Delayed Payment Interest (@ ${interestRate}% p.a.): ₹${generatedNotice.interestAmount.toLocaleString("en-IN")}
TOTAL SUM DUE & PAYABLE: ₹${generatedNotice.totalPayable.toLocaleString("en-IN")}

NOTICE:
${generatedNotice.letterBody}

${generatedNotice.customRemarks ? `Additional Remarks: ${generatedNotice.customRemarks}\n` : ""}
REMITTANCE ACCOUNT DETAILS:
Beneficiary: ${generatedNotice.bankDetails.beneficiary}
Bank: ${generatedNotice.bankDetails.bankName}
A/C No: ${generatedNotice.bankDetails.accountNumber}
IFSC: ${generatedNotice.bankDetails.ifscCode}
UPI ID: ${generatedNotice.bankDetails.upiId}

Issued by Finance & Accounts Division, Celestialabs Technologies Private Limited.
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success("Formal Dunning Notice copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <div>
              <h3 className="font-semibold text-xs text-foreground">
                Payment Dunning & Collections Engine
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                Invoice #{invoice.invoiceNumber} • {invoice.client?.companyName || "Client Organization"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Overdue Status Banner */}
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-rose-600 dark:text-rose-400 font-semibold">
                Delinquency Status
              </span>
              <div className="font-semibold text-foreground text-sm font-mono">
                {daysOverdue} Days Overdue
              </div>
            </div>
            <div className="text-right space-y-0.5 font-mono">
              <span className="text-[10px] text-muted-foreground">Unpaid Balance</span>
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatINR(remaining)}
              </div>
            </div>
          </div>

          {!generatedNotice ? (
            <form onSubmit={handleDispatchDunning} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Escalation Severity Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setLevel("AUTO")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      level === "AUTO"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[11px] text-foreground">Auto-Pick</div>
                    <div className="text-[9px] text-muted-foreground font-mono">System Rec</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("LEVEL_1")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      level === "LEVEL_1"
                        ? "border-blue-500 bg-blue-500/10 font-semibold text-blue-600"
                        : "border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[11px]">Level 1</div>
                    <div className="text-[9px] text-muted-foreground font-mono">Reminder</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("LEVEL_2")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      level === "LEVEL_2"
                        ? "border-amber-500 bg-amber-500/10 font-semibold text-amber-600"
                        : "border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[11px]">Level 2</div>
                    <div className="text-[9px] text-muted-foreground font-mono">Past-Due</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel("LEVEL_3")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      level === "LEVEL_3"
                        ? "border-rose-600 bg-rose-600/10 font-semibold text-rose-600"
                        : "border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[11px]">Level 3</div>
                    <div className="text-[9px] text-muted-foreground font-mono">Final Demand</div>
                  </button>
                </div>
              </div>

              {/* Statutory Interest Configuration (Section 16 MSME Act) */}
              <div className="p-3 bg-muted/30 border border-border/80 rounded-lg space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInterest}
                    onChange={(e) => setIncludeInterest(e.target.checked)}
                    className="mt-0.5 rounded border-border"
                  />
                  <div>
                    <span className="font-medium text-foreground">
                      Accrue Statutory Interest under MSMED Act 2006 (Sec 16)
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Statutory interest calculated compound monthly at 3x RBI benchmark (~18% p.a.) on receivables past maturity.
                    </p>
                  </div>
                </label>

                {includeInterest && effectiveLevel !== "LEVEL_1" && (
                  <div className="pl-6 pt-1 flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Annual Rate:</span>
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 bg-background border border-border/80 rounded text-xs text-right font-mono"
                      />
                      <span>%</span>
                    </div>

                    <div className="text-muted-foreground">
                      Accrued Interest: <strong className="text-rose-600 dark:text-rose-400">{formatINR(estimatedInterest)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Summary Waterfall */}
              <div className="p-3 bg-card border border-border/80 rounded-lg font-mono text-xs space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Principal Invoice Due:</span>
                  <span className="text-foreground tabular-nums">{formatINR(remaining)}</span>
                </div>
                {estimatedInterest > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Statutory Interest Claim:</span>
                    <span className="tabular-nums">+{formatINR(estimatedInterest)}</span>
                  </div>
                )}
                <div className="h-px bg-border/60 my-1" />
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total Dunning Claim:</span>
                  <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatINR(totalPayable)}
                  </span>
                </div>
              </div>

              {/* Custom Remarks */}
              <div className="space-y-1">
                <label className="font-medium text-foreground">
                  Specific Remarks / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  placeholder="e.g. As discussed over call, delivery milestones remain paused until remittance."
                  className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded text-xs"
                />
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-md border border-border/80 text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{loading ? "Generating..." : "Generate & Dispatch Notice"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Generated Dunning Letter View */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notice logged to client activity feed and recorded in audit log.</span>
              </div>

              <div className="p-4 bg-muted/20 border border-border/80 rounded-lg font-mono text-xs space-y-2.5 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <span className="font-bold text-foreground">{generatedNotice.noticeReference}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(generatedNotice.generatedAt).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="text-foreground font-semibold">
                  {generatedNotice.title}
                </div>

                <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-[11px]">
                  {generatedNotice.letterBody}
                </p>

                <div className="pt-2 border-t border-border/80 flex justify-between text-[11px] font-bold">
                  <span>Total Amount Claimed:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatINR(generatedNotice.totalPayable)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyNotice}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/80 text-foreground bg-background hover:bg-muted text-xs font-medium cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border/80 text-foreground bg-background hover:bg-muted text-xs font-medium cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


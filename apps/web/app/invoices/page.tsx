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
} from "lucide-react";
import api from "@/lib/api";
import { InvoicePreviewModal } from "@/components/invoices/InvoicePreviewModal";
import { toast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleDownloadExport = async (type: "gstr1" | "tally") => {
    setIsExportOpen(false);
    try {
      const res = await api.get(`/api/v1/invoices/export/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "gstr1"
          ? `gstr1_b2b_${new Date().getFullYear()}.csv`
          : `tally_sales_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported ${type.toUpperCase()} successfully.`);
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

  useEffect(() => {
    fetchInvoices();
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
              <div className="absolute right-0 mt-1.5 w-56 bg-card border border-border/80 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => handleDownloadExport("gstr1")}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 text-foreground transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-xs">GSTR-1 (Table 4 B2B)</span>
                  <span className="text-[10px] text-muted-foreground">Official GST Portal CSV format</span>
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

// Sub-component: Record Payment Modal
function RecordPaymentModal({ invoice, onClose, onSuccess }: any) {
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const [amount, setAmount] = useState<number>(remaining);
  const [paymentMethod, setPaymentMethod] = useState("NEFT / Bank Transfer");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/v1/invoices/${invoice.id}/payments`, {
        amount: Number(amount),
        paymentMethod,
        referenceId: referenceId || undefined,
      });
      onSuccess();
      toast.success("Payment recorded successfully");
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
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-between font-mono">
            <span className="text-[11px] font-sans text-muted-foreground">Pending Balance</span>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatINR(remaining)}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Amount to Clear (₹) *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={remaining}
              min={1}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
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

  const handlePullUnbilled = async () => {
    if (!projectId) return;
    try {
      const res = await api.post("/api/v1/invoices/pull-unbilled", { projectId });
      if (res.data.items?.length > 0) {
        setItems(res.data.items);
        toast.success(`Loaded ${res.data.items.length} unbilled line items.`);
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
      });
      onSuccess();
      toast.success("GST Tax Invoice generated successfully");
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

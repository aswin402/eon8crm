"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  X,
  Printer,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  Trash2,
  FileText,
  Copy,
  Globe,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

interface QuotationItem {
  description: string;
  sacCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  shareToken?: string;
  clientId: string | null;
  leadId: string | null;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  issueDate: string;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  isInterstate: boolean;
  notes: string | null;
  terms: string | null;
  items: QuotationItem[];
  convertedProjectId: string | null;
  convertedInvoiceId: string | null;
  createdAt: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [stats, setStats] = useState({
    totalValue: 0,
    acceptedValue: 0,
    pendingCount: 0,
    acceptedCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [convertTargetQuotation, setConvertTargetQuotation] = useState<Quotation | null>(null);

  const fetchQuotations = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (searchQuery) params.append("search", searchQuery);

    api
      .get(`/api/v1/quotations?${params.toString()}`)
      .then((res) => {
        setQuotations(res.data.quotations || []);
        if (res.data.stats) setStats(res.data.stats);
      })
      .catch((err) => {
        console.error("Failed to fetch quotations:", err);
        toast.error("Failed to load quotations");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotations();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/api/v1/quotations/${id}`, { status: newStatus });
      toast.success(`Quotation marked as ${newStatus}`);
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update quotation");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await api.delete(`/api/v1/quotations/${id}`);
      toast.success("Quotation deleted");
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete quotation");
    }
  };

  const conversionRate =
    stats.totalCount > 0 ? Math.round((stats.acceptedCount / stats.totalCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-muted-foreground" />
            <span>Quotations & Cost Estimates</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ERPNext-inspired proposal lifecycle: Draft estimates, GST tax calculations, client approval tracking, and 1-click project conversion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Total Quoted Pipeline
          </span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {formatINR(stats.totalValue)}
          </div>
          <p className="text-[11px] text-muted-foreground">{stats.totalCount} formal estimates issued</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Accepted Revenue
          </span>
          <div className="text-xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatINR(stats.acceptedValue)}
          </div>
          <p className="text-[11px] text-muted-foreground">{stats.acceptedCount} deals won</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Pending Decision
          </span>
          <div className="text-xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Drafts & awaiting client sign-off</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            Proposal Win Rate
          </span>
          <div className="text-xl font-semibold font-mono tabular-nums text-foreground">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-muted-foreground">Quotations successfully closed</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by quote #, client, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/60"
          />
        </form>

        <div className="flex items-center bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs self-start sm:self-auto">
          {["", "DRAFT", "SENT", "ACCEPTED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="rounded-xl border border-border/80 bg-card/40 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">
            Loading proposals & estimates...
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ScrollText className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">No Quotations Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Issue your first formal commercial proposal with GST line items and 1-click project conversion.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-md hover:bg-foreground/90 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Quotation</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-mono text-[11px]">
                  <th className="py-3 px-4 font-medium">QUOTE #</th>
                  <th className="py-3 px-4 font-medium">CLIENT / PROSPECT</th>
                  <th className="py-3 px-4 font-medium">DATE / VALIDITY</th>
                  <th className="py-3 px-4 font-medium text-right">SUBTOTAL</th>
                  <th className="py-3 px-4 font-medium text-right">GST (18%)</th>
                  <th className="py-3 px-4 font-medium text-right">TOTAL AMOUNT</th>
                  <th className="py-3 px-4 font-medium text-center">STATUS</th>
                  <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {quotations.map((q) => {
                  const isExpired = new Date(q.validUntil) < new Date() && q.status !== "ACCEPTED";
                  const taxAmount = q.isInterstate ? q.igstAmount : q.cgstAmount + q.sgstAmount;

                  return (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-foreground">{q.quotationNumber}</span>
                        {q.convertedProjectId && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Converted to Project</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{q.companyName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {q.contactPerson} • {q.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-foreground">{formatDate(q.issueDate)}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>Valid: {formatDate(q.validUntil)}</span>
                          {isExpired && (
                            <span className="text-amber-500 font-medium">(Expired)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                        {formatINR(q.subTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                        {formatINR(taxAmount)}
                        <span className="text-[10px] ml-1 text-muted-foreground/70">
                          {q.isInterstate ? "IGST" : "GST"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-foreground">
                        {formatINR(q.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                            q.status === "ACCEPTED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : q.status === "SENT"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : q.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewQuotation(q)}
                            title="Preview Proposal"
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Public Client Proposal Portal Link */}
                          <button
                            onClick={() => {
                              const token = q.shareToken || q.id;
                              const url = `${window.location.origin}/p/quote/${token}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Client portal link copied to clipboard!");
                            }}
                            title="Copy Public Client Proposal Link"
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Convert to Project & Invoice button */}
                          {!q.convertedProjectId && (
                            <button
                              onClick={() => setConvertTargetQuotation(q)}
                              title="1-Click Convert to Project & Invoice"
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}

                          {/* Quick Status Menu */}
                          {q.status === "DRAFT" && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "SENT")}
                              title="Mark as Sent"
                              className="p-1 rounded text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {q.status !== "ACCEPTED" && (
                            <button
                              onClick={() => handleDelete(q.id)}
                              title="Delete"
                              className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateQuotationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchQuotations();
          }}
        />
      )}

      {previewQuotation && (
        <QuotationPreviewModal
          quotation={previewQuotation}
          onClose={() => setPreviewQuotation(null)}
        />
      )}

      {convertTargetQuotation && (
        <ConvertQuotationModal
          quotation={convertTargetQuotation}
          onClose={() => setConvertTargetQuotation(null)}
          onSuccess={() => {
            setConvertTargetQuotation(null);
            fetchQuotations();
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: Create Quotation Modal
// -------------------------------------------------------------
function CreateQuotationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [isInterstate, setIsInterstate] = useState(false);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "1. Proposal Validity: 30 days from date of estimate.\n2. Payment terms: 50% milestone advance, 50% on final handover.\n3. Taxes: GST @ 18% billed under Section 31 CGST Act."
  );

  const [items, setItems] = useState<QuotationItem[]>([
    {
      description: "Custom Enterprise Cloud Architecture & Engineering",
      sacCode: "998314",
      quantity: 1,
      unitPrice: 85000,
      taxRate: 18,
      amount: 85000,
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/clients").then((res) => {
      setClients(res.data.clients || []);
    });
  }, []);

  const handleClientSelect = (cId: string) => {
    setSelectedClientId(cId);
    if (!cId) return;
    const client = clients.find((c) => c.id === cId);
    if (client) {
      setCompanyName(client.companyName);
      setContactPerson(client.contactPerson);
      setEmail(client.email);
      setPhone(client.phone || "");
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "DevOps & Infrastructure Deployment Services",
        sacCode: "998314",
        quantity: 1,
        unitPrice: 35000,
        taxRate: 18,
        amount: 35000,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof QuotationItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], [field]: val };
      item.amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      copy[idx] = item;
      return copy;
    });
  };

  const subTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = subTotal * 0.18;
  const grandTotal = subTotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/quotations", {
        clientId: selectedClientId || undefined,
        companyName,
        contactPerson,
        email,
        phone: phone || undefined,
        validDays: Number(validDays),
        isInterstate,
        notes: notes || undefined,
        terms: terms || undefined,
        items,
      });
      toast.success("Quotation generated successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create quotation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Draft Proposal & Cost Estimate</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Indian GST compliant line items, SAC codes, and milestone-ready terms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Select Existing Client (Optional)</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              >
                <option value="">-- Or enter new prospect details below --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.gstin ? `(${c.gstin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Technologies India Pvt Ltd"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Contact Person *</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance@acme.com"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Validity (Days)</label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="qtn_interstate"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="qtn_interstate" className="font-medium text-foreground text-xs cursor-pointer">
                Inter-State (18% IGST instead of 9% CGST + 9% SGST)
              </label>
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-xs uppercase font-mono tracking-wider">
                Scope & Commercial Deliverables
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-3 bg-muted/20 border border-border/80 rounded-lg items-center"
                >
                  <div className="col-span-5 space-y-1">
                    <label className="text-[10px] text-muted-foreground font-mono">DESCRIPTION</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded text-xs"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-muted-foreground font-mono">SAC CODE</label>
                    <input
                      type="text"
                      value={item.sacCode}
                      onChange={(e) => updateItem(idx, "sacCode", e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border/80 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] text-muted-foreground font-mono">QTY</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                      min={0.1}
                      step={0.1}
                      className="w-full px-2 py-1.5 bg-background border border-border/80 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-muted-foreground font-mono">RATE (₹)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      min={0}
                      className="w-full px-2 py-1.5 bg-background border border-border/80 rounded font-mono text-xs"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between pt-4">
                    <span className="font-mono font-medium text-foreground tabular-nums text-right">
                      {formatINR(item.amount)}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals Box */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/30 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="text-foreground">{formatINR(subTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (18% {isInterstate ? "IGST" : "CGST 9% + SGST 9%"}):</span>
              <span className="text-foreground">{formatINR(taxAmount)}</span>
            </div>
            <div className="h-px bg-border/60 my-1" />
            <div className="flex justify-between text-sm font-semibold text-foreground">
              <span>Total Estimated Value:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Commercial Terms & Conditions</label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs font-mono"
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
              {loading ? "Generating..." : "Generate Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: 1-Click Convert Modal (ERPNext-inspired)
// -------------------------------------------------------------
function ConvertQuotationModal({
  quotation,
  onClose,
  onSuccess,
}: {
  quotation: Quotation;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [createProject, setCreateProject] = useState(true);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [projectName, setProjectName] = useState(`${quotation.companyName} - Project Delivery`);
  const [loading, setLoading] = useState(false);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/quotations/${quotation.id}/convert`, {
        createProject,
        createInvoice,
        projectName: createProject ? projectName : undefined,
      });
      toast.success("Quotation converted successfully! Project & Invoice created.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Convert Proposal into Delivery</span>
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              #{quotation.quotationNumber} • {formatINR(quotation.totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="p-5 space-y-4 text-xs">
          <p className="text-muted-foreground">
            This operation marks the quotation as <strong className="text-emerald-600">ACCEPTED</strong> and automatically scaffolds project tracking and invoicing:
          </p>

          <div className="space-y-3 p-3 bg-muted/20 border border-border/80 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createProject}
                onChange={(e) => setCreateProject(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <span className="font-medium text-foreground">Launch Active Project</span>
                <p className="text-[11px] text-muted-foreground">
                  Creates project repository with budget ₹{quotation.totalAmount.toLocaleString("en-IN")} and 2 initial milestones.
                </p>
              </div>
            </label>

            {createProject && (
              <div className="pl-6 pt-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded text-xs font-medium"
                />
              </div>
            )}

            <div className="h-px bg-border/60" />

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createInvoice}
                onChange={(e) => setCreateInvoice(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <span className="font-medium text-foreground">Generate Draft GST Tax Invoice</span>
                <p className="text-[11px] text-muted-foreground">
                  Pre-fills all {quotation.items.length} line items with SAC codes, 18% GST, and Net 30 payment terms.
                </p>
              </div>
            </label>
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
              disabled={loading || (!createProject && !createInvoice)}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? "Converting..." : "Execute 1-Click Convert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-component: Corporate Proposal Preview Modal
// -------------------------------------------------------------
function QuotationPreviewModal({
  quotation,
  onClose,
}: {
  quotation: Quotation;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const taxAmount = quotation.isInterstate
    ? quotation.igstAmount
    : quotation.cgstAmount + quotation.sgstAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-xs text-foreground">
              {quotation.quotationNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                quotation.status === "ACCEPTED"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {quotation.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-background hover:bg-muted border border-border/80 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Public Share Link Bar */}
        <div className="px-4 py-2 bg-muted/40 border-b border-border/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground text-[11px] font-mono shrink-0">Client Proposal Portal:</span>
            <span className="text-foreground font-mono text-[11px] truncate select-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/p/quote/${quotation.shareToken || quotation.id}`
                : `/p/quote/${quotation.shareToken || quotation.id}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/p/quote/${quotation.shareToken || quotation.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Public proposal link copied to clipboard!");
              }}
              className="px-2 py-1 bg-background hover:bg-muted border border-border/80 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Link</span>
            </button>
            <a
              href={`/p/quote/${quotation.shareToken || quotation.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Portal</span>
            </a>
          </div>
        </div>

        {/* Printable Paper Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs bg-background">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/80 pb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">EON8 CRM & LABS</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                GSTIN: 33AABCE1234F1Z5 • SAC: 998314
              </p>
              <p className="text-[11px] text-muted-foreground">Chennai, Tamil Nadu, India</p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-foreground uppercase tracking-wider font-mono">
                COMMERCIAL ESTIMATE
              </span>
              <p className="font-mono text-muted-foreground mt-0.5">{quotation.quotationNumber}</p>
              <p className="text-muted-foreground">Date: {formatDate(quotation.issueDate)}</p>
              <p className="text-muted-foreground">Valid Until: {formatDate(quotation.validUntil)}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border/80">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              ESTIMATE PREPARED FOR
            </span>
            <div className="mt-1 font-semibold text-sm text-foreground">{quotation.companyName}</div>
            <div className="text-muted-foreground text-xs">
              Attn: {quotation.contactPerson} • {quotation.email}
            </div>
            {quotation.phone && (
              <div className="text-muted-foreground text-xs">Phone: {quotation.phone}</div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 font-mono text-[10px] text-muted-foreground uppercase">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">SAC</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {quotation.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{it.description}</td>
                  <td className="py-2.5 px-3 font-mono text-center text-muted-foreground">
                    {it.sacCode || "998314"}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right">{it.quantity}</td>
                  <td className="py-2.5 px-3 font-mono text-right tabular-nums">
                    {formatINR(it.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right font-medium tabular-nums text-foreground">
                    {formatINR(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 font-mono text-xs border-t border-border/80 pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="text-foreground">{formatINR(quotation.subTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {quotation.isInterstate ? "IGST (18%)" : "CGST (9%) + SGST (9%)"}:
                </span>
                <span className="text-foreground">{formatINR(taxAmount)}</span>
              </div>
              <div className="h-px bg-border/80 my-1" />
              <div className="flex justify-between font-bold text-sm text-foreground">
                <span>Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatINR(quotation.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {quotation.terms && (
            <div className="border-t border-border/80 pt-4 space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Terms & Conditions
              </span>
              <p className="text-[11px] text-muted-foreground whitespace-pre-line font-mono bg-muted/20 p-3 rounded-lg border border-border/60">
                {quotation.terms}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

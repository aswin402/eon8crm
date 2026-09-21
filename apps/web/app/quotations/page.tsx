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
import { Quotation, QuotationItem } from "@/types/schema";
import {
  CreateQuotationModal,
  ConvertQuotationModal,
  QuotationPreviewModal,
} from "@/components/quotations";
import { MetricCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { logger } from "@/lib/logger";

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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchQuotations = () => {
    setLoading(true);
    logger.info("DATA", `Fetching quotations (status=${statusFilter || "all"}, query="${searchQuery}")...`);
    const params = new URLSearchParams();
    if (statusFilter) params.append("status", statusFilter);
    if (searchQuery) params.append("search", searchQuery);

    api
      .get(`/api/v1/quotations?${params.toString()}`)
      .then((res) => {
        const list = res.data.quotations || [];
        setQuotations(list);
        if (res.data.stats) setStats(res.data.stats);
        logger.info("DATA", `Loaded ${list.length} quotations`);
      })
      .catch((err) => {
        logger.error("DATA", "Failed to fetch quotations:", err);
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
      logger.info("DATA", `Updating quotation ${id} status to ${newStatus}`);
      await api.patch(`/api/v1/quotations/${id}`, { status: newStatus });
      toast.success(`Quotation marked as ${newStatus}`);
      fetchQuotations();
    } catch (err: any) {
      logger.error("DATA", "Failed to update quotation", err);
      toast.error(err.response?.data?.error || "Failed to update quotation");
    }
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      logger.info("DATA", `Executing delete for quotation ${deleteTargetId}`);
      await api.delete(`/api/v1/quotations/${deleteTargetId}`);
      toast.success("Quotation deleted successfully");
      setDeleteTargetId(null);
      fetchQuotations();
    } catch (err: any) {
      logger.error("DATA", "Failed to delete quotation", err);
      toast.error(err.response?.data?.error || "Failed to delete quotation");
    }
  };

  const conversionRate =
    stats.totalCount > 0 ? Math.round((stats.acceptedCount / stats.totalCount) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
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
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
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
      )}

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
      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card/40 overflow-hidden">
          {quotations.length === 0 ? (
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
                              onClick={() => setDeleteTargetId(q.id)}
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
      )}

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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete Commercial Quotation"
        message="Are you sure you want to permanently delete this quotation proposal and its itemized line items? This action cannot be reversed."
        confirmText="Delete Quotation"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

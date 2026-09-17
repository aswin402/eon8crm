"use client";

import React from "react";
import { X, Printer, Globe, Copy, ExternalLink } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Quotation } from "@/types/schema";
import { DEFAULT_ORGANIZATION_CONFIG } from "@/config/organization";

interface QuotationPreviewModalProps {
  quotation: Quotation;
  onClose: () => void;
}

export function QuotationPreviewModal({
  quotation,
  onClose,
}: QuotationPreviewModalProps) {
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
              <h2 className="text-xl font-bold tracking-tight text-foreground">{DEFAULT_ORGANIZATION_CONFIG.brandName}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                GSTIN: {DEFAULT_ORGANIZATION_CONFIG.gstin} • SAC: {DEFAULT_ORGANIZATION_CONFIG.sacCode}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {DEFAULT_ORGANIZATION_CONFIG.city}, {DEFAULT_ORGANIZATION_CONFIG.state}, {DEFAULT_ORGANIZATION_CONFIG.country}
              </p>
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
                    {it.sacCode || DEFAULT_ORGANIZATION_CONFIG.sacCode}
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

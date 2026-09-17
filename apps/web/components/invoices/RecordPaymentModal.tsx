"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Invoice } from "@/types/schema";

interface RecordPaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({ invoice, onClose, onSuccess }: RecordPaymentModalProps) {
  const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount || 0);
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
    let rate = 0.1;
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

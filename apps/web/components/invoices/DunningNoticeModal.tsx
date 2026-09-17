"use client";

import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, Copy, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Invoice, DunningNotice } from "@/types/schema";
import { DEFAULT_ORGANIZATION_CONFIG } from "@/config/organization";

interface DunningNoticeModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function DunningNoticeModal({
  invoice,
  onClose,
  onSuccess,
}: DunningNoticeModalProps) {
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
  const [generatedNotice, setGeneratedNotice] = useState<DunningNotice | null>(null);

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
    const beneficiaryName =
      generatedNotice.bankDetails?.beneficiary || DEFAULT_ORGANIZATION_CONFIG.legalName;

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
Beneficiary: ${beneficiaryName}
Bank: ${generatedNotice.bankDetails?.bankName || DEFAULT_ORGANIZATION_CONFIG.bankName}
A/C No: ${generatedNotice.bankDetails?.accountNumber || DEFAULT_ORGANIZATION_CONFIG.accountNumber}
IFSC: ${generatedNotice.bankDetails?.ifscCode || DEFAULT_ORGANIZATION_CONFIG.ifsc}
UPI ID: ${generatedNotice.bankDetails?.upiId || DEFAULT_ORGANIZATION_CONFIG.upiId}

Issued by Finance & Accounts Division, ${beneficiaryName}.
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

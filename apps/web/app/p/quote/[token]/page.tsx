"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  Building2,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Lock,
  Calendar,
  X,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { DEFAULT_ORGANIZATION_CONFIG } from "@/config/organization";

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

export default function PublicProposalPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signing modal state
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");
  const [signatoryEmail, setSignatoryEmail] = useState("");
  const [signatoryNotes, setSignatoryNotes] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signingSuccess, setSigningSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get(`/api/v1/quotations/public/${token}`)
      .then((res) => {
        setQuotation(res.data.quotation);
        if (res.data.quotation) {
          setSignatoryName(res.data.quotation.contactPerson || "");
          setSignatoryEmail(res.data.quotation.email || "");
          setSignatoryTitle("Authorized Signatory");
        }
      })
      .catch((err) => {
        console.error("Failed to load quotation:", err);
        setError(err.response?.data?.error || "This proposal link is invalid or has expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please confirm legal authorization by checking the acknowledgment box.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/quotations/public/${token}/accept`, {
        signatoryName: signatoryName.trim(),
        signatoryTitle: signatoryTitle.trim() || "Authorized Signatory",
        signatoryEmail: signatoryEmail.trim(),
        notes: signatoryNotes.trim() || undefined,
      });

      setQuotation(res.data.quotation);
      setSigningSuccess(true);
      setShowSignModal(false);
      toast.success("Proposal digitally accepted and confirmed!");
    } catch (err: any) {
      console.error("Signing failed:", err);
      toast.error(err.response?.data?.error || "Failed to digitally accept proposal");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">Loading commercial proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-card border border-border/80 rounded-xl shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Proposal Unavailable</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || "The requested quotation proposal could not be retrieved. Please check the URL or contact the account manager."}
          </p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quotation.validUntil) < new Date() && quotation.status !== "ACCEPTED";
  const taxAmount = quotation.isInterstate
    ? quotation.igstAmount
    : quotation.cgstAmount + quotation.sgstAmount;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-16">
      {/* Top Persistent Action Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs font-mono shadow-2xs">
              E8
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground tracking-tight">
                  EON8 COMMERCIAL PORTAL
                </span>
                <span className="text-muted-foreground text-[11px] font-mono hidden sm:inline">•</span>
                <span className="text-muted-foreground text-[11px] font-mono hidden sm:inline truncate">
                  {quotation.quotationNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-muted border border-border/80 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            {quotation.status !== "ACCEPTED" && !isExpired && (
              <button
                onClick={() => setShowSignModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accept & Sign</span>
              </button>
            )}

            {quotation.status === "ACCEPTED" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium font-mono">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Digitally Accepted</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Sheet Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-8">
        {/* Success Alert Banner if just signed */}
        {signingSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                Commercial Agreement Executed Successfully
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Thank you! Your digital acceptance has been logged with cryptographic timestamp. An active project delivery space and invoice record have been automatically initialized.
              </p>
            </div>
          </div>
        )}

        {/* Paper Document Container */}
        <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-border/80 flex flex-col sm:flex-row sm:items-start justify-between gap-6 bg-muted/10">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {DEFAULT_ORGANIZATION_CONFIG.brandName}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {DEFAULT_ORGANIZATION_CONFIG.legalName}
              </p>
              <div className="pt-2 text-[11px] text-muted-foreground space-y-0.5">
                <div>GSTIN: <span className="font-mono text-foreground font-medium">{DEFAULT_ORGANIZATION_CONFIG.gstin}</span></div>
                <div>SAC Code: <span className="font-mono text-foreground font-medium">{DEFAULT_ORGANIZATION_CONFIG.sacCode}</span> ({DEFAULT_ORGANIZATION_CONFIG.sacDescription})</div>
                <div>{DEFAULT_ORGANIZATION_CONFIG.city}, {DEFAULT_ORGANIZATION_CONFIG.state}, {DEFAULT_ORGANIZATION_CONFIG.country}</div>
              </div>
            </div>

            <div className="sm:text-right space-y-1.5">
              <div className="inline-block">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono tracking-wide ${
                    quotation.status === "ACCEPTED"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : quotation.status === "SENT"
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {quotation.status === "ACCEPTED" ? "✓ DIGITALLY ACCEPTED" : `STATUS: ${quotation.status}`}
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-foreground">
                {quotation.quotationNumber}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5 font-mono">
                <div>Issue Date: <span className="text-foreground">{formatDate(quotation.issueDate)}</span></div>
                <div className="flex items-center gap-1 sm:justify-end">
                  <span>Valid Until:</span>
                  <span className={isExpired ? "text-rose-500 font-bold" : "text-foreground"}>
                    {formatDate(quotation.validUntil)}
                  </span>
                  {isExpired && <span className="text-rose-500 text-[10px]">(Expired)</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Client Prepared For Block */}
          <div className="p-6 sm:p-8 border-b border-border/80 bg-background grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Client Organization
              </div>
              <div className="space-y-1">
                <div className="text-base font-semibold text-foreground">
                  {quotation.companyName}
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Attn: {quotation.contactPerson}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{quotation.email}</span>
                </div>
                {quotation.phone && (
                  <div className="text-muted-foreground">
                    Phone: {quotation.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:border-l sm:border-border/80 sm:pl-6">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Commercial Summary
              </div>
              <div className="space-y-1 text-muted-foreground">
                <div>Payment Model: <strong className="text-foreground font-mono">Milestone Net 30</strong></div>
                <div>Currency: <strong className="text-foreground font-mono">INR (₹)</strong></div>
                <div>Statutory Regime: <strong className="text-foreground font-mono">{quotation.isInterstate ? "Inter-State IGST (18%)" : "Intra-State CGST (9%) + SGST (9%)"}</strong></div>
              </div>
            </div>
          </div>

          {/* Commercial Line Items Deliverables Table */}
          <div className="p-6 sm:p-8 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Scope of Work & Commercial Deliverables
            </h3>

            <div className="border border-border/80 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-mono text-[11px]">
                    <th className="py-2.5 px-3 font-medium w-12 text-center">#</th>
                    <th className="py-2.5 px-4 font-medium">DESCRIPTION & SPECIFICATIONS</th>
                    <th className="py-2.5 px-3 font-medium text-center">SAC</th>
                    <th className="py-2.5 px-3 font-medium text-right">QTY</th>
                    <th className="py-2.5 px-4 font-medium text-right">RATE</th>
                    <th className="py-2.5 px-4 font-medium text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {quotation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-3 px-3 font-mono text-center text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 font-mono text-center text-muted-foreground">
                        {item.sacCode || "998314"}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-muted-foreground tabular-nums">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right font-semibold text-foreground tabular-nums">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Waterfall Breakdown */}
            <div className="flex justify-end pt-3">
              <div className="w-full sm:w-80 space-y-2 p-4 bg-muted/20 border border-border/80 rounded-lg font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxable Subtotal:</span>
                  <span className="text-foreground tabular-nums">{formatINR(quotation.subTotal)}</span>
                </div>

                {quotation.isInterstate ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>IGST @ 18%:</span>
                    <span className="text-foreground tabular-nums">{formatINR(quotation.igstAmount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST @ 9%:</span>
                      <span className="text-foreground tabular-nums">{formatINR(quotation.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST @ 9%:</span>
                      <span className="text-foreground tabular-nums">{formatINR(quotation.sgstAmount)}</span>
                    </div>
                  </>
                )}

                <div className="h-px bg-border/80 my-1" />

                <div className="flex justify-between text-sm font-bold text-foreground">
                  <span>Total Investment:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatINR(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Block */}
          {quotation.terms && (
            <div className="p-6 sm:p-8 border-t border-border/80 bg-muted/10 space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Commercial Terms & Conditions
              </h3>
              <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed font-mono bg-background/60 p-3.5 rounded-lg border border-border/80">
                {quotation.terms}
              </div>
            </div>
          )}

          {/* Existing Signature Record or Acceptance Call to Action */}
          <div className="p-6 sm:p-8 border-t border-border/80 bg-background">
            {quotation.status === "ACCEPTED" ? (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                    Digital Execution Certificate
                  </span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-line font-mono bg-background p-3 rounded-md border border-border/80">
                  {quotation.notes?.includes("[Client Digital Signature]:")
                    ? quotation.notes.split("[Client Digital Signature]:")[1]?.trim() || quotation.notes
                    : `Digitally Accepted by ${quotation.contactPerson} on behalf of ${quotation.companyName}.`}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Legally binding digital acceptance recorded under Section 10A of the Information Technology Act.</span>
                </div>
              </div>
            ) : isExpired ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-800 dark:text-amber-300">
                    Proposal Validity Expired
                  </div>
                  <p className="text-amber-700 dark:text-amber-400">
                    This commercial proposal expired on {formatDate(quotation.validUntil)}. Please reach out to our team at {DEFAULT_ORGANIZATION_CONFIG.email} to request an updated quotation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-muted/20 border border-border/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Ready to Proceed?</span>
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-lg">
                    Digitally accepting this proposal locks in the scope, milestone schedule, and pricing. Our engineering team will immediately initialize kickoff.
                  </p>
                </div>

                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Accept & Sign Proposal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Acceptance & Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border/80 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-sm text-foreground">
                  Digital Proposal Acceptance & Signing
                </h3>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAcceptProposal} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-muted/30 border border-border/80 rounded-lg space-y-1">
                <div className="font-medium text-foreground">
                  {quotation.quotationNumber} • Total: {formatINR(quotation.totalAmount)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Client: {quotation.companyName}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Signatory Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">
                      Corporate Title / Designation
                    </label>
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      placeholder="e.g. Director / VP Engineering"
                      className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">
                      Signatory Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={signatoryEmail}
                      onChange={(e) => setSignatoryEmail(e.target.value)}
                      placeholder="e.g. john@company.com"
                      className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Onboarding Remarks / PO Reference (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={signatoryNotes}
                    onChange={(e) => setSignatoryNotes(e.target.value)}
                    placeholder="e.g. Approved under PO #2026-088. Ready for sprint kickoff."
                    className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      I confirm that I am an authorized representative of{" "}
                      <strong className="text-foreground">{quotation.companyName}</strong>,
                      and agree to the deliverables, pricing, and commercial terms outlined in this proposal.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border/80 bg-background hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !agreeTerms || !signatoryName || !signatoryEmail}
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? "Signing & Initializing..." : "Confirm & Sign Proposal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  FileText,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Mail,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
  hsnSacCode: string | null;
}

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  amount: number | string;
  paymentDate: string;
  paymentMethod: string;
  referenceId: string | null;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  subtotal: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  remainingBalance: number;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  client: {
    id: string;
    clientNumber: string;
    companyName: string;
    email: string;
    phone: string | null;
    gstin: string | null;
    billingAddress: string;
  };
  project?: {
    id: string;
    name: string;
  } | null;
  items: InvoiceItem[];
  payments: PaymentRecord[];
}

interface InvoicePreviewModalProps {
  invoiceId: string;
  onClose: () => void;
  onRecordPayment?: () => void;
}

export function InvoicePreviewModal({ invoiceId, onClose, onRecordPayment }: InvoicePreviewModalProps) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/v1/invoices/${invoiceId}`)
      .then((res) => {
        setInvoice(res.data.invoice);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load invoice details");
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const formatINR = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="p-8 bg-card border border-border/80 rounded-xl flex items-center gap-3 text-xs text-muted-foreground shadow-2xl">
          <RefreshCw className="w-4 h-4 animate-spin text-foreground" />
          <span>Generating Tax Invoice preview...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="p-6 bg-card border border-border/80 rounded-xl text-center space-y-3 max-w-sm w-full shadow-2xl">
          <p className="text-xs text-rose-500 font-medium">{error || "Invoice not found"}</p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-medium hover:bg-muted/70 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const isInterState = Number(invoice.igstAmount) > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="print:hidden px-4 sm:px-6 py-3 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${
                isPaid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {onRecordPayment && invoice.remainingBalance > 0 && (
              <button
                onClick={onRecordPayment}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border/80 bg-muted/30 hover:bg-muted text-foreground rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-foreground bg-card print:p-0 print:bg-white print:text-black">
          {/* Top Header: Title & Company Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded bg-foreground text-background font-mono text-xs font-bold flex items-center justify-center">
                  E8
                </div>
                <span className="font-bold text-base tracking-tight">EON8 TECHNOLOGIES PVT LTD</span>
              </div>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 leading-relaxed max-w-sm">
                Plot No. 42, Guindy Industrial Estate, Guindy<br />
                Chennai, Tamil Nadu, PIN: 600032<br />
                GSTIN: <span className="font-mono font-semibold text-foreground print:text-black">33AABCE1234F1Z5</span> (State Code: 33)<br />
                PAN: AABCE1234F • Email: billing@eon8.io
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-muted/40 border border-border/80">
                TAX INVOICE
              </span>
              <h2 className="text-xl font-bold font-mono text-foreground print:text-black tracking-tight mt-1">
                {invoice.invoiceNumber}
              </h2>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 font-mono">
                Issue Date: {new Date(invoice.issueDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 font-mono">
                Payment Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Billed To / Client Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/15 print:border-zinc-300 print:bg-zinc-50 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground print:text-zinc-500 font-semibold">
                BILLED TO (CLIENT RECIPIENT)
              </span>
              <h4 className="font-bold text-sm text-foreground print:text-black mt-1">
                {invoice.client.companyName}
              </h4>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 mt-1 whitespace-pre-wrap leading-relaxed">
                {invoice.client.billingAddress}
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground print:text-zinc-500 font-semibold">
                TAX COMPLIANCE & PROJECT
              </span>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 mt-1">
                GSTIN: <span className="font-mono font-semibold text-foreground print:text-black">{invoice.client.gstin || "Unregistered / Consumer"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600">
                Client ID: <span className="font-mono">{invoice.client.clientNumber}</span>
              </p>
              {invoice.project && (
                <p className="text-[11px] text-muted-foreground print:text-zinc-600">
                  Project: <span className="font-medium text-foreground print:text-black">{invoice.project.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-border/80 overflow-hidden print:border-zinc-300 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border/80 print:bg-zinc-100 text-muted-foreground print:text-zinc-700 font-medium">
                <tr>
                  <th className="py-2.5 px-3 font-mono text-[11px]">#</th>
                  <th className="py-2.5 px-3">Description of Services</th>
                  <th className="py-2.5 px-3 font-mono text-[11px]">HSN / SAC</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Qty / Hrs</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Rate (₹)</th>
                  <th className="py-2.5 px-3 font-mono text-right text-[11px]">Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-zinc-200">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-muted-foreground print:text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground print:text-black">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground print:text-zinc-500">
                      {item.hsnSacCode || "998314"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground print:text-black">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-foreground print:text-black">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground print:text-black">
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
            {/* Bank & Remittance Instructions */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/15 print:border-zinc-300 print:bg-zinc-50 text-xs space-y-1.5 w-full sm:max-w-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground print:text-zinc-500 font-semibold">
                BANK REMITTANCE DETAILS
              </span>
              <p className="font-semibold text-foreground print:text-black">HDFC Bank Ltd</p>
              <p className="text-[11px] text-muted-foreground print:text-zinc-600 font-mono">
                A/C No: 50200088991122<br />
                IFSC: HDFC0001234<br />
                Branch: Guindy, Chennai<br />
                UPI ID: eon8crm@hdfcbank
              </p>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:max-w-xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground print:text-zinc-600 font-mono">
                <span>Taxable Subtotal</span>
                <span className="text-foreground print:text-black tabular-nums">{formatINR(invoice.subtotal)}</span>
              </div>

              {isInterState ? (
                <div className="flex items-center justify-between text-muted-foreground print:text-zinc-600 font-mono">
                  <span>Integrated GST (IGST @ 18%)</span>
                  <span className="text-foreground print:text-black tabular-nums">{formatINR(invoice.igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-muted-foreground print:text-zinc-600 font-mono">
                    <span>Central GST (CGST @ 9%)</span>
                    <span className="text-foreground print:text-black tabular-nums">{formatINR(invoice.cgstAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground print:text-zinc-600 font-mono">
                    <span>State GST (SGST @ 9%)</span>
                    <span className="text-foreground print:text-black tabular-nums">{formatINR(invoice.sgstAmount)}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/80 print:border-zinc-300 font-mono font-bold text-sm">
                <span>Total Invoice Value</span>
                <span className="text-foreground print:text-black tabular-nums">{formatINR(invoice.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground print:text-zinc-600 font-mono pt-1">
                <span>Paid / Realized Amount</span>
                <span className="text-emerald-600 print:text-emerald-800 tabular-nums font-semibold">
                  {formatINR(invoice.paidAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono font-bold pt-1 border-t border-border/60">
                <span>Balance Due</span>
                <span className={invoice.remainingBalance > 0 ? "text-amber-600 print:text-amber-800" : "text-muted-foreground print:text-zinc-500"}>
                  {formatINR(invoice.remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Authorized Signatory & Compliance Footer */}
          <div className="pt-8 border-t border-border/80 print:border-zinc-300 flex flex-col sm:flex-row items-end justify-between gap-4 text-xs">
            <div className="text-[10px] text-muted-foreground print:text-zinc-500 leading-relaxed font-mono">
              <p>Certified that particulars given above are true and correct.</p>
              <p>Invoice generated electronically in compliance with Section 31 of CGST Act 2017.</p>
            </div>

            <div className="text-center sm:text-right space-y-8">
              <p className="text-[11px] font-semibold text-foreground print:text-black font-mono">
                For EON8 TECHNOLOGIES PVT LTD
              </p>
              <div className="border-t border-border/60 pt-1 text-[10px] text-muted-foreground print:text-zinc-600 font-mono">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatINR, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: string | number;
  paymentDate: string;
  paymentMethod: string;
  referenceId: string | null;
  notes: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: string | number;
    client: {
      id: string;
      companyName: string;
    };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/invoices/payments/all");
      setPayments(res.data.payments || []);
      setTotalCollected(res.data.totalCollected || 0);
    } catch (err: any) {
      logger.warn("DATA", "Failed to load payments", err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.paymentNumber.toLowerCase().includes(q) ||
      p.invoice.invoiceNumber.toLowerCase().includes(q) ||
      p.invoice.client.companyName.toLowerCase().includes(q) ||
      (p.referenceId && p.referenceId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>Finance</span>
            <span>/</span>
            <span className="text-amber-500 dark:text-amber-400 font-semibold">Payment Receipts</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1 flex items-center gap-2">
            <span>Cleared Payments & Bank Collections</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of client payment settlements, bank transaction references (UTR), and reconciled receipts.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] shadow-2xs backdrop-blur-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Total Realized Cash</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(totalCollected)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Cleared in corporate bank accounts</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Payment Receipts</span>
            <CreditCard className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {payments.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Total settlement transactions</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Average Receipt Value</span>
            <DollarSign className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {formatINR(payments.length > 0 ? Math.round(totalCollected / payments.length) : 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Per transaction ticket</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-2 bg-card/50 border border-border/80 rounded-xl">
        <span className="text-xs font-medium text-foreground px-2">
          Settlement Ledger <span className="text-amber-500 dark:text-amber-400 font-mono">({filteredPayments.length})</span>
        </span>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search receipt #, invoice, client, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Payments Table using Shadcn */}
      <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/30">
              <TableHead className="font-mono text-[11px]">Receipt #</TableHead>
              <TableHead className="font-mono text-[11px]">Payment Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Invoice Linked</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="font-mono text-[11px]">Reference / UTR</TableHead>
              <TableHead className="text-right font-mono text-[11px]">Settled Amount (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-amber-500" />
                  Loading payment records...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No payment settlements found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => (
                <TableRow key={p.id} className="hover:bg-amber-500/[0.03] transition-colors">
                  <TableCell className="font-mono font-medium text-foreground">
                    <span className="text-amber-600 dark:text-amber-400">{p.paymentNumber}</span>
                  </TableCell>

                  <TableCell className="font-mono text-muted-foreground tabular-nums">
                    {formatDate(p.paymentDate)}
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/clients/${p.invoice.client.id}`}
                      className="font-medium text-foreground hover:text-amber-500 hover:underline flex items-center gap-1.5 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{p.invoice.client.companyName}</span>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <Link
                      href="/invoices"
                      className="font-mono text-xs text-foreground hover:text-amber-500 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span>{p.invoice.invoiceNumber}</span>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400">
                      {p.paymentMethod}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-muted-foreground">
                    {p.referenceId || "—"}
                  </TableCell>

                  <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground">
                    {formatINR(p.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

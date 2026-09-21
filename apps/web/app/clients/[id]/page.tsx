"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users2,
  Building,
  Briefcase,
  Receipt,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatINR, formatCompactINR, formatDate } from "@/lib/utils";
import { Chatter } from "@/components/common/Chatter";
import { InvoicePreviewModal } from "@/components/invoices/InvoicePreviewModal";

export default function Client360Page() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "invoices" | "contacts" | "chatter">("projects");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      api
        .get(`/api/v1/clients/${clientId}/360`)
        .then((res) => {
          setClient(res.data.client);
        })
        .catch((err) => logger.warn("DATA", "Client 360 fetch error", err?.message))
        .finally(() => setLoading(false));
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Loading Client 360 profile...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-xs text-rose-500">
        Client record not found.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Client Directory</span>
      </Link>

      {/* Master Client 360 Header Profile */}
      <div className="p-5 md:p-6 rounded-xl bg-card border border-border/80 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Company Title & GSTIN */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
                {client.companyName}
              </h1>
              <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/80">
                {client.clientNumber}
              </span>
              {client.gstin && (
                <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border/80">
                  GSTIN: {client.gstin}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-muted-foreground" />
                {client.contactPerson}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {client.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                {client.phone}
              </span>
              <span className="font-mono text-[11px] bg-muted/40 border border-border/60 px-2 py-0.5 rounded text-foreground">
                Terms: {client.paymentTerms}
              </span>
            </div>
          </div>

          {/* Outstanding Balance KPI Card */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Outstanding Balance
              </span>
              <div className="text-lg font-semibold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCompactINR(client.financialSummary?.totalOutstanding || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Address & Lifetime Financial Summary */}
        <div className="pt-4 border-t border-border/80 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1">
            <span className="font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Registered Billing Address
            </span>
            <p className="text-foreground leading-relaxed">{client.billingAddress}</p>
          </div>

          <div className="space-y-1 font-mono">
            <span className="font-sans font-medium text-muted-foreground">Lifetime Billed</span>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatCompactINR(client.financialSummary?.totalBilled || 0)}
            </p>
          </div>

          <div className="space-y-1 font-mono">
            <span className="font-sans font-medium text-muted-foreground">Cleared Collections</span>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCompactINR(client.financialSummary?.totalPaid || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border/80 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "projects"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Active Projects ({client.projects?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "invoices"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoices ({client.invoices?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "contacts"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users2 className="w-3.5 h-3.5" />
          <span>Contacts ({client.contacts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("chatter")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "chatter"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Activity Stream</span>
        </button>
      </div>

      {/* Tab Content Panes */}
      <div>
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.projects?.map((proj: any) => (
              <div
                key={proj.id}
                className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-3 hover:border-foreground/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{proj.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manager: {proj.manager?.name} ({proj.manager?.email})
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-medium font-mono text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {proj.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="font-sans text-[10px] text-muted-foreground uppercase">Budget</span>
                      <p className="font-semibold text-foreground tabular-nums">{formatINR(Number(proj.budget))}</p>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-muted-foreground uppercase">Tasks</span>
                      <p className="font-semibold text-foreground tabular-nums">{proj._count?.tasks || 0}</p>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-muted-foreground uppercase">Time Logs</span>
                      <p className="font-semibold text-foreground tabular-nums">{proj._count?.timeEntries || 0}</p>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline shrink-0 px-2.5 py-1.5 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <span>Project 360°</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
            {client.projects?.length === 0 && (
              <div className="col-span-2 p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No active projects linked to this client.
              </div>
            )}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 border-b border-border/80 text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Invoice #</th>
                    <th className="py-3 px-4 font-medium">Issue Date</th>
                    <th className="py-3 px-4 font-medium">Due Date</th>
                    <th className="py-3 px-4 font-medium">Subtotal</th>
                    <th className="py-3 px-4 font-medium">GST</th>
                    <th className="py-3 px-4 font-medium">Total Amount</th>
                    <th className="py-3 px-4 font-medium">Paid</th>
                    <th className="py-3 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {client.invoices?.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <button
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="hover:underline font-mono text-xs font-semibold cursor-pointer text-foreground flex items-center gap-1.5"
                          title="View Indian GST Tax Invoice"
                        >
                          <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{inv.invoiceNumber}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">{formatINR(Number(inv.subTotal))}</td>
                      <td className="py-3.5 px-4 tabular-nums text-muted-foreground">
                        {formatINR(Number(inv.cgstAmount) + Number(inv.sgstAmount) + Number(inv.igstAmount))}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground tabular-nums">
                        {formatINR(Number(inv.totalAmount))}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {formatINR(Number(inv.paidAmount))}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border/80 bg-muted/40 text-[11px] font-medium text-foreground">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inv.status === "PAID"
                                ? "bg-emerald-500"
                                : inv.status === "PARTIAL"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {client.invoices?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs font-sans">
                        No invoices generated for this client yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.contacts?.map((c: any) => (
              <div key={c.id} className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">{c.name}</span>
                  {c.isPrimary && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-muted border border-border/80 text-foreground rounded-md">
                      Primary Contact
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{c.designation || "Executive"}</p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {c.email}
                  </span>
                  {c.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {c.phone}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {client.contacts?.length === 0 && (
              <div className="col-span-2 p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No additional contacts listed for this client.
              </div>
            )}
          </div>
        )}

        {activeTab === "chatter" && (
          <Chatter clientId={client.id} initialActivities={client.activities || []} />
        )}
      </div>

      {/* Indian GST Tax Invoice Preview Modal */}
      {selectedInvoiceId && (
        <InvoicePreviewModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}

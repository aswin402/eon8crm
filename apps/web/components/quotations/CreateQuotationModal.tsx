"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { QuotationItem, Client } from "@/types/schema";

interface CreateQuotationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateQuotationModal({ onClose, onSuccess }: CreateQuotationModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
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

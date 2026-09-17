"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Client, InvoiceItem } from "@/types/schema";
import { DEFAULT_ORGANIZATION_CONFIG } from "@/config/organization";

interface ProjectOption {
  id: string;
  name: string;
}

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInvoiceModal({ onClose, onSuccess }: CreateInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [isInterstate, setIsInterstate] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "Professional Consulting & Development",
      sacCode: DEFAULT_ORGANIZATION_CONFIG.sacCode,
      quantity: 1,
      unitPrice: 50000,
      taxRate: 18,
      amount: 50000,
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/clients").then((res) => {
      if (res.data.clients?.length > 0) {
        setClients(res.data.clients);
        setClientId(res.data.clients[0].id);
      }
    });
    api.get("/api/v1/projects").then((res) => {
      if (res.data.projects?.length > 0) {
        setProjects(res.data.projects);
        setProjectId(res.data.projects[0].id);
      }
    });
  }, []);

  const [pulledTimeEntryIds, setPulledTimeEntryIds] = useState<string[]>([]);
  const [pulledMilestoneIds, setPulledMilestoneIds] = useState<string[]>([]);

  const handlePullUnbilled = async () => {
    if (!projectId) return;
    try {
      const res = await api.post("/api/v1/invoices/pull-unbilled", { projectId });
      if (res.data.items?.length > 0) {
        setItems(res.data.items);
        setPulledTimeEntryIds(res.data.timeEntryIds || []);
        setPulledMilestoneIds(res.data.milestoneIds || []);
        toast.success(
          `Aggregated ${res.data.items.length} unbilled items (${res.data.timeEntryCount || 0} timesheets, ${res.data.milestoneCount || 0} milestones).`
        );
      } else {
        toast.info("No unbilled approved hours or milestones found for this project.");
      }
    } catch (err: any) {
      toast.error("Failed to pull unbilled items");
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "Software Implementation Services",
        sacCode: DEFAULT_ORGANIZATION_CONFIG.sacCode,
        quantity: 1,
        unitPrice: 15000,
        taxRate: 18,
        amount: 15000,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );
  const taxAmount = subTotal * 0.18;
  const grandTotal = subTotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/invoices", {
        clientId,
        projectId: projectId || undefined,
        dueDate,
        isInterstate,
        items,
        timeEntryIds: pulledTimeEntryIds.length > 0 ? pulledTimeEntryIds : undefined,
        milestoneIds: pulledMilestoneIds.length > 0 ? pulledMilestoneIds : undefined,
      });
      onSuccess();
      toast.success("GST Tax Invoice generated & billable hours cleared successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Create GST Tax Invoice</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Itemized billing compliant with Indian GST (SAC codes & tax schedules)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.gstin ? `(${c.gstin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              >
                <option value="">None / Retainer billing</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="interstate"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="interstate" className="font-medium text-foreground text-xs cursor-pointer">
                Inter-State (18% IGST instead of 9% CGST + 9% SGST)
              </label>
            </div>
          </div>

          {/* Pull Unbilled Hours Banner */}
          {projectId && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-xs">Pull Approved Billable Hours</p>
                <p className="text-[10px] text-muted-foreground">
                  Aggregates unbilled time entries logged against this project
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullUnbilled}
                className="flex items-center gap-1 px-2.5 py-1 bg-background hover:bg-muted text-foreground border border-border/80 text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-muted-foreground" />
                <span>Pull Hours</span>
              </button>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">Line Items ({items.length})</label>
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 border border-border/80 rounded-lg bg-card/50 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].description = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantity = Number(e.target.value);
                        copy[idx].amount = Number(e.target.value) * (copy[idx].unitPrice || 0);
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].unitPrice = Number(e.target.value);
                        copy[idx].amount = (copy[idx].quantity || 0) * Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded-md font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span className="font-sans">Subtotal (Pre-tax)</span>
              <span className="tabular-nums">{formatINR(subTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="font-sans">
                {isInterstate ? "IGST (18%)" : "CGST (9%) + SGST (9%)"}
              </span>
              <span className="tabular-nums">{formatINR(taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-border/80 font-medium text-foreground text-sm">
              <span className="font-sans">Total Tax Invoice Value</span>
              <span className="tabular-nums font-semibold">{formatINR(grandTotal)}</span>
            </div>
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
              {loading ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

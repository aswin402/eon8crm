"use client";

import React, { useState } from "react";
import { X, Sparkles, Building, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

interface ConvertLeadModalProps {
  lead: {
    id: string;
    leadNumber: string;
    companyName: string;
    contactPerson: string;
    estimatedValue: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function ConvertLeadModal({ lead, onClose, onSuccess }: ConvertLeadModalProps) {
  const [gstin, setGstin] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [projectBudget, setProjectBudget] = useState(lead.estimatedValue || 0);
  const [projectManagerId, setProjectManagerId] = useState("");
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch PMs / Admins dynamically
    api
      .get("/api/v1/users/assignable")
      .then((res) => {
        if (res.data.users) {
          setManagers(res.data.users);
          if (res.data.users.length > 0) {
            setProjectManagerId(res.data.users[0].id);
          }
        }
      })
      .catch((err) => {
        logger.error("DATA", "Could not fetch assignable staff", err);
      });
  }, []);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingAddress.trim()) {
      setError("Billing address is required for invoicing");
      toast.warning("Billing address is required for invoicing", "Validation Missing");
      return;
    }

    if (!projectManagerId) {
      setError("Please select a project manager");
      toast.warning("Please select an assigned Project Manager", "Validation Missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info("DATA", `Converting won lead ${lead.leadNumber} into Client 360 & Project`);
      await api.post(`/api/v1/leads/${lead.id}/convert`, {
        gstin: gstin.trim() || undefined,
        billingAddress: billingAddress.trim(),
        projectManagerId,
        projectBudget: Number(projectBudget),
      });

      toast.success(`Successfully converted ${lead.companyName} into Client 360 & active delivery project!`, "Conversion Completed");
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Conversion failed. Check server logs.";
      logger.error("DATA", `Lead conversion failed for ${lead.leadNumber}: ${msg}`, err);
      toast.error(msg, "Conversion Failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-muted-foreground">
              <span>WON DEAL CONVERSION</span>
              <span>•</span>
              <span>{lead.leadNumber}</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground mt-0.5">
              Convert {lead.companyName} to Client
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConvert} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md font-medium text-xs">
              {error}
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3 rounded-md bg-muted/20 border border-border/80 text-muted-foreground flex items-start gap-2.5 leading-relaxed text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              This will atomically mark this lead as <strong>WON</strong>, create a verified <strong>Client account</strong> with GST invoicing rules, and provision the delivery <strong>Project</strong>.
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Indian GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 33AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              maxLength={15}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md font-mono text-xs focus:outline-hidden focus:border-foreground/40 uppercase text-foreground transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Official Billing Address *</label>
            <textarea
              placeholder="Full registered company address for GST invoicing..."
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={2}
              required
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Project Budget (₹)</label>
              <input
                type="number"
                value={projectBudget}
                onChange={(e) => setProjectBudget(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md font-mono text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Assigned Project Manager</label>
              <select
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground hover:bg-foreground/90 text-background rounded-md font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Execute Conversion</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

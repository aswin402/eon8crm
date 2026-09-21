"use client";

import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

interface NewLeadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewLeadModal({ onClose, onSuccess }: NewLeadModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Inbound Website");
  const [industry, setIndustry] = useState("");
  const [serviceInterest, setServiceInterest] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      logger.info("DATA", `Creating new lead for company: ${companyName}`);
      await api.post("/api/v1/leads", {
        companyName,
        contactPerson,
        email,
        phone,
        source,
        industry: industry || undefined,
        serviceInterest: serviceInterest || undefined,
        estimatedValue: Number(estimatedValue),
        notes: notes || undefined,
      });

      toast.success(`Opportunity for ${companyName} added to pipeline!`, "Lead Created");
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to create lead";
      logger.error("DATA", `Lead creation failed: ${msg}`, err);
      toast.error(msg, "Creation Failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Create New Lead</h3>
            <p className="text-[11px] text-muted-foreground">Add a prospective sales opportunity to the pipeline</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md font-medium text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Tech Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh Kumar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Email *</label>
              <input
                type="email"
                required
                placeholder="suresh@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              >
                <option value="Inbound Website">Inbound Website</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Client Referral</option>
                <option value="Cold Outbound">Cold Outbound</option>
                <option value="Event / Expo">Event / Expo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Estimated Deal (₹)</label>
              <input
                type="number"
                placeholder="500000"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md font-mono text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Service Interest</label>
            <input
              type="text"
              placeholder="e.g. Custom CRM, Web App, Cloud Migration"
              value={serviceInterest}
              onChange={(e) => setServiceInterest(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Internal Notes</label>
            <textarea
              rows={2}
              placeholder="Key requirements or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-xs focus:outline-hidden focus:border-foreground/40 text-foreground transition-colors resize-none"
            />
          </div>

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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save Opportunity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

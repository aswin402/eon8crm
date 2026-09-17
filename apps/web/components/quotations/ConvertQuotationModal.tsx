"use client";

import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Quotation } from "@/types/schema";

interface ConvertQuotationModalProps {
  quotation: Quotation;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConvertQuotationModal({
  quotation,
  onClose,
  onSuccess,
}: ConvertQuotationModalProps) {
  const [createProject, setCreateProject] = useState(true);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [projectName, setProjectName] = useState(`${quotation.companyName} - Project Delivery`);
  const [loading, setLoading] = useState(false);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/api/v1/quotations/${quotation.id}/convert`, {
        createProject,
        createInvoice,
        projectName: createProject ? projectName : undefined,
      });
      toast.success("Quotation converted successfully! Project & Invoice created.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Convert Proposal into Delivery</span>
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              #{quotation.quotationNumber} • {formatINR(quotation.totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="p-5 space-y-4 text-xs">
          <p className="text-muted-foreground">
            This operation marks the quotation as <strong className="text-emerald-600">ACCEPTED</strong> and automatically scaffolds project tracking and invoicing:
          </p>

          <div className="space-y-3 p-3 bg-muted/20 border border-border/80 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createProject}
                onChange={(e) => setCreateProject(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <span className="font-medium text-foreground">Launch Active Project</span>
                <p className="text-[11px] text-muted-foreground">
                  Creates project repository with budget ₹{quotation.totalAmount.toLocaleString("en-IN")} and 2 initial milestones.
                </p>
              </div>
            </label>

            {createProject && (
              <div className="pl-6 pt-1 space-y-1">
                <label className="text-[11px] text-muted-foreground">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-background border border-border/80 rounded text-xs font-medium"
                />
              </div>
            )}

            <div className="h-px bg-border/60" />

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={createInvoice}
                onChange={(e) => setCreateInvoice(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <span className="font-medium text-foreground">Generate Draft GST Tax Invoice</span>
                <p className="text-[11px] text-muted-foreground">
                  Pre-fills all {quotation.items.length} line items with SAC codes, 18% GST, and Net 30 payment terms.
                </p>
              </div>
            </label>
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
              disabled={loading || (!createProject && !createInvoice)}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? "Converting..." : "Execute 1-Click Convert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

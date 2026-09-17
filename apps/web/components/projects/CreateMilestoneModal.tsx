"use client";

import React from "react";
import { X } from "lucide-react";

export interface MilestoneFormData {
  title: string;
  description: string;
  amount: number;
  completionDate: string;
}

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  projectName: string;
  milestoneForm: MilestoneFormData;
  setMilestoneForm: React.Dispatch<React.SetStateAction<MilestoneFormData>>;
}

export const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  milestoneForm,
  setMilestoneForm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Add Project Milestone</h3>
            <p className="text-[11px] text-muted-foreground">{projectName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Milestone Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Milestone 1: Core API & Architecture"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Milestone Value (₹)</label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="150000"
                value={milestoneForm.amount}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, amount: Number(e.target.value) })
                }
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground text-[11px]">Target Date</label>
              <input
                type="date"
                value={milestoneForm.completionDate}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, completionDate: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground text-[11px]">Scope & Deliverables</label>
            <textarea
              rows={2}
              value={milestoneForm.description}
              onChange={(e) =>
                setMilestoneForm({ ...milestoneForm, description: e.target.value })
              }
              placeholder="Key deliverables required for client sign-off..."
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-border/80 text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors shadow-2xs"
            >
              Create Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

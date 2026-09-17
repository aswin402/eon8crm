"use client";

import React from "react";
import { X } from "lucide-react";

export interface TimeEntryFormData {
  projectId: string;
  description: string;
  hours: string;
  minutes: string;
  date: string;
  isBillable: boolean;
}

export interface ProjectOption {
  id: string;
  name: string;
}

interface ManualTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  formData: TimeEntryFormData;
  setFormData: React.Dispatch<React.SetStateAction<TimeEntryFormData>>;
  projects: ProjectOption[];
}

export const ManualTimeEntryModal: React.FC<ManualTimeEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formData,
  setFormData,
  projects,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Log Manual Timesheet Entry</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Record labor costing against an active project
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Target Project *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Work Description *</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Implemented payment gateway webhooks and unit tests"
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                step="5"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isBillableCheck"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              className="rounded border-border"
            />
            <label
              htmlFor="isBillableCheck"
              className="text-xs font-medium text-foreground cursor-pointer"
            >
              Mark as Billable to Client
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-border/80 text-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Logging..." : "Record Time Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

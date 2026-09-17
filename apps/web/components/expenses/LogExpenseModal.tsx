"use client";

import React from "react";
import { X } from "lucide-react";

export interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  vendor: string;
  expenseDate: string;
}

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  formData: ExpenseFormData;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formData,
  setFormData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Log Operational Expense</h3>
            <p className="text-[11px] text-muted-foreground">
              Record overhead costs for net margin calculations
            </p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Expense Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
                required
              >
                <option value="Software">Software & Cloud</option>
                <option value="Salaries">Salaries & Payroll</option>
                <option value="Rent">Rent & Facilities</option>
                <option value="Marketing">Marketing & Ads</option>
                <option value="Travel">Travel & Lodging</option>
                <option value="Office">Office Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="25000"
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Expense Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. GitHub Enterprise & Figma Seats"
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Vendor / Payee
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. AWS Inc"
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Expense Date
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                required
              />
            </div>
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
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isSubmitting ? "Logging..." : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { X } from "lucide-react";

export interface EditUserFormData {
  role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "PROJECT_MANAGER" | "EMPLOYEE" | "FINANCE" | string;
  phone: string;
  internalCostRate: number;
  billableRate: number;
  isActive: boolean;
}

export interface UserTarget {
  name: string;
  email: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedUser: UserTarget | null;
  editForm: EditUserFormData;
  setEditForm: React.Dispatch<React.SetStateAction<EditUserFormData>>;
  isSaving: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedUser,
  editForm,
  setEditForm,
  isSaving,
}) => {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Configure User & Costing</h3>
            <p className="text-[11px] text-muted-foreground">
              {selectedUser.name} ({selectedUser.email})
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
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Access Role (RBAC)
            </label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Unrestricted Access)</option>
              <option value="ADMIN">ADMIN (Operations & Team)</option>
              <option value="PROJECT_MANAGER">PROJECT_MANAGER (Projects & Milestones)</option>
              <option value="SALES">SALES (Leads & CRM Funnel)</option>
              <option value="FINANCE">FINANCE (Invoices & Cash Flow)</option>
              <option value="EMPLOYEE">EMPLOYEE (Tasks & Timesheets)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Internal Cost Rate (₹/hr)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={editForm.internalCostRate}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    internalCostRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Base labor expense rate</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Billable Client Rate (₹/hr)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={editForm.billableRate}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    billableRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground font-mono focus:outline-hidden focus:border-foreground/40 transition-colors"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Charge-out rate on invoices</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Contact Phone Number
            </label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-2.5 py-1.5 bg-muted/20 border border-border/80 rounded-md text-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="rounded border-border/80 text-foreground focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="isActiveToggle"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Active User Account (can authenticate into system)
            </label>
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
              disabled={isSaving}
              className="px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

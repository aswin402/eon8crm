"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Shield,
  ShieldAlert,
  Edit2,
  Mail,
  CheckCircle2,
  XCircle,
  Briefcase,
  Clock,
  CheckSquare,
  Search,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "PROJECT_MANAGER" | "EMPLOYEE" | "FINANCE";
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  internalCostRate: string | number;
  billableRate: string | number;
  createdAt: string;
  _count: {
    assignedTasks: number;
    timeEntries: number;
    managedProjects: number;
  };
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    role: "EMPLOYEE",
    phone: "",
    internalCostRate: 0,
    billableRate: 0,
    isActive: true,
  });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/users");
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: TeamMember) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      phone: user.phone || "",
      internalCostRate: Number(user.internalCostRate),
      billableRate: Number(user.billableRate),
      isActive: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      await api.patch(`/api/v1/users/${selectedUser.id}`, {
        role: editForm.role,
        phone: editForm.phone || undefined,
        internalCostRate: Number(editForm.internalCostRate),
        billableRate: Number(editForm.billableRate),
        isActive: editForm.isActive,
      });

      setFeedbackMsg({ type: "success", text: "User rates and role updated successfully." });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to update user profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleDot = (role: TeamMember["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500";
      case "ADMIN":
        return "bg-blue-500";
      case "SALES":
        return "bg-amber-500";
      case "PROJECT_MANAGER":
        return "bg-emerald-500";
      case "FINANCE":
        return "bg-rose-500";
      default:
        return "bg-zinc-400";
    }
  };

  const formatRoleLabel = (role: TeamMember["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      case "SALES":
        return "Sales";
      case "PROJECT_MANAGER":
        return "Project Manager";
      case "FINANCE":
        return "Finance";
      default:
        return "Engineer";
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>Management</span>
            <span>/</span>
            <span className="text-foreground">Team & RBAC</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Team Roster & Costing Model
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Role-Based Access Control (RBAC), internal labor cost rates, and billable client rates.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-muted/20 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-muted/40 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/40 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Stats Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-card/50 border border-border/80 rounded-xl">
        <div className="flex items-center gap-3 text-xs px-2">
          <span className="font-medium text-foreground">
            Active: <span className="font-mono">{users.filter((u) => u.isActive).length}</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Total Staff: <span className="font-mono">{users.length}</span>
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-medium">
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Workload Metrics</th>
                <th className="py-2.5 px-4 text-right font-mono text-[11px]">Internal Cost (₹/hr)</th>
                <th className="py-2.5 px-4 text-right font-mono text-[11px]">Billable Rate (₹/hr)</th>
                <th className="py-2.5 px-4 text-right font-mono text-[11px]">Labor Margin</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foreground" />
                    Loading team roster...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const cost = Number(user.internalCostRate);
                  const billable = Number(user.billableRate);
                  const marginPct = billable > 0 ? Math.round(((billable - cost) / billable) * 100) : 0;

                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-muted/60 border border-border/80 text-foreground font-mono text-xs flex items-center justify-center shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-mono bg-muted/40 border border-border/80 text-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${getRoleDot(user.role)}`} />
                          {formatRoleLabel(user.role)}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span title="Assigned Tasks" className="flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/70" />
                            {user._count.assignedTasks}
                          </span>
                          <span title="Time Logs" className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                            {user._count.timeEntries}
                          </span>
                          {user.role === "PROJECT_MANAGER" && (
                            <span title="Managed Projects" className="flex items-center gap-1 text-foreground font-semibold">
                              <Briefcase className="w-3.5 h-3.5" />
                              {user._count.managedProjects}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-medium tabular-nums text-foreground">
                        ₹{cost.toLocaleString("en-IN")}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-medium tabular-nums text-foreground">
                        ₹{billable.toLocaleString("en-IN")}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md font-medium bg-muted/40 border border-border/80 tabular-nums text-foreground">
                          {marginPct}%
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-foreground font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          title="Edit Costing & Role"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Configure User & Costing</h3>
                <p className="text-[11px] text-muted-foreground">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
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
                    onChange={(e) => setEditForm({ ...editForm, internalCostRate: parseFloat(e.target.value) || 0 })}
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
                    onChange={(e) => setEditForm({ ...editForm, billableRate: parseFloat(e.target.value) || 0 })}
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
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Active User Account (can authenticate into system)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
      )}
    </div>
  );
}

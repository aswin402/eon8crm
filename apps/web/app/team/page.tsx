"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatINR } from "@/lib/utils";
import { EditUserModal } from "@/components/team";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      logger.warn("DATA", "Failed to load users", err?.message);
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
      <div className="bg-card border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 px-4">Staff Member</TableHead>
              <TableHead className="py-3 px-4">Role</TableHead>
              <TableHead className="py-3 px-4 font-mono text-[11px]">Workload Metrics</TableHead>
              <TableHead className="py-3 px-4 text-right font-mono text-[11px]">Internal Cost (₹/hr)</TableHead>
              <TableHead className="py-3 px-4 text-right font-mono text-[11px]">Billable Rate (₹/hr)</TableHead>
              <TableHead className="py-3 px-4 text-right font-mono text-[11px]">Labor Margin</TableHead>
              <TableHead className="py-3 px-4 text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foreground" />
                  Loading team roster...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const cost = Number(user.internalCostRate);
                const billable = Number(user.billableRate);
                const marginPct = billable > 0 ? Math.round(((billable - cost) / billable) * 100) : 0;

                return (
                  <TableRow key={user.id} className="group">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 ring-1 ring-amber-500/20">
                          <AvatarFallback className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <Badge variant="outline" className="gap-1.5 font-mono text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${getRoleDot(user.role)}`} />
                        {formatRoleLabel(user.role)}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 px-4">
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
                            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                            {user._count.managedProjects}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right font-mono font-medium tabular-nums text-foreground">
                      {formatINR(cost)}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right font-mono font-medium tabular-nums text-foreground">
                      {formatINR(billable)}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-right">
                      <Badge
                        variant={marginPct >= 40 ? "success" : marginPct >= 20 ? "amber" : "outline"}
                        className="font-mono text-[11px] tabular-nums"
                      >
                        {marginPct}%
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 px-4 text-center">
                      {user.isActive ? (
                        <Badge variant="success" className="font-mono text-[10px] gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Edit Costing & Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSaveUser}
        selectedUser={selectedUser}
        editForm={editForm}
        setEditForm={setEditForm}
        isSaving={isSaving}
      />
    </div>
  );
}

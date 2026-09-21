"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Building2,
  DollarSign,
  RefreshCw,
  X,
  AlertCircle,
  CreditCard,
  PieChart,
  Download,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { formatINR, formatDate } from "@/lib/utils";
import { LogExpenseModal } from "@/components/expenses";
import { MetricCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { logger } from "@/lib/logger";

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: string | number;
  expenseDate: string;
  vendor: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

interface ExpenseSummary {
  totalAmount: number;
  count: number;
  byCategory: Array<{
    category: string;
    total: number;
    count: number;
  }>;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: "Software",
    description: "",
    amount: "",
    vendor: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    logger.info("DATA", `Fetching expenses (category=${activeCategory}, search="${searchQuery}")...`);
    try {
      const res = await api.get("/api/v1/expenses", {
        params: {
          category: activeCategory !== "ALL" ? activeCategory : undefined,
          search: searchQuery || undefined,
        },
      });
      const items = res.data.expenses || [];
      setExpenses(items);
      setSummary(res.data.summary || null);
      logger.info("DATA", `Loaded ${items.length} expense items`);
    } catch (err) {
      logger.error("DATA", "Failed to fetch expenses:", err);
      toast.error("Failed to load business expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);
    logger.info("FORM", "Logging new business expense", formData);

    try {
      await api.post("/api/v1/expenses", {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        vendor: formData.vendor || undefined,
        expenseDate: formData.expenseDate,
      });

      toast.success("Expense recorded successfully.");
      setFeedbackMsg({ type: "success", text: "Expense recorded successfully." });
      setIsModalOpen(false);
      setFormData({
        category: "Software",
        description: "",
        amount: "",
        vendor: "",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      fetchExpenses();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to record expense.";
      logger.error("FORM", "Expense creation error:", err);
      toast.error(errorMsg);
      setFeedbackMsg({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteExpense = async () => {
    if (!deleteTargetId) return;

    try {
      logger.info("DATA", `Deleting expense record ${deleteTargetId}`);
      await api.delete(`/api/v1/expenses/${deleteTargetId}`);
      toast.success("Expense deleted successfully.");
      setFeedbackMsg({ type: "success", text: "Expense deleted." });
      setDeleteTargetId(null);
      fetchExpenses();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to delete expense.";
      logger.error("DATA", "Expense delete error:", err);
      toast.error(errorMsg);
      setFeedbackMsg({
        type: "error",
        text: errorMsg,
      });
    }
  };

  const getCategoryDot = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "salaries":
        return "bg-purple-500";
      case "software":
        return "bg-blue-500";
      case "rent":
        return "bg-amber-500";
      case "marketing":
        return "bg-rose-500";
      case "travel":
        return "bg-emerald-500";
      default:
        return "bg-zinc-400";
    }
  };

  const handleExportExpenses = async () => {
    try {
      const res = await api.get("/api/v1/expenses/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `operational_expenses_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Downloaded expenses export CSV.");
    } catch (err) {
      toast.error("Failed to download expenses export.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>Finance</span>
            <span>/</span>
            <span className="text-foreground">Overheads & Expenses</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Expense Logger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track operational overheads, payroll, cloud infra, and rent for net margin calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExpenses}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Feedback Message */}
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

      {/* KPI Overview Strip */}
      {isLoading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Total Overheads</span>
              <DollarSign className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatINR(summary?.totalAmount || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{summary?.count || 0} recorded items</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Core Salaries</span>
              <Building2 className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatINR(summary?.byCategory.find((c) => c.category === "Salaries")?.total || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Engineering & management</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Software & Cloud</span>
              <CreditCard className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatINR(summary?.byCategory.find((c) => c.category === "Software")?.total || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">SaaS licenses & AWS</p>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Infrastructure & Rent</span>
              <PieChart className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {formatINR(summary?.byCategory.find((c) => c.category === "Rent")?.total || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Workspace & facilities</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-card/50 border border-border/80 rounded-xl">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1">
          {["ALL", "Software", "Salaries", "Rent", "Marketing", "Travel"].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-foreground text-background shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payee, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
          />
        </form>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
        <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 font-mono text-[11px]">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Vendor / Payee</th>
                  <th className="py-2.5 px-4 text-right font-mono text-[11px]">Amount (₹)</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <Receipt className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                      No expenses recorded under this filter.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-muted-foreground tabular-nums">
                        {formatDate(exp.expenseDate)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-mono bg-muted/40 border border-border/80 text-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${getCategoryDot(exp.category)}`} />
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{exp.description}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{exp.vendor || "—"}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums text-foreground">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => setDeleteTargetId(exp.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      <LogExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpense}
        isSubmitting={isSubmitting}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete Expense Item"
        message="Are you sure you want to permanently delete this overhead expense record? This directly affects operating profit and net margin calculations."
        confirmText="Delete Record"
        variant="danger"
        onConfirm={executeDeleteExpense}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

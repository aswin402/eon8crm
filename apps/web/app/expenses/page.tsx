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

  const [formData, setFormData] = useState({
    category: "Software",
    description: "",
    amount: "",
    vendor: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/expenses", {
        params: {
          category: activeCategory !== "ALL" ? activeCategory : undefined,
          search: searchQuery || undefined,
        },
      });
      setExpenses(res.data.expenses || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
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

    try {
      await api.post("/api/v1/expenses", {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        vendor: formData.vendor || undefined,
        expenseDate: formData.expenseDate,
      });

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
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to record expense.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    try {
      await api.delete(`/api/v1/expenses/${id}`);
      setFeedbackMsg({ type: "success", text: "Expense deleted." });
      fetchExpenses();
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to delete expense.",
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Overheads</span>
            <DollarSign className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            ₹{(summary?.totalAmount || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{summary?.count || 0} recorded items</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Core Salaries</span>
            <Building2 className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            ₹{(summary?.byCategory.find((c) => c.category === "Salaries")?.total || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Engineering & management</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Software & Cloud</span>
            <CreditCard className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            ₹{(summary?.byCategory.find((c) => c.category === "Software")?.total || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">SaaS licenses & AWS</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Rent & Facilities</span>
            <PieChart className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            ₹{(summary?.byCategory.find((c) => c.category === "Rent")?.total || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Office lease expenses</p>
        </div>
      </div>

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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foreground" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
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
                      {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
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

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Log Operational Expense</h3>
                <p className="text-[11px] text-muted-foreground">Record overhead costs for net margin calculations</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
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
                  onClick={() => setIsModalOpen(false)}
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
      )}
    </div>
  );
}

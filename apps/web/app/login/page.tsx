"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Shield,
  Users2,
  Briefcase,
  DollarSign,
  Code2,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

const DEMO_ACCOUNTS = [
  {
    role: "SUPER_ADMIN",
    name: "Aswin",
    email: "superadmin@eon8crm.internal",
    badge: "Super Admin",
    description: "Unrestricted master access",
  },
  {
    role: "ADMIN",
    name: "Devi",
    email: "admin@eon8crm.internal",
    badge: "Operations",
    description: "Projects & team management",
  },
  {
    role: "SALES",
    name: "Rahul Verma",
    email: "sales@eon8crm.internal",
    badge: "Sales Pipeline",
    description: "Leads, deals & conversion",
  },
  {
    role: "PROJECT_MANAGER",
    name: "Priya Sharma",
    email: "pm@eon8crm.internal",
    badge: "Project Lead",
    description: "Milestones & deliverables",
  },
  {
    role: "EMPLOYEE",
    name: "Karthik Raja",
    email: "dev@eon8crm.internal",
    badge: "Developer",
    description: "Task execution & time logs",
  },
  {
    role: "FINANCE",
    name: "Anand Sundaram",
    email: "finance@eon8crm.internal",
    badge: "Finance Officer",
    description: "GST Invoices & collections",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("superadmin@eon8crm.internal");
  const [password, setPassword] = useState("Password@123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, targetEmail?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const loginEmail = targetEmail || email;

    try {
      logger.info("AUTH", `Initiating sign-in for ${loginEmail}`);
      const res = await api.post("/api/v1/auth/login", {
        email: loginEmail,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("eon8_token", res.data.token);
        const userName = res.data.user?.name || loginEmail;
        const role = res.data.user?.role || "USER";
        logger.info("AUTH", `Signed in successfully: ${userName} [${role}]`);
        toast.success(`Welcome back, ${userName}! Role: ${role}`, "Authenticated");
        setTimeout(() => {
          window.location.href = "/";
        }, 300);
      }
    } catch (err: any) {
      const serverError = err.response?.data?.error;
      const networkError = err.message ? `Connection Error (${err.message})` : "Unable to reach API server.";
      const finalMsg = serverError || (err.response ? "Invalid credentials. Please verify your email and password." : networkError);

      logger.error("AUTH", `Sign-in failed for ${loginEmail}: ${finalMsg}`, err);
      setErrorMsg(finalMsg);
      toast.error(finalMsg, "Sign In Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword("Password@123");
    handleLogin(undefined, acc.email);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-foreground text-background font-mono font-bold text-sm mb-2 shadow-xs">
            E8
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to EON8 CRM
          </h1>
          <p className="text-xs text-muted-foreground">
            Operating System for Sales, Delivery & Financial Control
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-xs p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eon8crm.internal"
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border rounded-md text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border rounded-md text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring font-mono text-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 bg-foreground hover:bg-foreground/90 text-background font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>{isLoading ? "Signing in..." : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
              1-Click Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc)}
                  disabled={isLoading}
                  className="p-2 rounded-md border border-border bg-muted/30 hover:bg-muted text-left transition-colors cursor-pointer group disabled:opacity-50"
                >
                  <p className="text-[11px] font-medium text-foreground leading-tight group-hover:underline">
                    {acc.badge}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    {acc.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground">
          Protected by EON8 Enterprise RBAC & JWT Guard.
        </p>
      </div>
    </div>
  );
}

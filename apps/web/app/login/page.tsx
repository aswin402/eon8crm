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
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { Badge } from "@/components/ui/badge";

const DEMO_ACCOUNTS = [
  {
    role: "SUPER_ADMIN",
    name: "Aswin",
    email: "superadmin@eon8crm.internal",
    badge: "Super Admin",
    variant: "amber" as const,
    description: "Unrestricted master access",
  },
  {
    role: "ADMIN",
    name: "Devi",
    email: "admin@eon8crm.internal",
    badge: "Operations",
    variant: "secondary" as const,
    description: "Projects & team management",
  },
  {
    role: "SALES",
    name: "Rahul Verma",
    email: "sales@eon8crm.internal",
    badge: "Sales Pipeline",
    variant: "info" as const,
    description: "Leads, deals & conversion",
  },
  {
    role: "PROJECT_MANAGER",
    name: "Priya Sharma",
    email: "pm@eon8crm.internal",
    badge: "Project Lead",
    variant: "secondary" as const,
    description: "Milestones & deliverables",
  },
  {
    role: "EMPLOYEE",
    name: "Karthik Raja",
    email: "dev@eon8crm.internal",
    badge: "Developer",
    variant: "outline" as const,
    description: "Task execution & time logs",
  },
  {
    role: "FINANCE",
    name: "Anand Sundaram",
    email: "finance@eon8crm.internal",
    badge: "Finance Officer",
    variant: "success" as const,
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
    <div className="relative min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 overflow-hidden">
      {/* Ambient Amber Lighting Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-mono font-black text-base mb-1 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/40">
            E8
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                EON8 CRM
              </h1>
              <Badge variant="amber" className="text-[10px] px-1.5 py-0 font-mono font-semibold">
                ENTERPRISE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Precision OS for Indian Agency & Professional Services
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-surface border border-amber-500/20 dark:border-amber-500/25 rounded-2xl shadow-xl shadow-amber-500/5 p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eon8crm.internal"
                  className="w-full pl-9 pr-3 py-2 bg-muted/40 dark:bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 text-xs transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-muted/40 dark:bg-muted/20 border border-border rounded-lg text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 font-mono text-xs transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Workspace"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="pt-4 border-t border-border/80 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span className="uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                1-Click Demo Accounts
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">Pre-configured</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc)}
                  disabled={isLoading}
                  className="p-2.5 rounded-lg border border-border/70 bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/30 text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-semibold text-foreground leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {acc.badge}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    {acc.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-amber-500/70" />
          <span>Protected by EON8 Enterprise RBAC & JWT Guard</span>
        </p>
      </div>
    </div>
  );
}

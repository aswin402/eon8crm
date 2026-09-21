"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Users2,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  CreditCard,
  Receipt,
  ScrollText,
  Headphones,
  FolderLock,
  Calendar,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut,
  Command,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Leads Pipeline", href: "/leads", icon: Kanban, badge: "Active", allowedRoles: ["SUPER_ADMIN", "ADMIN", "SALES", "PROJECT_MANAGER"] },
      { name: "Client 360°", href: "/clients", icon: Users2, allowedRoles: ["SUPER_ADMIN", "ADMIN", "SALES", "PROJECT_MANAGER", "FINANCE"] },
      { name: "Projects", href: "/projects", icon: Briefcase },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Time Tracking", href: "/time", icon: Clock },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Quotations", href: "/quotations", icon: ScrollText, allowedRoles: ["SUPER_ADMIN", "ADMIN", "SALES", "PROJECT_MANAGER", "FINANCE"] },
      { name: "Invoices", href: "/invoices", icon: FileText, allowedRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "PROJECT_MANAGER"] },
      { name: "Payments", href: "/payments", icon: CreditCard, allowedRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
      { name: "Expenses", href: "/expenses", icon: Receipt, allowedRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "PROJECT_MANAGER"] },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Support Tickets", href: "/tickets", icon: Headphones },
      { name: "Documents", href: "/documents", icon: FolderLock, allowedRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE", "PROJECT_MANAGER", "SALES"] },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Analytics & Reports", href: "/analytics", icon: BarChart3, allowedRoles: ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE"] },
      { name: "Team & RBAC", href: "/team", icon: ShieldAlert, allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
      { name: "Settings", href: "/settings", icon: Settings, allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    api
      .get("/api/v1/auth/me")
      .then((res) => {
        if (res.data.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
          localStorage.removeItem("eon8_token");
          window.location.href = "/login";
        }
      });
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      logger.info("AUTH", "User confirmed logout");
      await api.post("/api/v1/auth/logout").catch(() => {});
      toast.info("You have been signed out.", "Session Closed");
      if (typeof window !== "undefined") {
        localStorage.removeItem("eon8_token");
        window.location.href = "/login";
      }
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <aside className="w-60 h-screen bg-card border-r border-border flex flex-col shrink-0 select-none">
      {/* Brand Header - Amber Luxury */}
      <div className="h-14 px-4 border-b border-border/80 flex items-center justify-between bg-muted/15">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-mono font-bold text-xs shadow-xs amber-glow group-hover:scale-105 transition-transform">
            E8
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-amber-500 transition-colors">
              EON8
            </span>
            <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25">
              CRM
            </span>
          </div>
        </Link>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.allowedRoles) return true;
            if (!currentUser) return true; // Show until profile loads
            if (currentUser.role === "SUPER_ADMIN") return true;
            return item.allowedRoles.includes(currentUser.role);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              <p className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 font-semibold">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-amber-500/12 text-amber-600 dark:text-amber-400 font-semibold border-l-2 border-amber-500 rounded-l-none shadow-2xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded ${
                            isActive
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-2 border-t border-border/80 bg-muted/10">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60">
          <Link href="/team" className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 group">
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold truncate text-foreground leading-none group-hover:text-amber-500 transition-colors">
                {currentUser?.name || "Staff"}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate mt-1">
                {currentUser?.role || "EMPLOYEE"}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign out"
            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out Confirmation"
        description="Are you sure you want to end your current session? You will need to sign in again to access EON8 CRM."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={confirmLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}

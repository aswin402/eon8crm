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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("eon8_token");
      window.location.href = "/login";
    }
  };

  return (
    <aside className="w-60 h-screen bg-card border-r border-border flex flex-col shrink-0 select-none">
      {/* Brand Header - Minimal Monochromatic */}
      <div className="h-13 px-4 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs">
            E8
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-foreground">
              EON8
            </span>
            <span className="text-[10px] font-mono text-muted-foreground px-1 py-0.2 rounded bg-muted">
              CRM
            </span>
          </div>
        </Link>
        <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
              <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
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
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded text-muted-foreground ${
                            isActive ? "bg-background border border-border" : "bg-muted"
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

      {/* User Footer - Sleek Monochromatic */}
      <div className="p-2 border-t border-border bg-card">
        <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50 transition-colors">
          <Link href="/team" className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
            <div className="w-6 h-6 rounded-md bg-muted border border-border text-foreground font-mono text-[11px] font-medium flex items-center justify-center shrink-0">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-medium truncate text-foreground leading-none">
                {currentUser?.name || "Staff"}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                {currentUser?.role || "EMPLOYEE"}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

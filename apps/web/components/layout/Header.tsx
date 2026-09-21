"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Plus,
  ChevronRight,
  Command as CommandIcon,
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
  X,
  ArrowRight,
  LogOut,
  User,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TimerDock } from "./TimerDock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface QuickSearchResult {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ElementType;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Command palette state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Quick Action menu state
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const quickActionRef = useRef<HTMLDivElement>(null);

  // Notifications popover state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [alertsData, setAlertsData] = useState<{
    unreadCount: number;
    alerts: Array<{
      id: string;
      type: "danger" | "warning" | "info" | "neutral";
      title: string;
      description: string;
      href: string;
      timestamp: string;
    }>;
    systemHealthy: boolean;
  }>({ unreadCount: 0, alerts: [], systemHealthy: true });

  const fetchAlerts = () => {
    api
      .get("/api/v1/analytics/alerts")
      .then((res) => {
        if (res.data) setAlertsData(res.data);
      })
      .catch(() => {});
  };

  // User Profile popover state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Current user state
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api
      .get("/api/v1/auth/me")
      .then((res) => {
        if (res.data.user) setUser(res.data.user);
      })
      .catch((err) => {
        if (err.response?.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
          localStorage.removeItem("eon8_token");
          window.location.href = "/login";
        }
      });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) {
        setIsQuickActionOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setIsQuickActionOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derive readable breadcrumb from pathname
  const getBreadcrumbTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/leads")) return "Leads Pipeline";
    if (pathname.startsWith("/clients/")) return "Client 360° Profile";
    if (pathname.startsWith("/clients")) return "Client Accounts";
    if (pathname.startsWith("/projects")) return "Project Delivery";
    if (pathname.startsWith("/tasks")) return "Task Backlog";
    if (pathname.startsWith("/time")) return "Timesheet Studio";
    if (pathname.startsWith("/quotations")) return "Quotations & Estimates";
    if (pathname.startsWith("/invoices")) return "Invoices & GST";
    if (pathname.startsWith("/payments")) return "Payment Receipts";
    if (pathname.startsWith("/expenses")) return "Operational Expenses";
    if (pathname.startsWith("/tickets")) return "Support Helpdesk";
    if (pathname.startsWith("/documents")) return "Document Vault";
    if (pathname.startsWith("/calendar")) return "Operational Calendar";
    if (pathname.startsWith("/analytics")) return "Executive BI Analytics";
    if (pathname.startsWith("/team")) return "Team & RBAC Costing";
    if (pathname.startsWith("/settings")) return "Organization Settings";
    return "Workspace";
  };

  // Command palette search targets
  const commandItems: QuickSearchResult[] = [
    { id: "dash", title: "Executive Dashboard", category: "Navigation", href: "/", icon: LayoutDashboard },
    { id: "leads", title: "Leads & Deal Pipeline", category: "Navigation", href: "/leads", icon: Kanban },
    { id: "clients", title: "Client Accounts Directory", category: "Navigation", href: "/clients", icon: Users2 },
    { id: "projects", title: "Project Delivery & Margin", category: "Navigation", href: "/projects", icon: Briefcase },
    { id: "tasks", title: "Task Backlog & Sprints", category: "Navigation", href: "/tasks", icon: CheckSquare },
    { id: "time", title: "Timesheets & Work Logs", category: "Navigation", href: "/time", icon: Clock },
    { id: "quotations", title: "Quotations & Cost Estimates", category: "Navigation", href: "/quotations", icon: ScrollText },
    { id: "invoices", title: "Tax Invoices & GST", category: "Navigation", href: "/invoices", icon: FileText },
    { id: "payments", title: "Cleared Bank Payments", category: "Navigation", href: "/payments", icon: CreditCard },
    { id: "expenses", title: "Operational Overhead Logger", category: "Navigation", href: "/expenses", icon: Receipt },
    { id: "tickets", title: "Client Support Tickets", category: "Navigation", href: "/tickets", icon: Headphones },
    { id: "documents", title: "Legal & SOW Vault", category: "Navigation", href: "/documents", icon: FolderLock },
    { id: "calendar", title: "Master Operations Calendar", category: "Navigation", href: "/calendar", icon: Calendar },
    { id: "analytics", title: "Financial & Margins BI", category: "Navigation", href: "/analytics", icon: BarChart3 },
    { id: "team", title: "Team Roster & Labor Rates", category: "Navigation", href: "/team", icon: ShieldAlert },
    { id: "settings", title: "Organization Profile & GSTIN", category: "Navigation", href: "/settings", icon: Settings },
    { id: "new-lead", title: "Create New CRM Lead", category: "Quick Action", href: "/leads", icon: Plus },
    { id: "new-quotation", title: "Draft Proposal / Quotation", category: "Quick Action", href: "/quotations", icon: Plus },
    { id: "new-client", title: "Onboard Client Account", category: "Quick Action", href: "/clients", icon: Plus },
    { id: "new-invoice", title: "Draft Client Invoice", category: "Quick Action", href: "/invoices", icon: Plus },
    { id: "new-task", title: "Assign Project Task", category: "Quick Action", href: "/tasks", icon: Plus },
    { id: "log-exp", title: "Log Expense Receipt", category: "Quick Action", href: "/expenses", icon: Plus },
  ];

  const filteredCommandItems = commandItems.filter(
    (item) =>
      item.title.toLowerCase().includes(commandQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const handleSelectCommand = (href: string) => {
    setIsCommandOpen(false);
    setCommandQuery("");
    router.push(href);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      logger.info("AUTH", "User confirmed logout via header");
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
    <>
      <header className="h-12 px-4 sm:px-6 border-b border-border/80 bg-background/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
        {/* Left Section: Contextual Breadcrumb & Quick Search Trigger */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-xs">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              eon8
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[220px]">
              {getBreadcrumbTitle()}
            </span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-border/80" />

          {/* Minimal Search Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/80 hover:border-amber-500/40 rounded-lg text-xs transition-all group cursor-pointer shadow-2xs"
            title="Search records and actions (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
            <span className="text-xs text-muted-foreground">Search or jump to...</span>
            <kbd className="ml-3 px-1.5 py-0.5 text-[10px] font-mono bg-background/80 border border-border/80 rounded text-muted-foreground shadow-2xs group-hover:border-amber-500/30">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Stopwatch Dock, Quick Actions, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2">
          {/* Universal Stopwatch / Precision Timer Dock */}
          <TimerDock />

          {/* Quick Action Dropdown */}
          <div className="relative" ref={quickActionRef}>
            <button
              onClick={() => setIsQuickActionOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs hover:shadow-md hover:shadow-amber-500/20 active:translate-y-px cursor-pointer"
              title="Quick Create"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Action</span>
            </button>

            {isQuickActionOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider border-b border-border/60">
                  Quick Create
                </div>
                <Link
                  href="/leads"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Kanban className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>New Lead</span>
                </Link>
                <Link
                  href="/clients"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Users2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>New Client</span>
                </Link>
                <Link
                  href="/invoices"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted/50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Draft Invoice</span>
                </Link>
                <Link
                  href="/tasks"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted/50 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Assign Task</span>
                </Link>
                <Link
                  href="/expenses"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Log Expense</span>
                </Link>
              </div>
            )}
          </div>

          {/* Notifications Center */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                fetchAlerts();
              }}
              className="w-7 h-7 rounded-md border border-border/80 bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer relative"
              title="System Alerts & Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {alertsData.unreadCount > 0 ? (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] font-mono text-white flex items-center justify-center absolute -top-1.5 -right-1.5 font-bold shadow-2xs">
                  {alertsData.unreadCount}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-card border border-border/80 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Operational Alerts</span>
                    {alertsData.unreadCount > 0 && (
                      <span className="text-[10px] font-mono bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.2 rounded font-medium">
                        {alertsData.unreadCount} action{alertsData.unreadCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="space-y-2 mt-2.5 max-h-80 overflow-y-auto pr-0.5">
                  {alertsData.systemHealthy && (
                    <div className="p-2 rounded-md bg-muted/20 border border-border/60 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground text-[11px]">System Status Healthy</p>
                        <p className="text-[10px] text-muted-foreground">Postgres replication & Redis queue workers online.</p>
                      </div>
                    </div>
                  )}

                  {alertsData.alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={alert.href}
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-2 rounded-md hover:bg-muted/40 border border-border/60 flex items-start gap-2 transition-colors block group cursor-pointer"
                    >
                      {alert.type === "danger" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      ) : alert.type === "warning" ? (
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-[11px] group-hover:text-foreground transition-colors truncate">
                          {alert.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {alert.description}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </Link>
                  ))}

                  {alertsData.alerts.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground text-[11px]">
                      No outstanding alerts. All invoices and SLAs clear!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-7 h-7 rounded-md border border-border/80 bg-muted/40 hover:bg-muted/70 text-foreground font-mono text-xs flex items-center justify-center transition-colors cursor-pointer"
              title={user?.name || "Account Profile"}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-card border border-border/80 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="border-b border-border/60 pb-2.5">
                  <p className="font-medium text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">{user?.email || "user@eon8crm.internal"}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted/50 border border-border/60 text-muted-foreground">
                    {user?.role || "MEMBER"}
                  </span>
                </div>
                <div className="pt-2 space-y-1">
                  <Link
                    href="/team"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-foreground transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>RBAC & Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Organization Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global ⌘K Command Palette Modal */}
      {isCommandOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsCommandOpen(false)}
        >
          <div
            className="bg-card border border-border/80 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="px-4 py-3 border-b border-border/80 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to page..."
                value={commandQuery}
                onChange={(e) => {
                  setCommandQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground text-xs focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted/40 border border-border/80 rounded text-muted-foreground">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={() => setIsCommandOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close command palette"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
              {filteredCommandItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching commands or pages found.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredCommandItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectCommand(item.href)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors text-left cursor-pointer ${
                          idx === selectedIndex
                            ? "bg-muted/60 text-foreground"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <span>EON8 Unified Command</span>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}

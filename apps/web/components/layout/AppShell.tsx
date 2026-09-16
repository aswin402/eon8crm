"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Left-hand 4-tier Navigation Rail */}
      <Sidebar />

      {/* Right-hand Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Persistent Top Header with Universal Timer Dock */}
        <Header />

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}

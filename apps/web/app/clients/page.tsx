"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  Search,
  ChevronRight,
  Building,
  Plus,
  ArrowUpRight,
  Receipt,
  Briefcase,
} from "lucide-react";
import api from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClients = () => {
    setLoading(true);
    logger.info("DATA", `Fetching clients (search="${search}")...`);
    const query = search ? `?search=${search}` : "";
    api
      .get(`/api/v1/clients${query}`)
      .then((res) => {
        const list = res.data.clients || [];
        setClients(list);
        logger.info("DATA", `Loaded ${list.length} clients`);
      })
      .catch((err) => {
        logger.error("DATA", "Clients fetch error:", err);
        toast.error("Failed to load client organizations");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Accounts</span>
            <span>/</span>
            <span className="text-foreground">Client 360° Directory</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Client Organizations
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search client, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-2.5 py-1 bg-muted/40 border border-border rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-ring w-56 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : (
        <div className="rounded-lg bg-card border border-border shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="py-2.5 px-3 font-medium">Client Ref & Company</th>
                <th className="py-2.5 px-3 font-medium">Primary Contact</th>
                <th className="py-2.5 px-3 font-medium">GSTIN</th>
                <th className="py-2.5 px-3 font-medium text-right">Invoiced (INR)</th>
                <th className="py-2.5 px-3 font-medium text-right">Balance Due</th>
                <th className="py-2.5 px-3 font-medium text-center">Projects</th>
                <th className="py-2.5 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <div>
                      <p className="font-medium text-foreground">{c.companyName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.clientNumber}</p>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    <p className="text-foreground font-medium">{c.contactPerson}</p>
                    <p className="text-[11px]">{c.email}</p>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                    {c.gstin ? (
                      <span className="bg-muted px-1 py-0.5 rounded text-foreground font-medium">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">Unregistered</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground">
                    {formatINR(c.financials?.totalInvoiced || 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    <span
                      className={
                        (c.financials?.totalOutstanding || 0) > 0
                          ? "text-rose-600 dark:text-rose-400 font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {formatINR(c.financials?.totalOutstanding || 0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-xs text-foreground px-1.5 py-0.5 rounded bg-muted/60">
                      {c._count?.projects || 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      href={`/clients/${c.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-foreground transition-colors"
                    >
                      <span>360° View</span>
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                    No client accounts found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

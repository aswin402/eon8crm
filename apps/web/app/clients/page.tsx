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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Accounts</span>
            <span>/</span>
            <span className="text-foreground font-medium">Client 360° Directory</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mt-1 flex items-center gap-2.5">
            <Building className="w-5 h-5 text-muted-foreground" />
            <span>Client Organizations</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized registry of B2B client accounts, GST profiles, and consolidated ledger balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search client, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-muted/30 border border-border/80 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 w-64 text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : (
        <div className="rounded-xl bg-card border border-border/80 shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 px-4 font-medium">Client Ref & Company</TableHead>
                <TableHead className="py-3 px-4 font-medium">Primary Contact</TableHead>
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px]">GSTIN</TableHead>
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">Invoiced (INR)</TableHead>
                <TableHead className="py-3 px-4 font-medium font-mono text-[11px] text-right">Balance Due</TableHead>
                <TableHead className="py-3 px-4 font-medium text-center">Projects</TableHead>
                <TableHead className="py-3 px-4 font-medium text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} className="group cursor-pointer">
                  <TableCell className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {c.companyName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.clientNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-muted-foreground">
                    <p className="text-foreground font-medium text-xs">{c.contactPerson}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.email}</p>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-[11px]">
                    {c.gstin ? (
                      <span className="bg-muted/60 px-1.5 py-0.5 rounded text-foreground font-medium border border-border/60">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 italic">Unregistered</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-mono font-medium text-foreground tabular-nums">
                    {formatINR(c.financials?.totalInvoiced || 0)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                    {(c.financials?.totalOutstanding || 0) > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {formatINR(c.financials?.totalOutstanding || 0)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">₹0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                      {c._count?.projects || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <Link
                      href={`/clients/${c.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border/80 bg-background hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 text-foreground transition-all shadow-2xs"
                    >
                      <span>360° View</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                    No client accounts found matching your query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

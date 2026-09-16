"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FolderLock,
  FileText,
  Building2,
  Download,
  Search,
  RefreshCw,
  Shield,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  client: {
    id: string;
    clientNumber: string;
    companyName: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/v1/clients/documents/all");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.client.companyName.toLowerCase().includes(q) ||
      doc.mimeType.toLowerCase().includes(q)
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground">Legal & Client Documents</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Contract & Document Vault
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Encrypted client MSA agreements, non-disclosure agreements (NDAs), statements of work, and GST certificates.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-muted/20 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Security & Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Stored Contracts</span>
            <FolderLock className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight tabular-nums text-foreground">
            {documents.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Across all onboarded accounts</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Security & Encryption</span>
            <Shield className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-base font-semibold text-foreground font-mono">
            S3 Pre-signed & AES-256
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Zero public exposure policy</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Audit Trail Verification</span>
            <FileCheck className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 text-base font-semibold text-foreground font-mono">
            100% Signed SOWs
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Linked to Client 360 master view</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-2 bg-card/50 border border-border/80 rounded-xl">
        <span className="text-xs font-medium text-foreground px-2">
          Document Repository <span className="text-muted-foreground font-mono">({filteredDocs.length})</span>
        </span>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search document name, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border/80 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-foreground/40 transition-colors"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-card/60 border border-border/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-medium">
                <th className="py-2.5 px-4">Document Title</th>
                <th className="py-2.5 px-4">Client Organization</th>
                <th className="py-2.5 px-4 font-mono text-[11px]">Format</th>
                <th className="py-2.5 px-4 font-mono text-[11px]">File Size</th>
                <th className="py-2.5 px-4 font-mono text-[11px]">Upload Date</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foreground" />
                    Loading vault records...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FolderLock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    No documents uploaded yet. Documents are attached via Client 360 profile.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{doc.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      <Link
                        href={`/clients/${doc.client.id}`}
                        className="font-medium text-foreground hover:underline flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{doc.client.companyName}</span>
                      </Link>
                    </td>

                    <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">
                      {doc.mimeType}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-muted-foreground tabular-nums">
                      {formatFileSize(doc.fileSize)}
                    </td>

                    <td className="py-2.5 px-4 font-mono text-muted-foreground tabular-nums">
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground transition-colors font-medium text-[11px]"
                      >
                        <Download className="w-3 h-3 text-muted-foreground" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

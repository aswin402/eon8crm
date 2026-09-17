"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Landmark,
  ShieldCheck,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";

interface OrgSettings {
  legalName: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  stateCode: string;
  pan: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  complianceDeclaration: string;
}

const DEFAULT_SETTINGS: OrgSettings = {
  legalName: "EON8 TECHNOLOGIES PVT LTD",
  shortName: "EON8",
  address: "Plot No. 42, Guindy Industrial Estate, Guindy",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600032",
  gstin: "33AABCE1234F1Z5",
  stateCode: "33",
  pan: "AABCE1234F",
  email: "billing@eon8.io",
  phone: "+91 44 2250 1000",
  bankName: "HDFC Bank Ltd",
  accountNumber: "50200088991122",
  ifsc: "HDFC0001234",
  branch: "Guindy, Chennai",
  upiId: "eon8crm@hdfcbank",
  complianceDeclaration:
    "Certified that particulars given above are true and correct. Invoice generated electronically in compliance with Section 31 of CGST Act 2017.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [currentUser, setCurrentUser] = useState<{ role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "tax" | "banking">("general");

  const canEdit = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  useEffect(() => {
    // Load current user for RBAC
    api
      .get("/api/v1/auth/me")
      .then((res) => {
        if (res.data.user) setCurrentUser(res.data.user);
      })
      .catch(() => {});

    // Load organization settings
    api
      .get("/api/v1/settings/organization")
      .then((res) => {
        if (res.data.organization) {
          setSettings(res.data.organization);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || "Failed to load organization settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof OrgSettings, val: string) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("You must be an ADMIN or SUPER_ADMIN to modify organization profile.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/api/v1/settings/organization", settings);
      if (res.data.organization) {
        setSettings(res.data.organization);
      }
      toast.success("Organization profile & GST settings updated successfully.");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        (err.response?.data?.details
          ? "Validation error: Check GSTIN or PAN format"
          : "Failed to save settings");
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-foreground" />
        <span>Loading Organization Profile...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            <span>Management</span>
            <span>/</span>
            <span className="text-foreground">Settings & Identity</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mt-1">
            Organization Profile & Compliance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure legal entity details, statutory GSTIN credentials, and remittance instructions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 text-muted-foreground">
            {canEdit ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground font-medium">Write Access ({currentUser?.role})</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Read Only</span>
              </>
            )}
          </span>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/80 rounded-xl w-fit text-xs">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "general"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Legal Entity & Contact</span>
        </button>

        <button
          onClick={() => setActiveTab("tax")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "tax"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>GSTIN & Statutory Tax</span>
        </button>

        <button
          onClick={() => setActiveTab("banking")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === "banking"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Bank Remittance & UPI</span>
        </button>
      </div>

      {/* Main Grid: Form Left, Live Tax Invoice Canvas Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {activeTab === "general" && (
            <div className="p-6 rounded-xl border border-border/80 bg-card space-y-4 animate-in fade-in duration-100 shadow-xs">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Company Entity & Office Address</h3>
                <p className="text-[11px] text-muted-foreground">
                  Primary details rendered on all contracts, proposals, and client tax invoices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-foreground">Company Legal Name</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.legalName}
                    onChange={(e) => handleChange("legalName", e.target.value)}
                    placeholder="e.g. EON8 TECHNOLOGIES PVT LTD"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Brand / Short Name</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.shortName}
                    onChange={(e) => handleChange("shortName", e.target.value)}
                    placeholder="e.g. EON8"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Billing Email</label>
                  <input
                    type="email"
                    disabled={!canEdit}
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="e.g. billing@eon8.io"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-foreground">Official Telephone / Helpline</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="e.g. +91 44 2250 1000"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-foreground">Registered Street Address</label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    value={settings.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Plot No. 42, Guindy Industrial Estate, Guindy"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs resize-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">City</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Chennai"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">State</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">PIN Code</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.pincode}
                    onChange={(e) => handleChange("pincode", e.target.value)}
                    placeholder="600032"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div className="p-6 rounded-xl border border-border/80 bg-card space-y-4 animate-in fade-in duration-100 shadow-xs">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Indian Statutory GSTIN & Tax Framework</h3>
                <p className="text-[11px] text-muted-foreground">
                  Compliant with Section 31 CGST Act 2017 & Table 4 B2B GSTR-1 returns.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-foreground">Company GSTIN (15 Chars)</label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {settings.gstin.length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    disabled={!canEdit}
                    value={settings.gstin}
                    onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                    placeholder="33AABCE1234F1Z5"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">State Code (2 Digits)</label>
                  <input
                    type="text"
                    maxLength={2}
                    disabled={!canEdit}
                    value={settings.stateCode}
                    onChange={(e) => handleChange("stateCode", e.target.value)}
                    placeholder="33"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-foreground">Permanent Account Number (PAN)</label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {settings.pan.length}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={!canEdit}
                    value={settings.pan}
                    onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                    placeholder="AABCE1234F"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-foreground">Statutory Declaration Text</label>
                  <textarea
                    rows={3}
                    disabled={!canEdit}
                    value={settings.complianceDeclaration}
                    onChange={(e) => handleChange("complianceDeclaration", e.target.value)}
                    placeholder="Certified that particulars given above are true and correct..."
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs resize-none"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Prints verbatim at the footer of each issued GST tax invoice.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "banking" && (
            <div className="p-6 rounded-xl border border-border/80 bg-card space-y-4 animate-in fade-in duration-100 shadow-xs">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-semibold text-foreground">Bank Remittance & Settlement Account</h3>
                <p className="text-[11px] text-muted-foreground">
                  Appears on invoices to instruct clients for NEFT / RTGS / IMPS / UPI transfers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-medium text-foreground">Beneficiary Bank Name</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.bankName}
                    onChange={(e) => handleChange("bankName", e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Current Account Number</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.accountNumber}
                    onChange={(e) => handleChange("accountNumber", e.target.value)}
                    placeholder="50200088991122"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">IFSC Code (11 Chars)</label>
                  <input
                    type="text"
                    maxLength={11}
                    disabled={!canEdit}
                    value={settings.ifsc}
                    onChange={(e) => handleChange("ifsc", e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Branch Location</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.branch}
                    onChange={(e) => handleChange("branch", e.target.value)}
                    placeholder="Guindy, Chennai"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">UPI ID / VPA</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={settings.upiId}
                    onChange={(e) => handleChange("upiId", e.target.value)}
                    placeholder="eon8crm@hdfcbank"
                    className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/80 focus:outline-hidden focus:border-foreground/40 font-mono text-xs"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {canEdit && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Updating..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </form>

        {/* Right Preview Column: Live Tax Invoice Mockup */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              Live Invoice Canvas Preview
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 border border-border/60 text-muted-foreground">
              Auto-Sync
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-sm text-xs">
            {/* Mock Header */}
            <div className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded bg-foreground text-background font-mono text-xs font-bold flex items-center justify-center">
                  {settings.shortName.charAt(0) || "E"}
                </div>
                <p className="font-bold text-sm text-foreground tracking-tight">
                  {settings.legalName || "EON8 TECHNOLOGIES PVT LTD"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {settings.address || "Office Address"}, {settings.city} - {settings.pincode}
                <br />
                GSTIN:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {settings.gstin || "33AABCE1234F1Z5"}
                </span>{" "}
                (State: {settings.stateCode || "33"})
                <br />
                PAN: <span className="font-mono">{settings.pan || "AABCE1234F"}</span> • {settings.email}
              </p>
            </div>

            {/* Mock Bank Box */}
            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                BANK REMITTANCE DETAILS
              </p>
              <p className="font-semibold text-foreground text-xs">{settings.bankName}</p>
              <p className="text-[11px] font-mono text-muted-foreground leading-tight">
                A/C: {settings.accountNumber}
                <br />
                IFSC: {settings.ifsc} • {settings.branch}
                <br />
                UPI: {settings.upiId}
              </p>
            </div>

            {/* Mock Declaration */}
            <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground leading-relaxed font-mono">
              <p>{settings.complianceDeclaration}</p>
              <p className="font-semibold text-foreground mt-2">
                For {settings.legalName}
              </p>
              <p className="text-muted-foreground">Authorized Signatory</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Updates made here instantly propagate across all printable PDF invoices, client statements, and GSTR-1 Table 4 tax returns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

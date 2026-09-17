"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/toast";

interface ClientOption {
  id: string;
  companyName: string;
}

interface CreateTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ onClose, onSuccess }) => {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/clients").then((res) => {
      if (res.data.clients?.length > 0) {
        setClients(res.data.clients);
        setClientId(res.data.clients[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/tickets", {
        clientId,
        subject,
        description,
        priority,
      });
      onSuccess();
      toast.success("Support ticket opened successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Open Support Ticket</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define priority and SLA countdown target
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g. Database connection timeout in production"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Priority (Sets SLA Target) *</label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
              }
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            >
              <option value="LOW">Low (SLA: 48 Hours)</option>
              <option value="MEDIUM">Medium (SLA: 24 Hours)</option>
              <option value="HIGH">High (SLA: 8 Hours)</option>
              <option value="URGENT">Urgent (SLA: 4 Hours)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Detailed Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Explain the client issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border/80 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>

          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border/80 bg-background hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? "Opening..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Lock, PhoneCall, Calendar, Send, Clock, User, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

interface ActivityItem {
  id: string;
  type: string;
  content: string;
  isInternalOnly: boolean;
  createdAt: string;
  author?: {
    name: string;
    email: string;
  };
}

interface ChatterProps {
  leadId?: string;
  clientId?: string;
  initialActivities?: ActivityItem[];
}

export function Chatter({ leadId, clientId, initialActivities = [] }: ChatterProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [activeTab, setActiveTab] = useState<"note" | "message" | "call" | "activity">("note");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialActivities.length > 0) {
      setActivities(initialActivities);
    }
  }, [initialActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        type: activeTab === "note" ? "NOTE" : activeTab === "call" ? "CALL" : "EMAIL",
        content,
        isInternalOnly: activeTab === "note",
        leadId,
        clientId,
      };

      // Create optimistic activity item
      const optimisticActivity: ActivityItem = {
        id: "temp-" + Date.now(),
        type: payload.type,
        content,
        isInternalOnly: payload.isInternalOnly,
        createdAt: new Date().toISOString(),
        author: { name: "You", email: "current.user@eon8crm.internal" },
      };

      setActivities([optimisticActivity, ...activities]);
      setContent("");

      // Backend call if endpoint available
      await api.post("/api/v1/chatter", payload).catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs space-y-4">
      {/* Chatter Header & Navigation Tabs */}
      <div className="border-b border-border/80 px-4 pt-3 pb-2.5 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("note")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "note"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Staff Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("message")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "message"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3 h-3 text-foreground" />
            <span>Client Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("call")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "call"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PhoneCall className="w-3 h-3 text-emerald-500" />
            <span>Log Call</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-muted-foreground">Activity Stream</span>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-3">
        <div className="rounded-lg border border-border/80 bg-background p-2.5 transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeTab === "note"
                ? "Log an internal staff note (visible only to employees)..."
                : activeTab === "call"
                ? "Record client phone call summary and key action items..."
                : "Draft outbound client message or email log..."
            }
            rows={3}
            className="w-full text-xs bg-transparent border-none focus:outline-none resize-none placeholder:text-muted-foreground/60 text-foreground"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {activeTab === "note" && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[10px]">
                  <ShieldCheck className="w-3 h-3" /> Private Internal Note
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-1.5 px-3 py-1 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium rounded-md transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>Post</span>
            </button>
          </div>
        </div>
      </form>

      {/* Activity Timeline Stream */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Activity Log ({activities.length})
          </p>
        </div>

        <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-7 py-2">
              No activity logged yet. Add a note or call summary above.
            </p>
          ) : (
            activities.map((item) => {
              const isNote = item.type === "NOTE" || item.isInternalOnly;
              const isCall = item.type === "CALL";

              return (
                <div key={item.id} className="relative pl-7 group">
                  {/* Timeline Icon Marker */}
                  <div className="absolute left-1 top-1.5 w-4 h-4 rounded-full border border-border/80 flex items-center justify-center -translate-x-1/2 bg-card text-muted-foreground">
                    {isNote ? (
                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                    ) : isCall ? (
                      <PhoneCall className="w-2.5 h-2.5 text-emerald-500" />
                    ) : (
                      <Clock className="w-2.5 h-2.5 text-foreground" />
                    )}
                  </div>

                  {/* Activity Card */}
                  <div className="p-3 rounded-lg border border-border/80 bg-card/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {item.author?.name || "System"}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {new Date(item.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <p className="text-foreground leading-relaxed whitespace-pre-line text-xs">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

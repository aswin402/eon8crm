"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Lock,
  PhoneCall,
  Send,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  Smile,
  Paperclip,
  CheckCircle2,
  Filter,
} from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActivityItem {
  id: string;
  type: string;
  content: string;
  isInternalOnly: boolean;
  createdAt: string;
  reactions?: string[];
  author?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ChatterProps {
  leadId?: string;
  clientId?: string;
  projectId?: string;
  initialActivities?: ActivityItem[];
}

export function Chatter({
  leadId,
  clientId,
  projectId,
  initialActivities = [],
}: ChatterProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [activeTab, setActiveTab] = useState<"note" | "message" | "call">("note");
  const [filter, setFilter] = useState<"ALL" | "NOTE" | "MESSAGE" | "CALL">("ALL");
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
      const type = activeTab === "note" ? "NOTE" : activeTab === "call" ? "CALL" : "EMAIL";
      const payload = {
        type,
        content: content.trim(),
        isInternalOnly: activeTab === "note",
        leadId,
        clientId,
        projectId,
      };

      const optimisticActivity: ActivityItem = {
        id: "temp-" + Date.now(),
        type,
        content: content.trim(),
        isInternalOnly: payload.isInternalOnly,
        createdAt: new Date().toISOString(),
        reactions: [],
        author: { name: "You", email: "team@eon8crm.com" },
      };

      setActivities([optimisticActivity, ...activities]);
      setContent("");

      await api.post("/api/v1/chatter", payload).catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReaction = (itemId: string, emoji: string) => {
    setActivities((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const currentReactions = item.reactions || [];
        const exists = currentReactions.includes(emoji);
        return {
          ...item,
          reactions: exists
            ? currentReactions.filter((r) => r !== emoji)
            : [...currentReactions, emoji],
        };
      })
    );
  };

  const filteredActivities = activities.filter((act) => {
    if (filter === "ALL") return true;
    if (filter === "NOTE") return act.type === "NOTE" || act.isInternalOnly;
    if (filter === "CALL") return act.type === "CALL";
    if (filter === "MESSAGE") return act.type === "EMAIL" || act.type === "MESSAGE";
    return true;
  });

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden transition-all">
      {/* Top Header & Navigation */}
      <div className="border-b border-border/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("note")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "note"
                ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs font-semibold border border-amber-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Internal Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("message")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "message"
                ? "bg-background text-foreground shadow-2xs font-semibold border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            <span>Client Update</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("call")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === "call"
                ? "bg-background text-foreground shadow-2xs font-semibold border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            <span>Phone Log</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">Filter:</span>
          {(["ALL", "NOTE", "MESSAGE", "CALL"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                filter === mode
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {mode === "ALL" ? "All" : mode === "NOTE" ? "Notes" : mode === "MESSAGE" ? "Updates" : "Calls"}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Composer Input Box */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div
          className={`rounded-xl border transition-all p-3 bg-background/80 shadow-2xs focus-within:ring-2 focus-within:ring-ring/40 ${
            activeTab === "note"
              ? "border-amber-500/30 focus-within:border-amber-500/50"
              : "border-border/80 focus-within:border-primary/50"
          }`}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              activeTab === "note"
                ? "Add an internal staff note or mention @teammate (strictly private)..."
                : activeTab === "call"
                ? "Record client phone call highlights, action items, and next steps..."
                : "Share an update or email log visible to team and client..."
            }
            rows={3}
            className="w-full text-xs bg-transparent border-none focus:outline-none resize-none placeholder:text-muted-foreground/60 text-foreground leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              {activeTab === "note" ? (
                <Badge variant="amber" className="gap-1 text-[10px] py-0 px-2">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Team Only</span>
                </Badge>
              ) : activeTab === "call" ? (
                <Badge variant="success" className="gap-1 text-[10px] py-0 px-2">
                  <PhoneCall className="w-3 h-3" />
                  <span>Call Logged</span>
                </Badge>
              ) : (
                <Badge variant="info" className="gap-1 text-[10px] py-0 px-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>Public Update</span>
                </Badge>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              variant="amber"
              disabled={isSubmitting || !content.trim()}
              className="gap-1.5 px-3.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Posting..." : "Share Note"}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Activity Timeline Stream */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Timeline Feed ({filteredActivities.length})</span>
          </p>
        </div>

        <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/60">
              No chatter recorded yet. Post an internal note or call summary above.
            </div>
          ) : (
            filteredActivities.map((item) => {
              const isNote = item.type === "NOTE" || item.isInternalOnly;
              const isCall = item.type === "CALL";
              const authorInitials = item.author?.name
                ? item.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "EO";

              return (
                <div key={item.id} className="relative pl-9 group">
                  {/* Avatar Anchor */}
                  <div className="absolute left-1.5 top-2.5 -translate-x-1/2">
                    <Avatar size="sm" className="ring-2 ring-background">
                      <AvatarFallback className={isNote ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold" : "bg-primary/10 text-primary font-semibold"}>
                        {authorInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Card Content */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all space-y-2 shadow-2xs ${
                      isNote
                        ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30"
                        : "bg-card/70 border-border/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {item.author?.name || "Staff Member"}
                        </span>
                        {isNote && (
                          <Badge variant="amber" className="text-[9px] py-0 px-1.5">
                            Private Note
                          </Badge>
                        )}
                        {isCall && (
                          <Badge variant="success" className="text-[9px] py-0 px-1.5">
                            Call
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>

                    {/* Quick Reactions Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {["👍", "🎯", "⚡", "🔥"].map((emoji) => {
                          const count = (item.reactions || []).filter((r) => r === emoji).length;
                          const hasReacted = (item.reactions || []).includes(emoji);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleAddReaction(item.id, emoji)}
                              className={`px-1.5 py-0.5 rounded text-xs transition-all cursor-pointer ${
                                hasReacted
                                  ? "bg-amber-500/20 border border-amber-500/40 text-foreground scale-105"
                                  : "bg-muted/40 hover:bg-muted text-muted-foreground border border-transparent"
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span className="ml-1 text-[10px] font-mono font-medium">{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Logged</span>
                      </span>
                    </div>
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

export default Chatter;

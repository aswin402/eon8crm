"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Clock,
  ChevronDown,
  Check,
  CheckCircle2,
  Briefcase,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface ProjectOption {
  id: string;
  name: string;
}

export function TimerDock() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [description, setDescription] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Popover state
  const [isOpen, setIsOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch projects
  useEffect(() => {
    api
      .get("/api/v1/projects")
      .then((res) => {
        if (res.data.projects) {
          const list: ProjectOption[] = res.data.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
          }));
          setProjects(list);
          if (list.length > 0 && !projectId) {
            setProjectId(list[0].id);
          }
        }
      })
      .catch(() => {});

    // Check active timer on mount
    api
      .get("/api/v1/time/timer/active")
      .then((res) => {
        if (res.data.activeTimer) {
          setIsRunning(true);
          setProjectId(res.data.activeTimer.projectId);
          setDescription(res.data.activeTimer.description || "");
          const start = new Date(res.data.activeTimer.startTime).getTime();
          const elapsedSec = Math.floor((Date.now() - start) / 1000);
          setSeconds(Math.max(0, elapsedSec));
        }
      })
      .catch(() => {});
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ticker interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!projectId) return;
    try {
      await api.post("/api/v1/time/timer/start", {
        projectId,
        description: description || "Active client delivery",
      });
      setIsRunning(true);
      setStatusMessage("Timer started");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to start timer");
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.post("/api/v1/time/timer/stop", {
        description: description || "Active client delivery",
        isBillable: true,
      });
      setIsRunning(false);
      setSeconds(0);
      setStatusMessage(`Logged ${res.data.timeEntry?.durationMinutes || 0}m`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to stop timer");
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Navbar Trigger Button */}
      {isRunning ? (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-foreground text-xs font-mono transition-colors cursor-pointer"
          title="Active Project Timer (Click to view controls)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold tabular-nums tracking-tight">{formatTime(seconds)}</span>
          <span className="text-muted-foreground truncate max-w-[110px] hidden md:inline font-sans">
            {selectedProject?.name || "Tracking"}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleStop();
            }}
            className="p-1 rounded hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
            title="Stop timer and log entry"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
          </div>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer"
          title="Open billable time tracker"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Track Time</span>
          {statusMessage && (
            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              {statusMessage}
            </span>
          )}
        </button>
      )}

      {/* Custom Precision Popover (Replacing the native browser select) */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-76 bg-card border border-border/80 rounded-xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground" />
              <div>
                <h4 className="font-semibold text-foreground text-xs leading-none">Billable Time Tracker</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Logs hours for client billing & margins</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3 pt-3">
            {/* Custom Project Selector Dropdown */}
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                Active Client Project
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground text-xs font-medium text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {selectedProject ? selectedProject.name : "Select a project..."}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                </button>

                {/* Custom Options Menu (No OS blue highlight) */}
                {isProjectDropdownOpen && !isRunning && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border/80 rounded-lg shadow-lg py-1 z-60 animate-in fade-in zoom-in-95 duration-75">
                    {projects.length === 0 ? (
                      <div className="px-3 py-2 text-muted-foreground text-[11px]">
                        No active projects found.
                      </div>
                    ) : (
                      projects.map((p) => {
                        const isSelected = p.id === projectId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProjectId(p.id);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-muted/60 text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate pr-2">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-foreground shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Work Task Note / Description */}
            <div>
              <label className="block text-[11px] font-medium text-foreground mb-1">
                Task Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Backend API schema, UI review..."
                disabled={isRunning}
                className="w-full px-2.5 py-1.5 rounded-md border border-border/80 bg-muted/20 text-foreground text-xs placeholder:text-muted-foreground focus:outline-hidden focus:border-foreground/40 transition-colors disabled:opacity-60"
              />
            </div>

            {/* Timer Display & Action */}
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="font-mono text-base font-bold tabular-nums text-foreground">
                  {formatTime(seconds)}
                </span>
              </div>

              {isRunning ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop & Save</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!projectId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Timer</span>
                </button>
              )}
            </div>

            {statusMessage && (
              <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{statusMessage}</span>
              </p>
            )}

            {/* Link to Full Timesheet Studio */}
            <div className="pt-1 text-center">
              <Link
                href="/time"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <span>Open Timesheet Studio</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

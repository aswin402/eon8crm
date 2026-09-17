"use client";

import React from "react";
import { create } from "zustand";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().addToast({ type: "success", message, title }),
  error: (message: string, title?: string) =>
    useToastStore.getState().addToast({ type: "error", message, title }),
  info: (message: string, title?: string) =>
    useToastStore.getState().addToast({ type: "info", message, title }),
  warning: (message: string, title?: string) =>
    useToastStore.getState().addToast({ type: "warning", message, title }),
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl text-foreground text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {t.type === "info" && <Info className="w-4 h-4 text-sky-500" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {t.title && <p className="font-semibold text-foreground tracking-tight">{t.title}</p>}
              <p className="text-muted-foreground leading-relaxed break-words">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

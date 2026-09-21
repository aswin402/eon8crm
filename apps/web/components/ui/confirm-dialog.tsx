"use client";

import React from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose?: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const resolvedDescription = message || description || "";
  const resolvedConfirmLabel = confirmText || confirmLabel || "Confirm";
  const resolvedCancelLabel = cancelText || cancelLabel || "Cancel";
  const handleClose = onCancel || onClose || (() => {});

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
      button: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      button: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    info: {
      icon: <Info className="w-5 h-5 text-sky-500" />,
      button: "bg-foreground hover:bg-foreground/90 text-background",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      button: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${variantStyles.bg} shrink-0`}>
              {variantStyles.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {resolvedDescription}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${variantStyles.button}`}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? "Processing..." : resolvedConfirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

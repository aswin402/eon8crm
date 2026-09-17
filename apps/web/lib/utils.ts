import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard Indian Rupee (INR) Currency Formatter
 * Formats numbers into ₹XX,XX,XXX.XX standard notation
 */
export function formatINR(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
    return "₹0.00";
  }
  return `₹${Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Compact Indian Currency Formatter (Lakhs & Crores)
 * e.g. ₹5.50 L, ₹1.20 Cr
 */
export function formatCompactINR(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
    return "₹0";
  }
  const num = Number(val);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Standard Indian Date Formatter (e.g. 17 Sep 2026)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Standard Indian Date & Time Formatter (e.g. 17 Sep 2026, 02:30 PM)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hours and Minutes Formatter (e.g. 120 mins -> 2h 0m)
 */
export function formatHoursMinutes(mins: number | null | undefined): string {
  if (!mins || isNaN(mins)) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

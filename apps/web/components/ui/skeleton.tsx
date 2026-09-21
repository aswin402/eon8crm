"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-muted/40",
        className
      )}
      {...props}
    />
  );
}

/**
 * Metric/KPI card skeleton loader
 */
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-border/80 bg-card/60 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table loading skeleton
 */
export function TableSkeleton({
  rows = 5,
  cols = 5,
  columns,
}: {
  rows?: number;
  cols?: number;
  columns?: number;
}) {
  const columnCount = columns ?? cols;
  return (
    <div className="w-full rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
      {/* Table Header */}
      <div className="flex items-center gap-4 p-3.5 bg-muted/30 border-b border-border/80">
        {Array.from({ length: columnCount }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-3.5">
            {Array.from({ length: columnCount }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4 flex-1", c === 0 ? "w-1/3" : "")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Kanban board column skeleton
 */
export function KanbanColumnSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-14rem)]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-72 shrink-0 flex flex-col h-full bg-muted/20 border border-border/70 rounded-xl p-3 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-2.5 flex-1">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="p-3.5 rounded-lg border border-border/70 bg-card/80 space-y-2.5 shadow-2xs"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * List / Feed item skeleton
 */
export function ListSkeleton({ count = 4, items }: { count?: number; items?: number }) {
  const actualCount = items ?? count;
  return (
    <div className="space-y-2.5">
      {Array.from({ length: actualCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card/50"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;

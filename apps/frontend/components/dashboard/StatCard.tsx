"use client";

import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Sparkline, { sparkFromSeed } from "./Sparkline";

export default function StatCard({
  label,
  value,
  loading,
  statClassName = "stat-bounce",
  trendLabel,
  sparkSeed,
  icon,
}: {
  label: string;
  value: ReactNode;
  loading?: boolean;
  statClassName?: string;
  trendLabel?: string;
  sparkSeed: number;
  icon?: ReactNode;
}) {
  const spark = sparkFromSeed(sparkSeed);

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-indigo-500/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                {icon}
              </span>
            ) : null}
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {label}
            </span>
          </div>
          {loading ? (
            <Skeleton className="mt-4 h-9 w-28" />
          ) : (
            <div
              className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950 ${statClassName}`}
            >
              {value}
            </div>
          )}
          {trendLabel && !loading ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">{trendLabel}</p>
          ) : null}
        </div>
        <div className="hidden w-[120px] shrink-0 sm:block">
          <Sparkline values={spark} className="h-9 w-full" />
        </div>
      </div>
    </Card>
  );
}

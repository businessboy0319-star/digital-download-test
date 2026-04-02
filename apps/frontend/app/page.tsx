"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Database, Package, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import PageEnter from "@/components/PageEnter";
import { getDashboard } from "@/services/api";
import AnimatedTitle from "@/components/AnimatedTitle";
import StatCard from "@/components/dashboard/StatCard";
import Button from "@/components/ui/Button";

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function CatalogHealthRing({ pct }: { pct: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - clamped / 100);

  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-zinc-200"
        strokeWidth="10"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-indigo-600"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalAssets: 0,
    totalImports: 0,
  });
  const [recent, setRecent] = useState<
    Array<{ ddd_id: string; title: string; created_at: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDashboard();
        if (cancelled) return;
        setStats(res.stats);
        setRecent(res.recentProducts);
      } catch (err) {
        if (cancelled) return;
        setStats({ totalProducts: 0, totalAssets: 0, totalImports: 0 });
        setRecent([]);
        const msg = err instanceof Error ? err.message : "Failed to fetch backend API";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const healthPct = useMemo(() => {
    const { totalProducts, totalAssets } = stats;
    if (totalProducts <= 0) return 0;
    // Target ~3 linked assets per product as “fully stocked”
    const ratio = totalAssets / (totalProducts * 3);
    return Math.round(Math.min(1, ratio) * 100);
  }, [stats]);

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
            <AnimatedTitle text="Dashboard" className="inline-block" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Overview of catalog size, asset coverage, and recent imports — tuned
            for a quick milestone walkthrough.
          </p>
        </div>

        {error ? (
          <Card className="mb-6 border-amber-200 bg-amber-50/60 p-6">
            <div className="text-sm font-semibold text-amber-900">
              Backend not reachable
            </div>
            <div className="mt-1 text-sm text-amber-900/90">
              This page loads admin data from your backend API. Fix the backend
              URL/port or start the backend server.
            </div>
            <div className="mt-3 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-900/90">
              {error}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition-colors bg-zinc-950 text-white hover:bg-zinc-900"
              >
                Open Milestone 3 Demo
              </Link>
            </div>
          </Card>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard
            label="Total products"
            sparkSeed={stats.totalProducts + 11}
            loading={loading}
            statClassName="stat-bounce"
            trendLabel="Unique DDD catalog entries"
            icon={<Package className="h-4 w-4" strokeWidth={2} />}
            value={stats.totalProducts}
          />
          <StatCard
            label="Total assets"
            sparkSeed={stats.totalAssets + 3}
            loading={loading}
            statClassName="stat-bounce stat-bounce-delay-1"
            trendLabel="ZIP + preview files linked"
            icon={<Database className="h-4 w-4" strokeWidth={2} />}
            value={stats.totalAssets}
          />
          <StatCard
            label="CSV imports"
            sparkSeed={stats.totalImports + 29}
            loading={loading}
            statClassName="stat-bounce stat-bounce-delay-2"
            trendLabel="Ingest jobs recorded"
            icon={<Activity className="h-4 w-4" strokeWidth={2} />}
            value={stats.totalImports}
          />
        </div>

        <div className="mb-6">
          <Card className="relative overflow-hidden border-indigo-100/90 bg-gradient-to-br from-indigo-50/80 via-white to-white p-6 shadow-[0_20px_60px_-40px_rgba(79,70,229,0.45)]">
            <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                {loading ? (
                  <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
                ) : (
                  <CatalogHealthRing pct={healthPct} />
                )}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Catalog health
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-zinc-950">
                    Asset coverage vs. products
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-zinc-600">
                    {loading
                      ? "Loading catalog metrics…"
                      : stats.totalProducts === 0
                        ? "Add products via CSV import to start tracking coverage."
                        : "Score assumes ~3 assets per product (ZIP + previews). Higher is better."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-zinc-200/90 bg-white/90 p-4 text-sm shadow-sm md:min-w-[220px]">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-zinc-500">Coverage score</span>
                  <span className="text-lg font-semibold tabular-nums text-zinc-950">
                    {loading ? "—" : `${healthPct}%`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
                    style={{
                      width: loading ? "0%" : `${healthPct}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {loading
                    ? "…"
                    : `${stats.totalAssets} assets across ${stats.totalProducts} products`}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Recent activity
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Recently imported products
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                Latest {recent.length}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : recent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-5 text-sm text-zinc-600">
                  No imports yet. Open{" "}
                  <span className="font-semibold text-zinc-900">CSV Import</span>{" "}
                  to run an ingestion.
                </div>
              ) : (
                recent.map((p) => (
                  <div
                    key={p.ddd_id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">
                        {p.title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        ID: <span className="font-mono">{p.ddd_id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-zinc-600">
                        Imported
                      </div>
                      <div className="mt-1 text-sm text-zinc-950">
                        {p.created_at ? formatShortDate(p.created_at) : "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-zinc-950">Demo notes</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-600">
              <div>
                • CSV import updates product rows and links ZIP + preview assets.
              </div>
              <div>
                • Products page verifies thumbnails and filenames before download.
              </div>
              <div>
                • This admin shell stays stable as you extend APIs and webhooks.
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-100/90 bg-indigo-50/50 p-4">
              <div className="text-xs font-semibold text-indigo-900">
                Suggested demo path
              </div>
              <div className="mt-2 text-sm text-zinc-800">
                CSV Import → Products list → open a product → confirm ZIP +
                previews.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageEnter>
  );
}

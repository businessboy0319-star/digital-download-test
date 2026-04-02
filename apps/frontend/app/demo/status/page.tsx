"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageEnter from "@/components/PageEnter";
import { getAdminPreflight, getAuthMe } from "@/services/api";
import { useDemoSession } from "@/context/DemoSessionContext";

function isOk(value: unknown): value is { ok: true } {
  return Boolean(value && typeof value === "object" && (value as { ok?: unknown }).ok === true);
}

function StatusPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
          : "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
      }
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}

export default function DemoStatusPage() {
  const router = useRouter();
  const { isReady, accessToken, email, refresh } = useDemoSession();

  const [loading, setLoading] = useState(true);
  const [preflight, setPreflight] = useState<Awaited<
    ReturnType<typeof getAdminPreflight>
  > | null>(null);
  const [me, setMe] = useState<Awaited<ReturnType<typeof getAuthMe>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const canCheckMe = useMemo(() => Boolean(accessToken), [accessToken]);

  async function run() {
    setError(null);
    setLoading(true);
    try {
      const pf = await getAdminPreflight();
      setPreflight(pf);
      if (accessToken) {
        const m = await getAuthMe(accessToken);
        setMe(m);
      } else {
        setMe(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const profileLinked = me?.internalUserId ? true : false;
  const pfOk = Boolean(preflight?.ok);

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
              System check
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Simple “green/red” checks to confirm downloads will work.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/demo");
                }
              }}
              disabled={!isReady}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await refresh();
                await run();
              }}
              disabled={!isReady}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="mb-4 border-amber-200 bg-amber-50/60 p-5">
            <div className="text-sm font-semibold text-amber-900">Error</div>
            <div className="mt-1 text-sm text-amber-900/90">{error}</div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm font-semibold text-zinc-950">
              System health
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              {loading
                ? "Checking configuration…"
                : pfOk
                  ? "All checks passed. Downloads are ready."
                  : "Some checks failed. Downloads may not work until fixed."}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill ok={pfOk} label="overall" />
              <StatusPill ok={isOk(preflight?.database)} label="database" />
              <StatusPill
                ok={isOk(preflight?.downloadPipeline)}
                label="downloads"
              />
              <StatusPill ok={isOk(preflight?.storage)} label="storage" />
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              <div className="text-xs font-semibold text-zinc-600">
                What this means
              </div>
              <div className="mt-2 space-y-1 text-sm text-zinc-700">
                <div>• Green = clients can download files.</div>
                <div>• Red = a config issue (we can fix it quickly).</div>
              </div>
            </div>

            <details className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
              <summary className="cursor-pointer text-xs font-semibold text-zinc-700">
                Advanced details (JSON)
              </summary>
              <pre className="mt-3 max-h-[220px] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
                {loading ? "Loading…" : JSON.stringify(preflight, null, 2)}
              </pre>
            </details>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Account linking
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Confirms your login email matches your purchase profile (so
                  you can see your downloads).
                </div>
              </div>
              <StatusPill ok={profileLinked} label="linked" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">
                  Signed in
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {isReady ? (email ?? "Not signed in") : "Loading…"}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {canCheckMe
                    ? "You’re signed in. We can verify the purchase profile."
                    : "Sign in first to verify your purchase profile."}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">
                  Linked profile
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {profileLinked ? "Yes" : "Not yet"}
                </div>
                {!profileLinked ? (
                  <div className="mt-3 text-xs text-amber-700">
                    If not linked: sign in with the same email you used at
                    checkout, or we’ll add a test purchase/entitlement for this
                    account.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-600">
                Advanced details
              </div>
              <details className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4">
                <summary className="cursor-pointer text-xs font-semibold text-zinc-700">
                  /auth/me response (JSON)
                </summary>
                <pre className="mt-3 max-h-[220px] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
                  {loading ? "Loading…" : JSON.stringify(me, null, 2)}
                </pre>
              </details>
            </div>
          </Card>
        </div>
      </div>
    </PageEnter>
  );
}


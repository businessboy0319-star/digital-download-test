"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ShieldCheck,
  RefreshCw,
  Download,
  Loader2,
  Archive,
  LogOut,
  KeyRound,
  Mail,
} from "lucide-react";
import Card from "@/components/ui/Card";
import PageEnter from "@/components/PageEnter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  createBatchDownloadJob,
  getAdminPreflight,
  getAuthMe,
  getBatchDownloadJob,
  getProductDownloadUrl,
  listMyDownloads,
} from "@/services/api";
import { useDemoSession } from "@/context/DemoSessionContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type StepId = "signin" | "system" | "downloads" | "batch";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800"
          : "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900"
      }
    >
      {ok ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : (
        <Circle className="h-4 w-4" aria-hidden />
      )}
      {label}
    </span>
  );
}

function isOk(value: unknown): value is { ok: true } {
  return Boolean(
    value && typeof value === "object" && (value as { ok?: unknown }).ok === true
  );
}

function StepTab({
  id,
  active,
  title,
  subtitle,
  state,
  onClick,
  disabled,
}: {
  id: StepId;
  active: boolean;
  title: string;
  subtitle: string;
  state: "done" | "ready" | "locked" | "attention";
  onClick: (id: StepId) => void;
  disabled?: boolean;
}) {
  const badge =
    state === "done"
      ? { label: "Done", ok: true }
      : state === "ready"
        ? { label: "Ready", ok: true }
        : state === "attention"
          ? { label: "Needs attention", ok: false }
          : { label: "Locked", ok: false };

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={disabled}
      className={[
        "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "border-indigo-200 bg-indigo-50/60"
          : "border-zinc-200 bg-white hover:bg-zinc-50/50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-zinc-950">{title}</div>
          <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>
        </div>
        <StatusPill ok={badge.ok} label={badge.label} />
      </div>
    </button>
  );
}

export default function DemoHomePage() {
  const { isReady, email, accessToken, signOut, refresh } = useDemoSession();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [linked, setLinked] = useState<boolean | null>(null);
  const [preflight, setPreflight] = useState<Awaited<
    ReturnType<typeof getAdminPreflight>
  > | null>(null);
  const [downloads, setDownloads] = useState<Awaited<
    ReturnType<typeof listMyDownloads>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedDddIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batch, setBatch] = useState<Awaited<
    ReturnType<typeof getBatchDownloadJob>
  > | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const [activeStep, setActiveStep] = useState<StepId>("signin");

  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPassword, setDraftPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const pf = await getAdminPreflight();
        if (!cancelled) setPreflight(pf);

        if (!accessToken) {
          if (!cancelled) {
            setLinked(null);
            setDownloads(null);
            setSelected({});
            setBatchJobId(null);
            setBatch(null);
          }
          return;
        }

        const me = await getAuthMe(accessToken);
        if (!cancelled) setLinked(Boolean(me.internalUserId));

        const d = await listMyDownloads(accessToken);
        if (!cancelled) {
          setDownloads(d);
          setSelected({});
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !batchJobId) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const res = await getBatchDownloadJob(accessToken, batchJobId);
        if (cancelled) return;
        setBatch(res);
        if (res.job.status === "completed" || res.job.status === "failed") return;
        t = setTimeout(poll, 2000);
      } catch {
        if (cancelled) return;
        // ignore intermittent polling errors; user can refresh
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [accessToken, batchJobId]);

  const signedIn = Boolean(email && accessToken);
  const isLinked = linked === true;
  const hasDownloads = (downloads?.items?.length ?? 0) > 0;

  const pfOk = Boolean(preflight?.ok);
  const pfDb = isOk(preflight?.database);
  const pfDownloads = isOk(preflight?.downloadPipeline);
  const pfStorage = isOk(preflight?.storage);

  const stepState = useMemo(() => {
    const systemOk = pfOk;
    const systemNeedsAttention = !pfOk && preflight !== null;
    return {
      signin: signedIn ? "done" : "ready",
      system: systemOk ? "done" : systemNeedsAttention ? "attention" : "ready",
      downloads: !signedIn
        ? "locked"
        : !isLinked
          ? "attention"
          : hasDownloads
            ? "done"
            : "ready",
      batch: !signedIn || !isLinked || !hasDownloads ? "locked" : "ready",
    } satisfies Record<StepId, "done" | "ready" | "locked" | "attention">;
  }, [signedIn, isLinked, hasDownloads, pfOk, preflight]);

  async function handleLogin() {
    setLoginMessage(null);
    setLoginBusy(true);
    try {
      if (!supabase) {
        throw new Error(
          "Supabase login is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      if (loginMode === "password") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: draftEmail.trim(),
          password: draftPassword,
        });
        if (err) throw err;
        setLoginMessage("Signed in. Loading your demo data…");
      } else {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: draftEmail.trim(),
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? window.location.origin + "/demo"
                : undefined,
          },
        });
        if (err) throw err;
        setLoginMessage("Magic link sent. Check your inbox (and spam).");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoginMessage(msg);
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleDownload(dddId: string) {
    if (!accessToken) return;
    setError(null);
    try {
      const res = await getProductDownloadUrl(accessToken, dddId);
      window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  async function handleCreateBatch() {
    if (!accessToken) return;
    setBatchBusy(true);
    setError(null);
    try {
      const created = await createBatchDownloadJob(accessToken, selectedDddIds);
      setBatchJobId(created.jobId);
      setBatch(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBatchBusy(false);
    }
  }

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Milestone 3 Demo
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-zinc-600">
              Steps at the top, details below — no page switching required.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await refresh();
                window.location.reload();
              }}
              disabled={!isReady}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Refresh
            </Button>
            {email ? (
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Sign out
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <Card className="mb-4 border-amber-200 bg-amber-50/60 p-6">
            <div className="text-base font-semibold text-amber-900">Notice</div>
            <div className="mt-1 text-base text-amber-900/90">{error}</div>
          </Card>
        ) : null}

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200/90 bg-indigo-50 text-indigo-700">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="text-base font-semibold text-zinc-950">
                  Process
                </div>
                <div className="mt-1 text-base text-zinc-600">
                  Select a step to see its details below.
                </div>
              </div>
            </div>
            <div className="text-sm text-zinc-600">
              {isReady ? (
                email ? (
                  <>
                    Signed in as{" "}
                    <span className="font-semibold text-zinc-900">{email}</span>
                  </>
                ) : (
                  "Not signed in"
                )
              ) : (
                "Checking session…"
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <StepTab
              id="signin"
              active={activeStep === "signin"}
              title="Step 1 — Sign in"
              subtitle="Access the demo with a test account."
              state={stepState.signin}
              onClick={setActiveStep}
            />
            <StepTab
              id="system"
              active={activeStep === "system"}
              title="Step 2 — System check"
              subtitle="Make sure downloads can run."
              state={stepState.system}
              onClick={setActiveStep}
            />
            <StepTab
              id="downloads"
              active={activeStep === "downloads"}
              title="Step 3 — Your downloads"
              subtitle="List items and download ZIPs."
              state={stepState.downloads}
              onClick={setActiveStep}
            />
            <StepTab
              id="batch"
              active={activeStep === "batch"}
              title="Step 4 — Batch ZIP"
              subtitle="Bundle multiple items into one ZIP."
              state={stepState.batch}
              onClick={setActiveStep}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
            {activeStep === "signin" ? (
              <div>
                <div className="text-lg font-semibold text-zinc-950">
                  Step 1 — Sign in
                </div>
                <div className="mt-2 text-base text-zinc-600">
                  Sign in with a test account. If you already signed in, you can
                  continue to the next step.
                </div>

                {signedIn ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                    <div className="text-base font-semibold text-emerald-900">
                      Signed in
                    </div>
                    <div className="mt-1 text-base text-emerald-900/90">
                      {email}
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          await signOut();
                          window.location.reload();
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden />
                        Sign out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                          <KeyRound className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <div className="text-base font-semibold text-zinc-950">
                            Login method
                          </div>
                          <div className="mt-1 text-base text-zinc-600">
                            Password is simplest. Magic link sends an email.
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <Button
                          type="button"
                          variant={loginMode === "password" ? "solid" : "outline"}
                          onClick={() => setLoginMode("password")}
                        >
                          Password
                        </Button>
                        <Button
                          type="button"
                          variant={loginMode === "magic" ? "solid" : "outline"}
                          onClick={() => setLoginMode("magic")}
                        >
                          Magic link
                        </Button>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="text-sm font-semibold text-zinc-700">
                            Email
                          </div>
                          <Input
                            value={draftEmail}
                            onChange={(e) => setDraftEmail(e.target.value)}
                            placeholder="you@example.com"
                          />
                        </div>

                        {loginMode === "password" ? (
                          <div>
                            <div className="text-sm font-semibold text-zinc-700">
                              Password
                            </div>
                            <Input
                              type="password"
                              value={draftPassword}
                              onChange={(e) => setDraftPassword(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button
                            onClick={handleLogin}
                            disabled={
                              loginBusy ||
                              !draftEmail.trim() ||
                              (loginMode === "password" && !draftPassword)
                            }
                          >
                            {loginBusy ? (
                              <>
                                <Loader2
                                  className="mr-2 h-4 w-4 animate-spin"
                                  aria-hidden
                                />
                                Working…
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" aria-hidden />
                                {loginMode === "password" ? "Sign in" : "Send link"}
                              </>
                            )}
                          </Button>
                        </div>

                        {loginMessage ? (
                          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-700">
                            {loginMessage}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                      <div className="text-base font-semibold text-zinc-950">
                        Current session
                      </div>
                      <div className="mt-2 text-base text-zinc-600">
                        Not signed in
                      </div>
                      <div className="mt-4 text-sm text-zinc-500">
                        If magic link doesn’t arrive, configure Supabase email
                        provider and redirect URLs for your localhost/staging URL.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {activeStep === "system" ? (
              <div>
                <div className="text-lg font-semibold text-zinc-950">
                  Step 2 — System check
                </div>
                <div className="mt-2 text-base text-zinc-600">
                  Green means the platform is ready. Red indicates a configuration
                  issue (fixable).
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusPill ok={pfOk} label="overall" />
                  <StatusPill ok={pfDb} label="database" />
                  <StatusPill ok={pfDownloads} label="downloads" />
                  <StatusPill ok={pfStorage} label="storage" />
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-base text-zinc-600">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Checking…
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5">
                    <div className="text-base font-semibold text-zinc-950">
                      What this means
                    </div>
                    <div className="mt-2 text-base text-zinc-700">
                      <div>• Green = clients can download files.</div>
                      <div>• Red = fix config (R2/env/migration).</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                    <div className="text-base font-semibold text-zinc-950">
                      Account linking
                    </div>
                    <div className="mt-2 text-base text-zinc-700">
                      {signedIn ? (
                        <>
                          Linked profile:{" "}
                          <span className="font-semibold">
                            {isLinked ? "Yes" : "Not yet"}
                          </span>
                        </>
                      ) : (
                        "Sign in to verify linking."
                      )}
                    </div>
                    {!signedIn ? null : !isLinked ? (
                      <div className="mt-2 text-sm text-amber-800">
                        If not linked, sign in with your checkout email or add a
                        demo entitlement for this account.
                      </div>
                    ) : null}
                  </div>
                </div>

                <details className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
                    Advanced details (JSON)
                  </summary>
                  <pre className="mt-3 max-h-[260px] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
                    {JSON.stringify(preflight, null, 2)}
                  </pre>
                </details>
              </div>
            ) : null}

            {activeStep === "downloads" ? (
              <div>
                <div className="text-lg font-semibold text-zinc-950">
                  Step 3 — Your downloads
                </div>
                <div className="mt-2 text-base text-zinc-600">
                  View items for this account and download ZIP files.
                </div>

                {!signedIn ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-base text-amber-900">
                    Please sign in first (Step 1).
                  </div>
                ) : !isLinked ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-base text-amber-900">
                    This account is not linked to a purchase profile yet. Use your
                    checkout email or add a demo entitlement.
                  </div>
                ) : loading ? (
                  <div className="mt-5 inline-flex items-center gap-2 text-base text-zinc-600">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading…
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {(downloads?.items ?? []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 p-6 text-base text-zinc-700">
                        No downloads found for this email.
                        <div className="mt-2 text-sm text-zinc-500">
                          Tip: sign in with the email used at checkout.
                        </div>
                      </div>
                    ) : (
                      (downloads?.items ?? []).map((item) => (
                        <div
                          key={item.productId}
                          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <div className="text-base font-semibold text-zinc-950">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm text-zinc-600">
                              ID: <span className="font-mono">{item.dddId}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                              <input
                                type="checkbox"
                                checked={Boolean(selected[item.dddId])}
                                onChange={(e) =>
                                  setSelected((prev) => ({
                                    ...prev,
                                    [item.dddId]: e.target.checked,
                                  }))
                                }
                              />
                              Add to bundle
                            </label>
                            <Button
                              variant="outline"
                              onClick={() => handleDownload(item.dddId)}
                            >
                              <Download className="mr-2 h-4 w-4" aria-hidden />
                              Download ZIP
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {activeStep === "batch" ? (
              <div>
                <div className="text-lg font-semibold text-zinc-950">
                  Step 4 — Batch ZIP
                </div>
                <div className="mt-2 text-base text-zinc-600">
                  Select items in Step 3, then create one bundle ZIP here.
                </div>

                {!signedIn || !isLinked ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-base text-amber-900">
                    Complete Steps 1–3 first.
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-zinc-950">
                          Selected items
                        </div>
                        <div className="mt-1 text-base text-zinc-600">
                          Selected: {selectedDddIds.length}
                        </div>
                      </div>
                      <Button
                        onClick={handleCreateBatch}
                        disabled={selectedDddIds.length === 0 || batchBusy}
                      >
                        {batchBusy ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                            Creating…
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4" aria-hidden />
                            Create bundle ZIP
                          </>
                        )}
                      </Button>
                    </div>

                    {batchJobId ? (
                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                        <div className="text-sm text-zinc-600">
                          Job: <span className="font-mono">{batchJobId}</span>
                        </div>
                        <div className="mt-1 text-base text-zinc-900">
                          Status:{" "}
                          <span className="font-semibold">
                            {batch?.job.status ?? "polling…"}
                          </span>
                        </div>
                        {batch?.job.status === "failed" ? (
                          <div className="mt-2 text-base text-rose-700">
                            {batch.job.error_message ?? "Job failed"}
                          </div>
                        ) : null}
                        {batch?.downloadUrl ? (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  batch.downloadUrl!,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              Download bundle.zip
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </PageEnter>
  );
}


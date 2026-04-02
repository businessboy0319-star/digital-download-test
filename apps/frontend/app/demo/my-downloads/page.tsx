"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Loader2,
  PackageOpen,
  RefreshCw,
  Archive,
  XCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table, {
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import PageEnter from "@/components/PageEnter";
import {
  createBatchDownloadJob,
  getAuthMe,
  getBatchDownloadJob,
  getProductDownloadUrl,
  listMyDownloads,
} from "@/services/api";
import { useDemoSession } from "@/context/DemoSessionContext";

type Row = Awaited<ReturnType<typeof listMyDownloads>>["items"][number];

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
  ) : (
    <XCircle className="h-4 w-4 text-rose-600" aria-hidden />
  );
}

export default function DemoMyDownloadsPage() {
  const router = useRouter();
  const { isReady, accessToken, email, signOut } = useDemoSession();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Awaited<ReturnType<typeof getAuthMe>> | null>(
    null
  );
  const [data, setData] = useState<Awaited<ReturnType<typeof listMyDownloads>> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<
    Awaited<ReturnType<typeof getBatchDownloadJob>> | null
  >(null);
  const [batchErr, setBatchErr] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const profileLinked = Boolean(me?.internalUserId);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      if (!accessToken) {
        setMe(null);
        setData(null);
        return;
      }
      const m = await getAuthMe(accessToken);
      const d = await listMyDownloads(accessToken);
      setMe(m);
      setData(d);
      setSelected({});
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, accessToken]);

  useEffect(() => {
    if (!accessToken || !batchJobId) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getBatchDownloadJob(accessToken, batchJobId);
        if (cancelled) return;
        setBatchStatus(res);
        if (res.job.status === "completed" || res.job.status === "failed") {
          return;
        }
        t = setTimeout(poll, 2000);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setBatchErr(msg);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [accessToken, batchJobId]);

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
    setBatchErr(null);
    setBatchBusy(true);
    try {
      const res = await createBatchDownloadJob(accessToken, selectedIds);
      setBatchJobId(res.jobId);
      setBatchStatus(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setBatchErr(msg);
    } finally {
      setBatchBusy(false);
    }
  }

  const rows: Row[] = data?.items ?? [];

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
              Your downloads
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Download your purchased files (single ZIP) or combine multiple
              products into one bundle ZIP.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/demo/status"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50"
            >
              System check
            </Link>
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
              onClick={load}
              disabled={!isReady || loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Refresh
            </Button>
            {email ? (
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                }}
              >
                Sign out
              </Button>
            ) : (
              <Link
                href="/demo/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors bg-zinc-950 text-white hover:bg-zinc-900"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {!accessToken ? (
          <Card className="p-6">
            <div className="text-sm font-semibold text-zinc-950">Sign in</div>
            <div className="mt-1 text-sm text-zinc-600">
              Sign in with the email used at checkout to view your downloads.
            </div>
            <div className="mt-4">
              <Link
                href="/demo/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors bg-zinc-950 text-white hover:bg-zinc-900"
              >
                Open login
              </Link>
            </div>
          </Card>
        ) : null}

        {error ? (
          <Card className="my-4 border-amber-200 bg-amber-50/60 p-5">
            <div className="text-sm font-semibold text-amber-900">Error</div>
            <div className="mt-1 text-sm text-amber-900/90">{error}</div>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Account status
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  “Linked” means your login email matches your purchase profile.
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot ok={profileLinked} />
                <span className="text-zinc-700">
                  {profileLinked ? "Account linked" : "Not linked yet"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">Email</div>
                <div className="mt-1 text-sm text-zinc-950">
                  {email ?? "—"}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">
                  Linked
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-950">
                  {profileLinked ? "Yes" : "Not yet"}
                </div>
                {!profileLinked ? (
                  <div className="mt-2 text-xs text-amber-700">
                    If you don’t see downloads: sign in with your checkout email
                    or we’ll add a demo purchase for this account.
                  </div>
                ) : null}
              </div>
            </div>

            {data?.membership ? (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-semibold text-zinc-600">
                  Membership
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-zinc-500">Allowed:</span>{" "}
                    <span className="font-medium text-zinc-900">
                      {String(data.membership.allowed)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Reason:</span>{" "}
                    <span className="font-medium text-zinc-900">
                      {data.membership.reasonCode ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Remaining:</span>{" "}
                    <span className="font-medium text-zinc-900">
                      {data.membership.remainingDownloads ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Monthly limit:</span>{" "}
                    <span className="font-medium text-zinc-900">
                      {data.membership.monthlyLimit ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-200/90 bg-indigo-50 text-indigo-700">
                <Archive className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Batch ZIP
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Select items and generate a single ZIP download.
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Button
                disabled={!accessToken || selectedIds.length === 0 || batchBusy}
                onClick={handleCreateBatch}
              >
                {batchBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create batch ZIP"
                )}
              </Button>
              <div className="mt-2 text-xs text-zinc-500">
                Selected: {selectedIds.length}
              </div>
            </div>

            {batchErr ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
                {batchErr}
              </div>
            ) : null}

            {batchJobId ? (
              <div className="mt-4 space-y-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
                <div>
                  <span className="text-zinc-500">Job:</span>{" "}
                  <span className="font-mono text-xs text-zinc-900">
                    {batchJobId}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Status:</span>{" "}
                  <span className="font-medium text-zinc-900">
                    {batchStatus?.job.status ?? "polling…"}
                  </span>
                </div>
                {batchStatus?.job.status === "failed" ? (
                  <div className="text-rose-700">
                    {batchStatus.job.error_message ?? "Job failed"}
                  </div>
                ) : null}
                {batchStatus?.downloadUrl ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(batchStatus.downloadUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Download bundle.zip
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>

        <Card className="mt-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-950">
                Downloadable items
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Select items to create a bundle ZIP, or download a single ZIP.
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              {loading ? "Loading…" : `${rows.length} item(s)`}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <Table>
              <TableHead>
                <TableHeaderCell>
                  <span className="sr-only">Select</span>
                </TableHeaderCell>
                <TableHeaderCell>DDD ID</TableHeaderCell>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableHead>
              <tbody>
                {loading ? (
                  <tr className="border-t border-zinc-100">
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-zinc-600"
                    >
                      <Loader2
                        className="mx-auto mb-2 h-5 w-5 animate-spin text-zinc-500"
                        aria-hidden
                      />
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr className="border-t border-zinc-100">
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-zinc-600"
                    >
                      <PackageOpen
                        className="mx-auto mb-2 h-6 w-6 text-zinc-500"
                        aria-hidden
                      />
                      No downloads found for this email.
                      <div className="mt-2 text-xs text-zinc-500">
                        Tip: sign in with the email you used at checkout.
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.productId}>
                      <TableCell className="w-[48px]">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[r.dddId])}
                          onChange={(e) =>
                            setSelected((prev) => ({
                              ...prev,
                              [r.dddId]: e.target.checked,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.dddId}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-sm text-zinc-600">
                        {r.status ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(r.dddId)}
                          disabled={!accessToken}
                        >
                          <Download className="mr-2 h-4 w-4" aria-hidden />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </PageEnter>
  );
}


"use client";

import { useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Check, Loader2, Upload, Eye, Flag } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Table, {
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import PageEnter from "@/components/PageEnter";
import { importCsvFromText } from "@/services/api";
import AnimatedTitle from "@/components/AnimatedTitle";

type ParsedPreview = {
  headers: string[];
  rows: Record<string, string>[];
  kind: "drive_zip_links" | "shopify_files_manifest" | "unknown";
};

function detectKind(headers: string[]) {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const hasDrive = normalized.includes("download_url") && normalized.includes("zip_name");
  const hasShopify =
    normalized.includes("cdn_url") &&
    normalized.includes("position") &&
    normalized.includes("local_path") &&
    normalized.includes("shopify_file_id");
  if (hasDrive) return "drive_zip_links" as const;
  if (hasShopify) return "shopify_files_manifest" as const;
  return "unknown" as const;
}

function parseCsvSimple(csvText: string): ParsedPreview {
  const normalized = csvText.replace(/^\uFEFF/, "").trim();
  const lines = normalized.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [], kind: "unknown" };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const kind = detectKind(headers);

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });

  return { headers, rows, kind };
}

const sampleDriveCsv = `ddd_id,zip_name,drive_file_id,download_url
DDD000001,DP Punk Gig Moodboard DDD000001.zip,1OibeHaWWLKHu7rX1lRqBkPB8jsbgc4rM,https://drive.google.com/uc?export=download&id=1OibeHaWWLKHu7rX1lRqBkPB8jsbgc4rM
DDD000002,DP Acoustic Folk Moodboard DDD000002.zip,1tGZ5TUPh45iBZAPxc-wQmDO_ltG7couA,https://drive.google.com/uc?export=download&id=1tGZ5TUPh45iBZAPxc-wQmDO_ltG7couA
`;

const sampleShopifyCsv = `ddd_id,product_folder,position,local_path,shopify_file_id,cdn_url,file_status
DDD008308,DDD008308_DP Book Page Collage,1,/tmp/DDD008308_01.jpg,gid://shopify/MediaImage/67892564230481,https://cdn.shopify.com/s/files/1/1009/9241/8129/files/DDD008308_DP_Book_Page_Collage_Gallery_01.jpg,READY
DDD008308,DDD008308_DP Book Page Collage,2,/tmp/DDD008308_02.jpg,gid://shopify/MediaImage/67892564590929,https://cdn.shopify.com/s/files/1/1009/9241/8129/files/DDD008308_DP_Book_Page_Collage_Gallery_02.jpg,READY
`;

type StepDef = { n: 1 | 2 | 3; title: string; description: string; icon: typeof Upload };

const STEPS: StepDef[] = [
  { n: 1, title: "Select", description: "CSV file", icon: Upload },
  { n: 2, title: "Preview", description: "Map & rows", icon: Eye },
  { n: 3, title: "Import", description: "Results", icon: Flag },
];

const EMPTY_PREVIEW: ParsedPreview = { headers: [], rows: [], kind: "unknown" };

export default function CsvImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");

  const [preview, setPreview] = useState<ParsedPreview>(EMPTY_PREVIEW);

  const [job, setJob] = useState<{
    id: string;
    status: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
    errors: Array<{ row: number; field: string; message: string }>;
    errorsTruncated?: boolean;
    kind: string;
  } | null>(null);

  const [simulating, setSimulating] = useState(false);

  const importedProducts = useMemo(() => {
    const set = new Set<string>();
    preview.rows.forEach((r) => {
      const ddd = (r["ddd_id"] ?? "").trim();
      if (ddd) set.add(ddd);
    });
    return set.size;
  }, [preview]);

  /** Step 1 completes only after a real file pick/drop or a sample preset (sets fileName). */
  const step1Done = fileName.trim().length > 0;
  const step2Done = step1Done && preview.rows.length > 0;
  const step3Done = job !== null;

  const activeStep: 1 | 2 | 3 = useMemo(() => {
    if (job) return 3;
    if (simulating) return 2;
    if (!step1Done) return 1;
    return 2;
  }, [job, simulating, step1Done]);

  async function onPickFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setCsvText(text);
    setPreview(parseCsvSimple(text));
    setJob(null);
  }

  async function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await onPickFile(file);
  }

  const previewHeaders = preview.headers.slice(0, 6);
  const previewRows = preview.rows.slice(0, 10);

  async function runSimulate() {
    setSimulating(true);
    setJob(null);
    try {
      const res = await importCsvFromText({
        fileText: csvText,
        fileName: fileName || "import.csv",
      });

      const summaryStatus =
        res.failedRows === 0
          ? "completed"
          : res.successRows > 0
            ? "partial"
            : "failed";

      setJob({
        id: res.importJobId,
        status: summaryStatus,
        totalRows: res.totalRows,
        successRows: res.successRows,
        failedRows: res.failedRows,
        errors: res.errors,
        errorsTruncated: res.errorsTruncated,
        kind: res.kind,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setJob({
        id: "unknown",
        status: "failed",
        totalRows: 0,
        successRows: 0,
        failedRows: 1,
        errors: [{ row: 0, field: "request", message }],
        kind: "unknown",
      });
    } finally {
      setSimulating(false);
    }
  }

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
            <AnimatedTitle text="CSV Import" className="inline-block" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Choose a CSV (or load a sample), review the preview, then run an import to
            link products and assets.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done =
                (step.n === 1 && step1Done) ||
                (step.n === 2 && step2Done) ||
                (step.n === 3 && step3Done);
              const current = activeStep === step.n;
              const processing = simulating && step.n === 2;

              return (
                <div key={step.n} className="flex flex-1 items-center gap-3">
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                        done && !current
                          ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                          : current
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500",
                      ].join(" ")}
                    >
                      {processing ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      ) : done && !current ? (
                        <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Step {step.n}
                      </div>
                      <div className="truncate text-sm font-semibold text-zinc-950">
                        {step.title}
                      </div>
                      <div className="truncate text-xs text-zinc-500">{step.description}</div>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 ? (
                    <div
                      className="hidden h-px flex-1 bg-gradient-to-r from-zinc-200 to-zinc-100 md:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-950">Select CSV</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Supported formats: Drive ZIP links or Shopify preview manifest.
                </div>
              </div>
              <div className="text-xs">
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-medium text-indigo-900">
                  Kind: <span className="font-mono">{preview.kind}</span>
                </span>
              </div>
            </div>

            <div
              className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/30 p-6 text-sm transition-colors hover:border-indigo-300/80"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    onPickFile(f);
                  }}
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-950">Drop CSV here</div>
                    <div className="text-zinc-600">
                      {fileName ? (
                        <span className="font-medium text-zinc-900">{fileName}</span>
                      ) : (
                        "Select a CSV file or use a sample below — step 1 stays incomplete until then."
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose file
                  </Button>
                </div>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setFileName("Drive_Zip_Download_Links.csv");
                  setCsvText(sampleDriveCsv);
                  setPreview(parseCsvSimple(sampleDriveCsv));
                  setJob(null);
                }}
              >
                Use Drive ZIP sample
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setFileName("shopify_files_manifest.csv");
                  setCsvText(sampleShopifyCsv);
                  setPreview(parseCsvSimple(sampleShopifyCsv));
                  setJob(null);
                }}
              >
                Use Shopify sample
              </Button>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={runSimulate}
                disabled={simulating || !csvText.trim()}
              >
                {simulating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Running import…
                  </span>
                ) : (
                  "Run import"
                )}
              </Button>
            </div>

            <div className="mt-6">
              {simulating ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-3/5" />
                </div>
              ) : job ? (
                <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-zinc-950">
                        Import result
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Job ID: <span className="font-mono">{job.id}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-600">Status</div>
                      <div className="mt-1 text-sm font-semibold capitalize text-zinc-950">
                        {job.status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-600">Products (rows)</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                        {importedProducts}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-600">Success rows</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                        {job.successRows}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <div className="text-xs text-zinc-600">Failed rows</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-950 tabular-nums">
                        {job.failedRows}
                      </div>
                    </div>
                  </div>

                  {job.errorsTruncated ? (
                    <p className="mt-3 text-xs text-amber-800">
                      Only the first batch of errors is listed here. Open{" "}
                      <code className="rounded bg-zinc-100 px-1">GET /admin/csv/import/:id</code> for
                      all failed rows.
                    </p>
                  ) : null}

                  {job.errors.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-zinc-950">Errors</div>
                      <div className="mt-2 space-y-2">
                        {job.errors.slice(0, 6).map((e, idx) => (
                          <div
                            key={`${e.row}_${e.field}_${idx}`}
                            className="rounded-xl border border-zinc-200 bg-white p-3"
                          >
                            <div className="text-xs text-zinc-600">
                              Row {e.row} • {e.field}
                            </div>
                            <div className="mt-1 text-sm text-zinc-900">{e.message}</div>
                          </div>
                        ))}
                        {job.errors.length > 6 ? (
                          <div className="text-xs text-zinc-600">
                            +{job.errors.length - 6} more errors…
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                  Run an import to see job stats and any row-level errors.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-zinc-950">Parsed CSV preview</div>
            <div className="mt-1 text-sm text-zinc-600">
              First rows from your file (demo parser — production may differ).
            </div>

            <div className="mt-4">
              {previewRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-sm text-zinc-600">
                  No rows to preview.
                </div>
              ) : (
                <Table>
                  <TableHead>
                    {previewHeaders.map((h) => (
                      <TableHeaderCell key={h}>{h}</TableHeaderCell>
                    ))}
                  </TableHead>
                  <tbody>
                    {previewRows.map((r, idx) => (
                      <TableRow key={idx}>
                        {previewHeaders.map((h) => (
                          <TableCell key={h}>{r[h] ?? ""}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-indigo-100/90 bg-indigo-50/40 p-4">
              <div className="text-xs font-semibold text-indigo-900">Tip</div>
              <div className="mt-1 text-sm text-zinc-800">
                After a successful import, open <span className="font-semibold">Products</span>{" "}
                to verify ZIP + preview assets.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageEnter>
  );
}

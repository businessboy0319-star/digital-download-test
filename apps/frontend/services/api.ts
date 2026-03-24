export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:4001";

type ApiError = { error?: string; message?: string };

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const requestUrl = `${BACKEND_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(requestUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw error;
  }

  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    const err = (json as ApiError | null)?.error ?? (json as ApiError | null)?.message;
    throw new Error(err || `Request failed: ${res.status}`);
  }

  return json as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export type DashboardResponse = {
  stats: {
    totalProducts: number;
    totalAssets: number;
    totalImports: number;
  };
  recentProducts: Array<{
    ddd_id: string;
    title: string;
    created_at: string;
  }>;
};

export type DebugProductsListResponse = {
  products: Array<any>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type DebugProductDetailResponse = {
  product: any;
};

export async function getDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/admin/debug/dashboard");
}

export async function listProducts(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<DebugProductsListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));

  return apiFetch<DebugProductsListResponse>(`/admin/debug/products?${query.toString()}`, {
    method: "GET",
  });
}

export async function getProductDetail(dddId: string): Promise<DebugProductDetailResponse> {
  return apiFetch<DebugProductDetailResponse>(`/admin/debug/products/${encodeURIComponent(dddId)}`, {
    method: "GET",
  });
}

export type ImportCsvResponse = {
  success: true;
  importJobId: string;
  kind: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  validationFailedRows?: number;
  processingFailedRows?: number;
  errors: Array<{ row: number; field: string; message: string }>;
  errorsTruncated?: boolean;
  jobStatus?: string;
};

export async function importCsvFromText(args: {
  fileText: string;
  fileName: string;
  strict?: boolean;
  verifyUrls?: boolean;
}): Promise<ImportCsvResponse> {
  return apiFetch<ImportCsvResponse>("/admin/csv/import", {
    method: "POST",
    body: JSON.stringify({
      file: args.fileText,
      fileName: args.fileName,
      ...(args.strict !== undefined ? { strict: args.strict } : {}),
      ...(args.verifyUrls !== undefined ? { verifyUrls: args.verifyUrls } : {}),
    }),
  });
}

export type AdminPreflightResponse = {
  ok: boolean;
  database: { ok: true } | { ok: false; message: string };
  storage: { provider: string; ok?: boolean; message?: string };
};

/** Preflight may return HTTP 503 with JSON body; this does not throw on non-2xx. */
export async function getAdminPreflight(): Promise<AdminPreflightResponse> {
  const res = await fetch(`${BACKEND_URL}/admin/debug/preflight`, { method: "GET" });
  const text = await res.text();
  if (!text) {
    return {
      ok: false,
      database: { ok: false, message: "Empty response" },
      storage: { provider: "cloudflare_r2", ok: false, message: "Empty response" },
    };
  }
  try {
    return JSON.parse(text) as AdminPreflightResponse;
  } catch {
    return {
      ok: false,
      database: { ok: false, message: "Invalid JSON from preflight" },
      storage: { provider: "cloudflare_r2", ok: false, message: "Invalid JSON" },
    };
  }
}


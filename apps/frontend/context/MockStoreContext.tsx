"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo, useState } from "react";

type AssetType = "preview_image" | "zip_download";

export type ProductAsset = {
  id: string;
  asset_type: AssetType;
  file_name: string | null;
  file_path: string; // for demo: URL to image/zip
  is_public: boolean;
  // For previews (and ordering in UI)
  position?: number;
};

export type Product = {
  id: string; // internal demo id
  ddd_id: string;
  title: string;
  category: string | null;
  description: string | null;
  status: string | null;
  createdAt: string;
  importedAt?: string;
  assets: ProductAsset[];
};

export type ImportJob = {
  id: string;
  fileName: string;
  createdAt: string;
  status: "running" | "completed" | "failed";
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  kind: "drive_zip_links" | "shopify_files_manifest" | "unknown";
};

type DashboardStats = {
  totalProducts: number;
  totalAssets: number;
  totalImports: number;
};

type MockStoreContextValue = {
  products: Product[];
  importJobs: ImportJob[];
  dashboardStats: DashboardStats;

  simulateImport: (args: {
    csvText: string;
    fileName: string;
  }) => Promise<ImportJob>;
  getProductByDddId: (dddId: string) => Product | undefined;
  resetToSeed: () => void;
};

const MockStoreContext = createContext<MockStoreContextValue | null>(null);

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function basename(path: string) {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

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

function parseCsvSimple(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalized = csvText.replace(/^\uFEFF/, "").trim();
  const lines = normalized.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Note: simple CSV parsing (no full quote escaping). Works for your Pete sample files.
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
}

function seedProducts(): Product[] {
  const t0 = new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString();
  const t1 = new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString();

  return [
    {
      id: uid("prod"),
      ddd_id: "DDD000001",
      title: "DP Punk Gig Moodboard DDD000001.zip",
      category: "Digital",
      description: null,
      status: "draft",
      createdAt: t0,
      importedAt: t1,
      assets: [
        {
          id: uid("asset"),
          asset_type: "zip_download",
          file_name: "DP Punk Gig Moodboard DDD000001.zip",
          file_path:
            "https://drive.google.com/uc?export=download&id=1OibeHaWWLKHu7rX1lRqBkPB8jsbgc4rM",
          is_public: true,
        },
        {
          id: uid("asset"),
          asset_type: "preview_image",
          file_name: "preview_01.jpg",
          file_path:
            "https://cdn.shopify.com/s/files/1/1009/9241/8129/files/example_preview_01.jpg",
          is_public: true,
          position: 1,
        },
      ],
    },
    {
      id: uid("prod"),
      ddd_id: "DDD000002",
      title: "DP Acoustic Folk Moodboard DDD000002.zip",
      category: "Digital",
      description: null,
      status: "draft",
      createdAt: t0,
      importedAt: t0,
      assets: [
        {
          id: uid("asset"),
          asset_type: "zip_download",
          file_name: "DP Acoustic Folk Moodboard DDD000002.zip",
          file_path:
            "https://drive.google.com/uc?export=download&id=1tGZ5TUPh45iBZAPxc-wQmDO_ltG7couA",
          is_public: true,
        },
      ],
    },
  ];
}

export default function MockStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  const dashboardStats = useMemo(() => {
    const totalAssets = products.reduce((acc, p) => acc + p.assets.length, 0);
    return {
      totalProducts: products.length,
      totalAssets,
      totalImports: importJobs.length,
    };
  }, [products, importJobs]);

  function getProductByDddId(dddId: string) {
    return products.find((p) => p.ddd_id === dddId);
  }

  async function simulateImport({ csvText, fileName }: { csvText: string; fileName: string }) {
    const jobId = uid("job");
    const { headers, rows } = parseCsvSimple(csvText);
    const kind = detectKind(headers);

    const baseJob: ImportJob = {
      id: jobId,
      fileName,
      createdAt: nowIso(),
      status: "running",
      totalRows: rows.length,
      successRows: 0,
      failedRows: 0,
      errors: [],
      kind,
    };

    setImportJobs((prev) => [baseJob, ...prev]);

    // Small delay so the UI can show loading/skeleton.
    await new Promise((r) => setTimeout(r, 700));

    if (kind === "unknown") {
      const failedJob: ImportJob = {
        ...baseJob,
        status: "failed",
        successRows: 0,
        failedRows: rows.length,
        errors: [
          {
            row: 1,
            field: "headers",
            message:
              "Unsupported CSV. Expected either Drive_Zip_Download_Links.csv or shopify_files_manifest.csv format.",
          },
        ],
      };
      setImportJobs((prev) => prev.map((j) => (j.id === jobId ? failedJob : j)));
      return failedJob;
    }

    const errors: ImportJob["errors"] = [];
    const touchedDdd = new Set<string>();

    const nextProducts = [...products];

    const upsertProduct = (dddId: string, title: string) => {
      touchedDdd.add(dddId);
      const existingIndex = nextProducts.findIndex((p) => p.ddd_id === dddId);
      if (existingIndex >= 0) return existingIndex;
      nextProducts.push({
        id: uid("prod"),
        ddd_id: dddId,
        title,
        category: null,
        description: null,
        status: "draft",
        createdAt: nowIso(),
        importedAt: nowIso(),
        assets: [],
      });
      return nextProducts.length - 1;
    };

    const upsertZipAsset = (product: Product, zipName: string | undefined, url: string | undefined) => {
      const file_path = url?.trim();
      if (!file_path) return;

      const file_name = zipName?.trim() || null;
      const existing = product.assets.find((a) => a.asset_type === "zip_download");

      if (existing) {
        existing.file_path = file_path;
        existing.file_name = file_name;
        existing.is_public = true;
      } else {
        product.assets.push({
          id: uid("asset"),
          asset_type: "zip_download",
          file_name,
          file_path,
          is_public: true,
        });
      }
    };

    const upsertPreviewAsset = (product: Product, position: number, localPath: string, cdnUrl: string) => {
      const file_name = basename(localPath) || null;
      const existing = product.assets.find(
        (a) => a.asset_type === "preview_image" && a.position === position
      );

      if (existing) {
        existing.file_name = file_name;
        existing.file_path = cdnUrl;
        existing.is_public = true;
        existing.position = position;
      } else {
        product.assets.push({
          id: uid("asset"),
          asset_type: "preview_image",
          file_name,
          file_path: cdnUrl,
          is_public: true,
          position,
        });
      }
    };

    rows.forEach((row, i) => {
      const rowNumber = i + 1;

      const dddId = (row["ddd_id"] || "").trim();
      if (!dddId) {
        errors.push({ row: rowNumber, field: "ddd_id", message: "ddd_id is required" });
        return;
      }

      if (kind === "drive_zip_links") {
        const zipName = row["zip_name"];
        const downloadUrl = row["download_url"];

        if (!downloadUrl?.trim()) {
          errors.push({
            row: rowNumber,
            field: "download_url",
            message: "download_url is required and must be non-empty",
          });
          return;
        }

        const title = zipName?.trim() || dddId;
        const index = upsertProduct(dddId, title);
        const product = nextProducts[index];
        upsertZipAsset(product, zipName, downloadUrl);
      } else if (kind === "shopify_files_manifest") {
        const cdnUrl = row["cdn_url"];
        if (!cdnUrl?.trim()) {
          errors.push({
            row: rowNumber,
            field: "cdn_url",
            message: "cdn_url is required and must be non-empty",
          });
          return;
        }

        const positionRaw = row["position"];
        const position = Number(positionRaw);
        const localPath = row["local_path"] || "";
        const productFolder = row["product_folder"]?.trim() || dddId;

        if (!Number.isFinite(position)) {
          errors.push({
            row: rowNumber,
            field: "position",
            message: "position must be a number",
          });
          return;
        }

        const index = upsertProduct(dddId, productFolder);
        const product = nextProducts[index];
        upsertPreviewAsset(product, position, localPath, cdnUrl);
      }
    });

    const successRows = rows.length - errors.length;
    const failedRows = errors.length;

    const completedJob: ImportJob = {
      ...baseJob,
      status: failedRows > 0 ? "completed" : "completed",
      successRows,
      failedRows,
      errors,
    };

    // Ensure importedAt for touched products.
    const next = nextProducts.map((p) =>
      touchedDdd.has(p.ddd_id) ? { ...p, importedAt: nowIso() } : p
    );

    setProducts(next);
    setImportJobs((prev) => prev.map((j) => (j.id === jobId ? completedJob : j)));

    return completedJob;
  }

  function resetToSeed() {
    setProducts(seedProducts());
    setImportJobs([]);
  }

  const value: MockStoreContextValue = {
    products,
    importJobs,
    dashboardStats,
    simulateImport,
    getProductByDddId,
    resetToSeed,
  };

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore() {
  const ctx = useContext(MockStoreContext);
  if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
  return ctx;
}


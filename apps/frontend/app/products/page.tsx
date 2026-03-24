"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Table, {
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Image from "next/image";
import PageEnter from "@/components/PageEnter";
import { listProducts } from "@/services/api";
import AnimatedTitle from "@/components/AnimatedTitle";

type CatalogAsset = {
  id: string;
  asset_type: "preview_image" | "zip_download" | string;
  file_name: string | null;
  file_path: string;
  created_at?: string;
};

type CatalogProduct = {
  id: string;
  ddd_id: string;
  title: string;
  category?: string | null;
  status?: string | null;
  created_at?: string;
  assets: CatalogAsset[];
};

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

function getZipAsset(product: { assets: CatalogAsset[] }) {
  return product.assets.find((a) => a.asset_type === "zip_download");
}

function getPreviewAsset(product: { assets: CatalogAsset[] }) {
  return (
    product.assets
      .filter((a) => a.asset_type === "preview_image")
      // Prefer stable ordering by created_at (schema-backed) for real data.
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0] ??
    null
  );
}

export default function ProductsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const res = await listProducts({
          search,
          page,
          pageSize,
        });

        if (cancelled) return;
        setProducts(res.products as CatalogProduct[]);
        setTotalPages(res.meta.totalPages);
        setTotalProducts(res.meta.total);
      } catch (err) {
        if (cancelled) return;
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
        // eslint-disable-next-line no-console
        console.error("Failed to load products", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, page, pageSize]);

  const onSearchChange = (value: string) => {
    setIsLoading(true);
    setPage(1);
    setSearch(value);
  };

  const rangeLabel = useMemo(() => {
    if (totalProducts === 0) return "No products to show";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalProducts);
    return `Showing ${start}–${end} of ${totalProducts}`;
  }, [page, pageSize, totalProducts]);

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            <AnimatedTitle text="Products" className="inline-block" />
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Browse and verify product catalog structure.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[320px]">
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or Product ID…"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-zinc-600">Per page</div>
            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-none hover:shadow-[0_10px_25px_-18px_rgba(63,63,70,0.75)] transition-shadow"
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setIsLoading(true);
                setPage(1);
                setPageSize(next);
              }}
              aria-label="Products per page"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-900">
              {isLoading ? "…" : `${products.length} on page`}
            </Badge>
            <Badge className="border-zinc-200 bg-white text-zinc-800">
              {isLoading
                ? "…"
                : `${products.reduce((acc, p) => acc + (p.assets?.length ?? 0), 0)} assets on page`}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">{rangeLabel}</span>
          </p>
          <p className="text-xs text-zinc-500">Click a row to open product detail</p>
        </div>
        <Table>
          <TableHead>
            <TableHeaderCell>Product ID</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Asset File (ZIP)</TableHeaderCell>
            <TableHeaderCell>Preview Image</TableHeaderCell>
            <TableHeaderCell>Created Date</TableHeaderCell>
            <TableHeaderCell className="w-10 pr-4 text-right">
              <span className="sr-only">Open</span>
            </TableHeaderCell>
          </TableHead>

          <tbody>
            {isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-64" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-16 rounded-xl" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-6 py-8 text-sm text-zinc-600">
                    <p className="font-medium text-zinc-900">No products match</p>
                    <p className="mt-2">
                      Try another search or import catalog data from{" "}
                      <span className="font-semibold text-indigo-800">CSV Import</span>.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const zip = getZipAsset(p);
                const preview = getPreviewAsset(p);

                return (
                  <TableRow
                    key={p.ddd_id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/products/${p.ddd_id}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold text-zinc-950">
                          {p.ddd_id}
                        </div>
                        <div className="text-xs text-zinc-500">{p.status ?? "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-zinc-950">
                        {p.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-700">
                        {p.category ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-900">
                        {zip?.file_name ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {preview?.file_path ? (
                          <div className="relative h-12 w-16 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                            <Image
                              src={preview.file_path}
                              alt={preview.file_name ?? "preview"}
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-16 rounded-xl border border-zinc-200 bg-zinc-50" />
                        )}
                        <div className="text-sm text-zinc-700">
                          {preview?.file_name ?? "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-700">
                        {p.created_at ? formatShortDate(p.created_at) : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="w-10 pr-4 text-right align-middle">
                      <ChevronRight
                        className="ml-auto inline h-4 w-4 text-zinc-400"
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="text-sm text-zinc-600">
            Page <span className="font-medium text-zinc-950">{page}</span> of{" "}
            <span className="font-medium text-zinc-950">{totalPages}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                setIsLoading(true);
                setPage((p) => Math.max(1, p - 1));
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => {
                setIsLoading(true);
                setPage((p) => Math.min(totalPages, p + 1));
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </PageEnter>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import PageEnter from "@/components/PageEnter";
import { getProductDetail } from "@/services/api";

type CatalogAsset = {
  id: string;
  asset_type: string;
  file_name: string | null;
  file_path: string;
  created_at?: string;
};

type CatalogProduct = {
  id: string;
  ddd_id: string;
  title: string;
  status?: string | null;
  category?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  assets: CatalogAsset[];
};

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProductDetailPage() {
  const { dddId } = useParams<{ dddId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!dddId) return;
        setLoading(true);

        const res = await getProductDetail(dddId);
        if (cancelled) return;

        setProduct(res.product as CatalogProduct);
      } catch {
        if (cancelled) return;
        setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dddId]);

  if (!dddId) {
    return (
      <PageEnter>
        <div className="max-w-[900px]">
          <EmptyState title="Invalid product id" description="No dddId was provided." />
        </div>
      </PageEnter>
    );
  }

  const zip = product?.assets.find((a) => a.asset_type === "zip_download");
  const previews = (product?.assets ?? [])
    .filter((a) => a.asset_type === "preview_image")
    // Use DB-backed created_at for deterministic ordering.
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

  if (!loading && !product) {
    return (
      <PageEnter>
        <div className="max-w-[900px]">
          <EmptyState
            title="Product not found"
            description="This product does not exist in the current catalog."
          />

          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/products")}>
              Back to Products
            </Button>
          </div>
        </div>
      </PageEnter>
    );
  }

  return (
    <PageEnter>
      <div className="max-w-[1100px]">
        <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Product Detail
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Verify catalog metadata and linked assets.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-zinc-600">Product ID</div>
              <div className="mt-1 font-mono text-sm font-semibold text-zinc-950">
                {product?.ddd_id ?? "—"}
              </div>
            </div>
            <Badge>{product?.status ?? "draft"}</Badge>
          </div>

          <div className="mt-6">
            <div className="text-xs font-medium text-zinc-600">Name</div>
            <div className="mt-1 text-sm font-semibold text-zinc-950">
              {product?.title ?? "—"}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-600">Category</div>
            <div className="mt-1 text-sm text-zinc-700">
              {product?.category ?? "—"}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-600">Description</div>
            <div className="mt-1 text-sm text-zinc-700">
              {product?.description ?? "—"}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-medium text-zinc-600">Dates</div>
            <div className="mt-2 space-y-2 text-sm text-zinc-700">
              <div className="flex justify-between gap-3">
                <span>Created</span>
                <span className="font-medium text-zinc-950">
                  {product?.created_at ? formatShortDate(product.created_at) : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Imported</span>
                <span className="font-medium text-zinc-950">
                  {product?.updated_at ? formatShortDate(product.updated_at) : "—"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-6">
              <div className="text-sm font-semibold text-zinc-950">ZIP Asset</div>
              <div className="mt-3">
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : zip ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-zinc-950">
                      {zip.file_name ?? "—"}
                    </div>
                    <div className="text-xs text-zinc-600 break-all">{zip.file_path}</div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-600">No ZIP asset linked.</div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-950">Preview Images</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    Ordered by import time for clean catalog display.
                  </div>
                </div>
                <Badge>{previews.length} images</Badge>
              </div>

              {loading ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : previews.length === 0 ? (
                <div className="mt-4 text-sm text-zinc-600">No preview images linked.</div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {previews.slice(0, 10).map((img) => (
                    <div key={img.id} className="rounded-2xl border border-zinc-200 bg-white p-2">
                      <div className="relative h-24 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        <Image
                          src={img.file_path}
                          alt={img.file_name ?? "preview"}
                          fill
                          sizes="220px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="mt-2 text-xs font-medium text-zinc-900">
                        {img.created_at ? `Imported ${formatShortDate(img.created_at)}` : "—"}
                      </div>
                      <div className="mt-1 truncate text-xs text-zinc-600">
                        {img.file_name ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      </div>
    </PageEnter>
  );
}


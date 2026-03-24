// Uses Next client routing hooks for active navigation.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  Package,
} from "lucide-react";

const navItems: Array<{
  href: string;
  label: string;
  key: string;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", key: "products", icon: Package },
  {
    href: "/csv-import",
    label: "CSV Import",
    key: "csv-import",
    icon: FileSpreadsheet,
  },
];

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function breadcrumbFromPath(pathname: string | null) {
  if (!pathname || pathname === "/") {
    return [{ label: "Dashboard", href: "/" as const }];
  }
  if (pathname === "/products") {
    return [{ label: "Products", href: "/products" as const }];
  }
  if (pathname.startsWith("/products/")) {
    const id = pathname.split("/")[2] ?? "";
    return [
      { label: "Products", href: "/products" as const },
      {
        label: id ? `DDD ${id}` : "Product",
        href: pathname as `/${string}`,
      },
    ];
  }
  if (pathname.startsWith("/csv-import")) {
    return [{ label: "CSV Import", href: "/csv-import" as const }];
  }
  return [{ label: "Dashboard", href: "/" as const }];
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(900px_circle_at_100%_0%,rgba(14,165,233,0.08),transparent_50%),linear-gradient(to_bottom,#f8fafc,#ffffff)] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] overflow-hidden rounded-none border-x border-zinc-200/80 bg-white/90 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-3xl md:border md:border-zinc-200/90">
        <aside className="flex w-[268px] shrink-0 flex-col border-r border-zinc-200/90 bg-gradient-to-b from-zinc-50/95 to-white px-5 py-8 text-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 to-indigo-700 text-sm font-bold tracking-tight text-white shadow-sm shadow-indigo-500/25">
              DA
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-zinc-950">
                Digital Assets
              </div>
              <div className="text-xs text-zinc-500">Catalog Admin</div>
            </div>
          </div>

          <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={classNames(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
                    isActive
                      ? "border border-indigo-200/90 bg-indigo-50 text-indigo-950 shadow-sm shadow-indigo-500/10"
                      : "border border-transparent text-zinc-700 hover:border-zinc-200/90 hover:bg-white"
                  )}
                >
                  <span
                    className={classNames(
                      "flex h-9 w-9 items-center justify-center rounded-xl border text-zinc-600 transition-colors",
                      isActive
                        ? "border-indigo-200 bg-white text-indigo-700"
                        : "border-zinc-200/80 bg-zinc-50/80 text-zinc-600 group-hover:border-zinc-300 group-hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-10">
            <div className="rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm">
              <div className="text-xs font-semibold text-indigo-900">
                Milestone demo
              </div>
              <div className="mt-1 text-xs leading-relaxed text-zinc-600">
                UI is wired to your backend API — use CSV import and products to
                verify the full flow.
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white/70">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/85 px-6 py-3.5 backdrop-blur-md md:px-10">
            <nav
              className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-zinc-500"
              aria-label="Breadcrumb"
            >
              {crumbs.map((c, i) => (
                <span key={`${c.href}-${c.label}`} className="flex items-center gap-1">
                  {i > 0 ? (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                      aria-hidden
                    />
                  ) : null}
                  {i < crumbs.length - 1 ? (
                    <Link
                      href={c.href}
                      className="truncate rounded-md px-1 py-0.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate text-zinc-900">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <span className="hidden shrink-0 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 sm:inline">
              API live
            </span>
          </header>

          <div className="flex-1 px-6 py-8 text-zinc-950 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

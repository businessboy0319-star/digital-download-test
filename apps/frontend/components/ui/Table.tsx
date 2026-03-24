import type { MouseEventHandler, ReactNode } from "react";

export default function Table({
  children,
  className,
  scrollMaxHeight,
}: {
  children: ReactNode;
  className?: string;
  /** e.g. `min(70vh, 560px)` — enables sticky header inside scroll area */
  scrollMaxHeight?: string;
}) {
  const maxH = scrollMaxHeight ?? "min(70vh, 640px)";
  return (
    <div className={className ?? ""}>
      <div
        className="overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-none transition-shadow hover:shadow-[0_10px_30px_-22px_rgba(63,63,70,0.75)]"
        style={{ maxHeight: maxH }}
      >
        <table className="w-full border-collapse">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-zinc-50/95 shadow-[0_1px_0_0_rgba(24,24,27,0.08)] backdrop-blur-sm">
      <tr className="text-left text-xs font-semibold text-zinc-600">{children}</tr>
    </thead>
  );
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
}) {
  return (
    <tr
      className={["border-t border-zinc-100 hover:bg-zinc-50/60", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={["px-5 py-4 text-sm text-zinc-900", className ?? ""].join(" ")}>
      {children}
    </td>
  );
}

export function TableHeaderCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={["px-5 py-3 align-bottom", className ?? ""].join(" ")}>
      {children}
    </th>
  );
}

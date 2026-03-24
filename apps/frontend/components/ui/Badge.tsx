import type { ReactNode } from "react";

export default function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-none transition-shadow hover:shadow-[0_10px_25px_-18px_rgba(63,63,70,0.7)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}


import type { ReactNode } from "react";

export default function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200 bg-white shadow-none transition-shadow hover:shadow-[0_18px_45px_-25px_rgba(63,63,70,0.95)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}


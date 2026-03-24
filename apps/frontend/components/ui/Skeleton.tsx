export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70 shadow-none transition-shadow hover:shadow-[0_10px_25px_-18px_rgba(63,63,70,0.45)]",
        className ?? "",
      ].join(" ")}
    />
  );
}


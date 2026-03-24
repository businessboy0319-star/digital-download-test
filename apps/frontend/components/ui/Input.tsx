import type { InputHTMLAttributes } from "react";

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-950 shadow-none transition-shadow hover:shadow-[0_10px_25px_-18px_rgba(63,63,70,0.75)]",
        "placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:border-zinc-300",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}


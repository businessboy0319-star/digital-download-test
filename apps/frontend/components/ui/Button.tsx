import type { ButtonHTMLAttributes, ReactNode } from "react";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export default function Button({
  children,
  className,
  variant = "solid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none shadow-none transition-shadow hover:shadow-[0_18px_45px_-25px_rgba(63,63,70,1)]",
        variant === "solid"
          ? "bg-zinc-950 text-white hover:bg-zinc-900"
          : "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


"use client";

import type { CSSProperties } from "react";

export default function AnimatedTitle({
  text,
  className,
  staggerMs = 55,
  durationMs = 2400,
}: {
  text: string;
  className?: string;
  staggerMs?: number;
  durationMs?: number;
}) {
  const chars = Array.from(text);

  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => {
        if (ch === " ") {
          return (
            <span key={i} className="inline-block w-[0.45em]">
              &nbsp;
            </span>
          );
        }

        const style: CSSProperties = {
          animationDelay: `${i * staggerMs}ms`,
          animationDuration: `${durationMs}ms`,
        };

        return (
          <span key={i} className="animated-title-char" style={style}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}


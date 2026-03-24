"use client";

import { useId } from "react";

/** Normalized 0–1 values rendered as a minimal area sparkline. */
export function sparkFromSeed(seed: number, n = 14): number[] {
  const pts: number[] = [];
  let v = 0.45 + ((seed * 17) % 40) / 100;
  for (let i = 0; i < n; i++) {
    v = Math.min(
      1,
      Math.max(0.08, v + Math.sin(i * 1.15 + seed * 0.02) * 0.11)
    );
    pts.push(Number(v.toFixed(6)));
  }
  return pts;
}

/** Stable string for SSR + client (avoids hydration mismatch from float noise). */
function xy(x: number, y: number) {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

export default function Sparkline({
  values,
  className,
  fillOpacity = 0.2,
}: {
  values: number[];
  className?: string;
  fillOpacity?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const w = 120;
  const h = 36;
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const linePoints = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return xy(x, y);
  });
  const line = linePoints.join(" ");
  const areaPoints = `${xy(0, h)} ${linePoints.join(" ")} ${xy(w, h)}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={["text-indigo-500 dark:text-indigo-400", className].filter(Boolean).join(" ")}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sparkFill-${gid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sparkFill-${gid})`} points={areaPoints} />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
    </svg>
  );
}

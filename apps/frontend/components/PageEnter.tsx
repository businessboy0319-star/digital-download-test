"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function PageEnter({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="w-full page-enter">
      {children}
    </div>
  );
}


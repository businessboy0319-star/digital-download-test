import type { Metadata } from "next";
import "./globals.css";
import AdminShell from "@/components/AdminShell";
import { DemoSessionProvider } from "@/context/DemoSessionContext";

export const metadata: Metadata = {
  title: "Digital Asset Catalog Admin",
  description: "Milestone demo dashboard for product catalog & CSV imports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-zinc-100 font-sans text-zinc-950 antialiased">
        <DemoSessionProvider>
          <AdminShell>{children}</AdminShell>
        </DemoSessionProvider>
      </body>
    </html>
  );
}

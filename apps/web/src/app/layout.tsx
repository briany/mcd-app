import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { LayoutShell } from "@/components/Layout";
import { AppProviders } from "@/components/providers/AppProviders";
import { authOptions } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "McDonald's MCP Control Center",
  description: "Web experience mirroring the macOS + iOS MCP apps",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="bg-slate-950">
      <body className="antialiased">
        <AppProviders session={session}>
          <LayoutShell>{children}</LayoutShell>
        </AppProviders>
      </body>
    </html>
  );
}

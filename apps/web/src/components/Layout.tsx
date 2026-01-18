import type { ReactNode } from "react";

import { SidebarNav } from "@/components/SidebarNav";

interface LayoutProps {
  children: ReactNode;
}

export const LayoutShell = ({ children }: LayoutProps) => (
  <div className="flex min-h-screen bg-slate-950 text-slate-100">
    <SidebarNav />
    <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-8">
        {children}
      </div>
    </main>
  </div>
);

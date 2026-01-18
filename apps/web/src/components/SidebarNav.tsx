"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/coupons", label: "My Coupons" },
  { href: "/available", label: "Available Coupons" },
  { href: "/campaigns", label: "Campaigns" },
];

export const SidebarNav = () => {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900/70 p-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
          McDonald&apos;s MCP
        </p>
        <p className="text-lg font-bold text-white">Control Center</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 text-sm font-medium">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 transition",
                isActive
                  ? "bg-amber-400/20 text-amber-200"
                  : "text-slate-100 hover:bg-slate-800/70 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-6 text-xs text-slate-400">
        Token sourced from Config.plist or MCD_MCP_TOKEN env. Keep it secret.
      </p>
    </aside>
  );
};

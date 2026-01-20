"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/coupons", label: "My Coupons" },
  { href: "/available", label: "Available Coupons" },
  { href: "/campaigns", label: "Campaigns" },
];

export const SidebarNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call custom logout endpoint to clear CSRF
      await fetch("/api/auth/logout", { method: "POST" });

      // Then sign out with NextAuth
      await signOut({ redirect: false });

      // Redirect to signin
      router.push("/auth/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="mb-4 rounded-md px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800/70 hover:text-white text-left"
      >
        Sign Out
      </button>

      <p className="text-xs text-slate-400">
        Token sourced from Config.plist or MCD_MCP_TOKEN env. Keep it secret.
      </p>
    </aside>
  );
};

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "error";

const toneStyles: Record<Tone, string> = {
  info: "bg-sky-50 text-sky-900 border-sky-200",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  error: "bg-rose-50 text-rose-900 border-rose-200",
};

interface StatusBannerProps {
  tone?: Tone;
  title: string;
  message?: string;
  action?: ReactNode;
}

export const StatusBanner = ({ tone = "info", title, message, action }: StatusBannerProps) => (
  <div className={cn("flex items-start gap-4 rounded-xl border p-4", toneStyles[tone])}>
    <div className="flex-1">
      <p className="font-semibold">{title}</p>
      {message ? <p className="text-sm opacity-80">{message}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

import type { Campaign } from "@/lib/types";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const getStatus = (campaign: Campaign): "upcoming" | "past" | "ongoing" | "unknown" => {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "unknown";
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
};

const statusStyles: Record<string, string> = {
  upcoming: "bg-sky-100 text-sky-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  past: "bg-slate-100 text-slate-600",
  unknown: "bg-slate-100 text-slate-600",
};

interface CampaignListProps {
  campaigns: Campaign[];
}

export const CampaignList = ({ campaigns }: CampaignListProps) => (
  <div className="space-y-4">
    {campaigns.map((campaign) => {
      const status = getStatus(campaign);
      return (
        <article
          key={campaign.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{campaign.title}</h3>
              <p className="text-sm text-slate-500">
                {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
              {status.toUpperCase()}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700">{campaign.description}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
            {campaign.isSubscribed ? "Subscribed" : "Not subscribed"}
          </p>
        </article>
      );
    })}
  </div>
);

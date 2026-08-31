import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  accent?: "blue" | "purple" | "pink" | "emerald" | "amber";
};

const ACCENT_MAP = {
  blue: {
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    ring: "from-blue-400/20 to-blue-600/20",
    glow: "shadow-blue-500/25",
  },
  purple: {
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    ring: "from-purple-400/20 to-purple-600/20",
    glow: "shadow-purple-500/25",
  },
  pink: {
    iconBg: "bg-gradient-to-br from-pink-500 to-pink-600",
    ring: "from-pink-400/20 to-pink-600/20",
    glow: "shadow-pink-500/25",
  },
  emerald: {
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    ring: "from-emerald-400/20 to-emerald-600/20",
    glow: "shadow-emerald-500/25",
  },
  amber: {
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    ring: "from-amber-400/20 to-amber-600/20",
    glow: "shadow-amber-500/25",
  },
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  accent = "blue",
}: Props) {
  const a = ACCENT_MAP[accent];

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : trend === "down"
        ? "text-rose-600 bg-rose-50 border-rose-100"
        : "text-slate-500 bg-slate-50 border-slate-100";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-200">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {/* Label */}
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {title}
            </span>
          </div>

          {/* Value */}
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>

          {/* Description + Trend */}
          <div className="mt-2 flex items-center gap-2">
            {description && (
              <span className="text-xs font-medium text-slate-400">
                {description}
              </span>
            )}
            {trend && trendValue && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${trendColor}`}
              >
                <TrendIcon className="h-3 w-3" />
                {trendValue}
              </span>
            )}
          </div>
        </div>

        {/* Icon */}
        {icon && (
          <div className="relative flex-shrink-0">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.iconBg} text-white shadow-lg ${a.glow}`}
            >
              {icon}
            </div>
            {/* Decorative ring */}
            <div
              className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${a.ring} opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

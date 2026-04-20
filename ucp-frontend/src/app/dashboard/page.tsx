"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";
import { getAllProcurements, Procurement } from "@/services/api";
import { getToken } from "@/services/auth";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type ProcurementType = "Travaux" | "Biens" | "Consultance";

type DistributionItem = { label: string; value: number };

type DistributionByType = Record<
  ProcurementType,
  {
    methods: DistributionItem[];
    status: DistributionItem[];
    count: number;
    amount: number;
  }
>;

type DonutSegment = DistributionItem & {
  percent: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
};

const RADIAN = Math.PI / 180;

function renderPercentLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props ?? {};
  if (typeof percent !== "number" || percent < 0.05) return null;

  const radius = (Number(innerRadius) + Number(outerRadius)) / 2;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="white"
      fontSize={11}
      fontWeight={800}
      className="select-none"
      style={{ textShadow: "0 1px 8px rgba(15,23,42,0.55)" }}
    >
      {Math.round(percent * 100)}%
    </text>
  );
}

const TYPE_COLORS: Record<ProcurementType, string> = {
  Travaux: "#1f9d8b",
  Biens: "#ef8d32",
  Consultance: "#4b5563",
};

const METHOD_COLORS: Record<string, string> = {
  aon: "#5bd06ae0",
  aoi: "#7ea9d4",
  dc: "#acae6bd6",
  ed: "#b16bccc9",
  sfq: "#34d399",
  sfqc: "#60a5fa",
  smc: "#f59e0b",
  sqc: "#2dd4bf",
  sci: "#f472b6",
  sed: "#a78bfa",
  restricted: "#fb7185",
};

const STATUS_COLORS: Record<string, string> = {
  "en cours": "#3b82f6",
  termine: "#10b981",
  annule: "#ef4444",
  arrete: "#8b5e3c",
  retard: "#f97316",
  "dans les temps": "#14b8a6",
};

const STATUS_DONUT_COLORS: Record<string, string> = {
  "non demarre dans le temps": STATUS_COLORS["dans les temps"],
  "non demarre en retard": STATUS_COLORS["retard"],
  "en cours dans le temps": STATUS_COLORS["dans les temps"],
  "en cours en retard": STATUS_COLORS["retard"],
  supprime: STATUS_COLORS.annule,
  arrete: STATUS_COLORS.arrete,
  termine: STATUS_COLORS.termine,
};

const FALLBACK_METHOD_COLOR = "#94a3b8";
const FALLBACK_STATUS_COLOR = "#64748b";

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildDistribution(
  items: Procurement[],
  getValue: (item: Procurement) => unknown,
) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const key = normalizeKey(getValue(item));
    if (!key || key === "-") return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function mapStatusCategory(status: unknown): string | null {
  const key = normalizeKey(status);
  if (!key || key === "-") return null;

  if (key === "dans les temps") return "en cours dans le temps";
  if (key === "retard") return "en cours en retard";
  if (key === "en cours") return "en cours dans le temps";

  if (key.includes("termine")) return "termine";
  if (key.includes("arrete")) return "arrete";
  if (key.includes("supprime") || key.includes("annule")) return "supprime";

  const isNonDemarre = key.includes("non demarre");
  const isEnCours = key.includes("en cours");
  const isInTime =
    key.includes("dans les temps") || key.includes("dans le temps");
  const isLate = key.includes("retard") || key.includes("en retard");

  if (isNonDemarre) {
    if (isLate) return "non demarre en retard";
    return "non demarre dans le temps";
  }

  if (isEnCours) {
    if (isLate) return "en cours en retard";
    return "en cours dans le temps";
  }

  return null;
}

function buildStatusDistribution(items: Procurement[]) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const category = mapStatusCategory((item as any)?.status);
    if (!category) return;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function getSegments(
  items: DistributionItem[],
  colors: Record<string, string>,
  fallbackColor: string,
): (DonutSegment & { angle: number })[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return items.map((item) => {
    const percent = total > 0 ? (item.value / total) * 100 : 0;
    const segment = {
      ...item,
      percent,
      color: colors[item.label] ?? fallbackColor,
      strokeDasharray: `${percent} ${Math.max(0, 100 - percent)}`,
      strokeDashoffset: -currentAngle,
      angle: currentAngle,
    };
    currentAngle += percent;
    return segment;
  });
}

function formatLabel(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function useCountAnimation(
  end: number,
  duration: number = 1500,
  startDelay: number = 0,
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < startDelay) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const animationProgress = Math.min((progress - startDelay) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - animationProgress, 3);
      const currentCount = Math.floor(easeOutQuart * end);

      setCount(currentCount);

      if (animationProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startDelay]);

  return count;
}

function AnimatedNumber({
  value,
  duration = 1500,
  delay = 0,
  formatter,
}: {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
}) {
  const count = useCountAnimation(value, duration, delay);
  if (formatter) return <>{formatter(count)}</>;
  return <>{count.toLocaleString("fr-FR")}</>;
}

export default function DashboardPage() {
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getAllProcurements();
        setProcurements(data);
      } catch (err) {
        console.error("Erreur dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const stats = useMemo(() => {
    const dist: DistributionByType = {
      Travaux: { methods: [], status: [], count: 0, amount: 0 },
      Biens: { methods: [], status: [], count: 0, amount: 0 },
      Consultance: { methods: [], status: [], count: 0, amount: 0 },
    };

    procurements.forEach((p) => {
      const type = p.type as ProcurementType;
      if (!dist[type]) return;

      dist[type].count += 1;
      const amountValue = parseFloat(String(p.estimated_amount || 0));
      dist[type].amount += Number.isNaN(amountValue) ? 0 : amountValue;
    });

    (Object.keys(dist) as ProcurementType[]).forEach((type) => {
      const items = procurements.filter((p) => p.type === type);
      dist[type].methods = buildDistribution(items, (item) => item.method);
      dist[type].status = buildStatusDistribution(items);
    });

    return dist;
  }, [procurements]);

  const totalMarches = procurements.length;
  const totalMontant = useMemo(() => {
    return procurements.reduce((sum, p) => {
      const val = parseFloat(String(p.estimated_amount || 0));
      return sum + (Number.isNaN(val) ? 0 : val);
    }, 0);
  }, [procurements]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Chargement du tableau de bord...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#eceeef] text-[#17212e]"
      style={{ fontFamily: "var(--font-ui), Segoe UI, Arial, sans-serif" }}
    >
      <style>{`
        @keyframes dashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dashIntroSlide {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes countPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); color: #0ea85b; }
          100% { transform: scale(1); }
        }
        .count-animate {
          animation: countPop 0.3s ease-out;
        }
      `}</style>

      <TopHeader />

      <main className="mx-auto max-w-[1400px] animate-[dashFadeIn_0.4s_ease-out] p-4 md:px-8 md:pb-8 md:pt-4">
        <header className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div className="animate-[dashIntroSlide_0.5s_ease-out_forwards]">
            <h1 className="mb-1 text-[1.6rem] font-extrabold tracking-tight text-[#17212e]">
              Tableau de Bord <span className="text-[#0ea85b]">UCP</span>
            </h1>
            <p className="text-[0.85rem] font-medium text-slate-500">
              Suivi en temps réel des passations de marchés
            </p>
          </div>

          <div className="flex gap-3 animate-[dashIntroSlide_0.6s_ease-out_forwards]">
            <div className="flex items-center gap-3 rounded-2xl border border-[#d9dee3] bg-white px-5 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Marchés
                </div>
                <div className="count-animate text-[1.3rem] font-black text-slate-800">
                  <AnimatedNumber value={totalMarches} duration={900} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#d9dee3] bg-white px-5 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
                  <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-5.4a2 2 0 0 0-3-2.7L15 13" />
                  <path d="M5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="M11 5h2a2 2 0 1 0 0-4h-2a2 2 0 1 0 0 4Z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Montant Total
                </div>
                <div className="count-animate text-[1.3rem] font-black text-slate-800">
                  <AnimatedNumber
                    value={totalMontant}
                    duration={900}
                    delay={200}
                    formatter={(val) =>
                      new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "MGA",
                        maximumFractionDigits: 0,
                      }).format(val)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {(Object.keys(stats) as ProcurementType[]).map((type, index) => {
            const methodSegments = getSegments(
              stats[type].methods,
              METHOD_COLORS,
              FALLBACK_METHOD_COLOR,
            );
            const statusSegments = getSegments(
              stats[type].status,
              STATUS_DONUT_COLORS,
              FALLBACK_STATUS_COLOR,
            );

            return (
              <article
                key={type}
                className="overflow-hidden rounded-[1.5rem] border border-[#d9dee3] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] transition-all hover:shadow-lg animate-[dashIntroSlide_0.7s_ease-out_forwards]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <h2
                    className="font-black uppercase tracking-tight text-slate-800"
                    style={{ color: TYPE_COLORS[type] }}
                  >
                    {type}
                  </h2>
                </div>
                <div className="space-y-8 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-[0.8rem] font-bold uppercase text-slate-500">
                        Méthode
                      </span>
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ name: "bg", value: 1 }]}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              isAnimationActive={false}
                              stroke="none"
                            >
                              <Cell fill="#f1f5f9" />
                            </Pie>
                            <Pie
                              data={methodSegments.map((segment) => ({
                                name: segment.label,
                                value: segment.value,
                                color: segment.color,
                              }))}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={5}
                              isAnimationActive
                              animationDuration={900}
                              animationEasing="ease-out"
                              startAngle={90}
                              endAngle={-270}
                              labelLine={false}
                              label={renderPercentLabel}
                            >
                              {methodSegments.map((segment) => (
                                <Cell key={segment.label} fill={segment.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <span className="text-[0.8rem] font-bold uppercase text-slate-500">
                        Statut
                      </span>
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[{ name: "bg", value: 1 }]}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              isAnimationActive={false}
                              stroke="none"
                            >
                              <Cell fill="#f1f5f9" />
                            </Pie>
                            <Pie
                              data={statusSegments.map((segment) => ({
                                name: segment.label,
                                value: segment.value,
                                color: segment.color,
                              }))}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={5}
                              isAnimationActive
                              animationDuration={900}
                              animationEasing="ease-out"
                              startAngle={90}
                              endAngle={-270}
                              labelLine={false}
                              label={renderPercentLabel}
                            >
                              {statusSegments.map((segment) => (
                                <Cell key={segment.label} fill={segment.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                    <ul className="space-y-2">
                      {methodSegments.length > 0 ? (
                        methodSegments.map((segment) => (
                          <li
                            key={segment.label}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: segment.color }}
                              />
                              <span className="truncate font-medium uppercase text-slate-600">
                                {formatLabel(segment.label)}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-400">Aucune méthode</li>
                      )}
                    </ul>
                    <ul className="space-y-2">
                      {statusSegments.length > 0 ? (
                        statusSegments.map((segment) => (
                          <li
                            key={segment.label}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: segment.color }}
                              />
                              <span className="truncate font-medium text-slate-600">
                                {formatLabel(segment.label)}
                              </span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-400">Aucun statut</li>
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

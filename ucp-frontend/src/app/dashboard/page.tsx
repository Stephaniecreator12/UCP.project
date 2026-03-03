"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";
import { getAllProcurements, Procurement } from "@/services/api";
import { getToken } from "@/services/auth";
import "@/app/dashboard.css";

type ProcurementType = "Travaux" | "Biens" | "Consultance";

type DistributionItem = { label: string; value: number };
type DonutSegment = {
  label: string;
  from: number;
  to: number;
  color: string;
  idx: number;
  delayMs: number;
  durationMs: number;
};

type DistributionByType = Record<
  ProcurementType,
  {
    methods: DistributionItem[];
    status: DistributionItem[];
    count: number;
    amount: number;
  }
>;

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
  sfqc: "#5bd06ae0",
  smc: "#7ea9d4",
  sqc: "#acae6bd6",
  sci: "#b16bccc9",
  sed: "#ed4747d4",
};

const STATUS_COLORS: Record<string, string> = {
  "en cours": "#2f8f65",
  attribue: "#1d78c2",
  "attribue provisoire": "#6b69c9",
  "attribue definitif": "#2d9b9b",
  "a lancer": "#d89a2b",
  annule: "#cc5c49",
  termine: "#7ba83f",
  "non defini": "#8d95a5",
};

const METHOD_FALLBACK_COLORS = [
  "#2f8f65",
  "#1d78c2",
  "#d89a2b",
  "#cc5c49",
  "#6b69c9",
  "#2d9b9b",
  "#7ba83f",
];

const STATUS_FALLBACK_COLORS = [
  "#2f8f65",
  "#1d78c2",
  "#6b69c9",
  "#d89a2b",
  "#cc5c49",
  "#2d9b9b",
  "#7ba83f",
];

const TYPE_ORDER: ProcurementType[] = ["Travaux", "Biens", "Consultance"];
const DONUT_RADIUS = 45;
const DONUT_STROKE = 20; //reglage épaisseur du donut, plus c'est grand plus c'est épais (max ~60 pour garder un trou au centre)

const pct = (value: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};

const methodValue = (row: Procurement): string => {
  const value = row.method ?? row.epm ?? "";
  return String(value).trim().toLowerCase();
};

const typeLabel = (type: ProcurementType): string => {
  if (type === "Biens") return "Biens & Services";
  return type;
};

const topItem = (items: DistributionItem[]): DistributionItem | null => {
  if (!items.length) return null;
  return items.reduce(
    (max, item) => (item.value > max.value ? item : max),
    items[0],
  );
};

type AnimatedNumberProps = {
  value: number;
  formatter: (value: number) => string;
  durationMs?: number;
};

function AnimatedNumber({
  value,
  formatter,
  durationMs = 900,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const delta = value - startValue;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startValue + delta * eased;
      setDisplayValue(next);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, durationMs]);

  return <strong>{formatter(displayValue)}</strong>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDetails, setActiveDetails] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;

    const load = async () => {
      try {
        const data = await getAllProcurements();
        setRows(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const totalRows = rows.length;
    const totalAmount = rows.reduce((sum, row) => {
      const amount = Number(row.estimated_amount ?? 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);

    const distribution = TYPE_ORDER.reduce((acc, type) => {
      const rowsOfType = rows.filter((r) => r.type === type);
      const totalOfType = rowsOfType.length;
      const amountOfType = rowsOfType.reduce((sum, row) => {
        const amount = Number(row.estimated_amount ?? 0);
        return Number.isFinite(amount) ? sum + amount : sum;
      }, 0);

      const mCount: Record<string, number> = {};
      rowsOfType.forEach((r) => {
        const m = methodValue(r);
        if (m) mCount[m] = (mCount[m] || 0) + 1;
      });

      const sCount: Record<string, number> = {};
      rowsOfType.forEach((r) => {
        const s = r.status ? String(r.status) : "Non defini";
        sCount[s] = (sCount[s] || 0) + 1;
      });

      acc[type] = {
        methods: Object.entries(mCount).map(([k, v]) => ({
          label: k,
          value: pct(v, totalOfType),
        })),
        status: Object.entries(sCount).map(([k, v]) => ({
          label: k,
          value: pct(v, totalOfType),
        })),
        count: totalOfType,
        amount: amountOfType,
      };

      return acc;
    }, {} as DistributionByType);

    return { totalRows, totalAmount, distribution };
  }, [rows]);

  const getLegendColor = (
    label: string,
    idx: number,
    colorMap: Record<string, string>,
    fallbackColors: string[],
  ): string => {
    const key = label.trim().toLowerCase();
    return colorMap[key] || fallbackColors[idx % fallbackColors.length];
  };

  const toggleDetails = (id: string) => {
    setActiveDetails(activeDetails === id ? null : id);
  };

  const formatAmount = (value: number): string =>
    `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} Ariary`;

  const polarToCartesian = (
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number,
  ) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const delta = Math.max(0, endAngle - startAngle);
    const largeArcFlag = delta <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const renderDonutArcs = (
    data: DistributionItem[],
    colorMap: Record<string, string>,
    fallbackColors: string[],
  ) => {
    const cleanData = data.filter((d) => d.value > 0);
    const total = cleanData.reduce((sum, d) => sum + d.value, 0);
    if (total <= 0) return null;

    const gapDeg = cleanData.length > 1 ? 1.6 : 0;
    const totalGap = gapDeg * cleanData.length;
    const availableDeg = Math.max(360 - totalGap, 0);
    let startAngle = 0;

    const totalAnimMs = 600; //reglage durée totale de l'animation du donut
    let cumulativeDelay = 0;
    const segments: DonutSegment[] = cleanData.map((item, idx) => {
      const arcDeg = (item.value / total) * availableDeg;
      const from = startAngle;
      const to = startAngle + arcDeg;
      startAngle = to + gapDeg;

      const color = getLegendColor(item.label, idx, colorMap, fallbackColors);
      const durationMs = Math.max(
        140,
        Math.round((arcDeg / Math.max(availableDeg, 1)) * totalAnimMs),
      );
      const segment: DonutSegment = {
        label: item.label,
        from,
        to,
        color,
        idx,
        delayMs: cumulativeDelay,
        durationMs,
      };
      cumulativeDelay += durationMs;
      return segment;
    });

    return (
      <>
        {segments.map((segment) => {
          const arcDeg = segment.to - segment.from;
          const arcStyle = {
            animationDelay: `${segment.delayMs}ms`,
            animationDuration: `${segment.durationMs}ms`,
          };

          return (
            <path
              key={`arc-${segment.label}-${segment.idx}`}
              className="dash-donut-arc"
              d={describeArc(
                64,
                64,
                DONUT_RADIUS,
                segment.from,
                arcDeg >= 359.5 ? segment.to - 0.01 : segment.to,
              )}
              fill="none"
              stroke={segment.color}
              strokeWidth={16}
              strokeLinecap="butt"
              pathLength={100}
              style={arcStyle}
            />
          );
        })}
      </>
    );
  };

  return (
    <div className="app-shell dashboard-scroll-shell">
      <TopHeader />

      <main className="dash-page">
        <header className="dash-header">
          <h1 className="dash-title">
            Tableau de Bord de Passation des Marches (PPM)
          </h1>
          <p className="dash-kicker">
            Suivi en temps reel de l&apos;etat d&apos;avancement des dossiers, du
            lancement de la procédure à la validation financière.
          </p>
        </header>
        <div className="dash-row-mid">
          {TYPE_ORDER.map((type) => {
            const data = stats.distribution[type];
            const methodId = `methods-${type}`;
            const statusId = `status-${type}`;
            const topMethod = topItem(data?.methods || []);
            const topStatus = topItem(data?.status || []);

            return (
              <article key={type} className="dash-panel">
                <h2 style={{ color: TYPE_COLORS[type] }}>{typeLabel(type)}</h2>
                <div className="dash-panel-content">
                  <div className="dash-panel-stats">
                    <div className="panel-stat-item panel-stat-total panel-stat-total-count">
                      <span>Total marches</span>
                      {loading ? (
                        <strong>...</strong>
                      ) : (
                        <AnimatedNumber
                          value={data?.count ?? 0}
                          formatter={(v) =>
                            new Intl.NumberFormat("fr-FR").format(Math.round(v))
                          }
                        />
                      )}
                    </div>
                    <div className="panel-stat-item panel-stat-total panel-stat-total-amount">
                      <span>Montant total</span>
                      {loading ? (
                        <strong>...</strong>
                      ) : (
                        <AnimatedNumber
                          value={data?.amount ?? 0}
                          formatter={formatAmount}
                          durationMs={1100}
                        />
                      )}
                    </div>
                  </div>

                  <div className="dash-charts-container">
                    <div className="chart-item">
                      <p className="chart-label">Methodes utilisees</p>
                      <div className="chart-visual-row">
                        <div
                          className="dash-donut"
                          onClick={() => toggleDetails(methodId)}
                        >
                          <svg
                            className="dash-donut-svg"
                            viewBox="0 0 128 128"
                            aria-hidden="true"
                          >
                            <circle
                              className="dash-donut-track"
                              cx="64"
                              cy="64"
                              r={DONUT_RADIUS}
                              fill="none"
                              strokeWidth={DONUT_STROKE}
                            />
                            {renderDonutArcs(
                              data?.methods || [],
                              METHOD_COLORS,
                              METHOD_FALLBACK_COLORS,
                            )}
                          </svg>
                          <div className="dash-donut-center">
                            <strong>
                              {topMethod
                                ? topMethod.label.toUpperCase()
                                : "AUCUN"}
                            </strong>
                            <span>
                              {topMethod ? `${topMethod.value}%` : "0%"}
                            </span>
                          </div>
                          <div className="click-overlay">
                            Cliquez pour details
                          </div>
                        </div>

                        <div
                          className={`dash-legend-container dash-legend-side ${
                            activeDetails === methodId ? "open" : ""
                          }`}
                        >
                          <ul className="dash-legend">
                            {data?.methods.map((m, idx) => (
                              <li key={m.label}>
                                <i
                                  style={{
                                    backgroundColor: getLegendColor(
                                      m.label,
                                      idx,
                                      METHOD_COLORS,
                                      METHOD_FALLBACK_COLORS,
                                    ),
                                  }}
                                />
                                <span>{m.label.toUpperCase()}</span>
                                <strong>{m.value}%</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="chart-item">
                      <p className="chart-label">Statut d&apos;avancement</p>
                      <div className="chart-visual-row">
                        <div
                          className="dash-donut"
                          onClick={() => toggleDetails(statusId)}
                        >
                          <svg
                            className="dash-donut-svg"
                            viewBox="0 0 128 128"
                            aria-hidden="true"
                          >
                            <circle
                              className="dash-donut-track"
                              cx="64"
                              cy="64"
                              r={DONUT_RADIUS}
                              fill="none"
                              strokeWidth={DONUT_STROKE}
                            />
                            {renderDonutArcs(
                              data?.status || [],
                              STATUS_COLORS,
                              STATUS_FALLBACK_COLORS,
                            )}
                          </svg>
                          <div className="dash-donut-center">
                            <strong>
                              {topStatus
                                ? topStatus.label.toUpperCase()
                                : "AUCUN"}
                            </strong>
                            <span>
                              {topStatus ? `${topStatus.value}%` : "0%"}
                            </span>
                          </div>
                          <div className="click-overlay">
                            Cliquez pour details
                          </div>
                        </div>

                        <div
                          className={`dash-legend-container dash-legend-side ${
                            activeDetails === statusId ? "open" : ""
                          }`}
                        >
                          <ul className="dash-legend">
                            {data?.status.map((s, idx) => (
                              <li key={s.label}>
                                <i
                                  style={{
                                    backgroundColor: getLegendColor(
                                      s.label,
                                      idx,
                                      STATUS_COLORS,
                                      STATUS_FALLBACK_COLORS,
                                    ),
                                  }}
                                />
                                <span>{s.label}</span>
                                <strong>{s.value}%</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
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

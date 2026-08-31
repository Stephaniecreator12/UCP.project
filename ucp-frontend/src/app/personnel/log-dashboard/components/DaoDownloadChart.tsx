"use client";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Sector,
} from "recharts";
import { DaoDownload } from "@/types/adminDashboard";
import { useState } from "react";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
];

const renderActiveShape = (props: Record<string, unknown>) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
  } = props as {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
    payload: { dossier__title: string };
    value: number;
  };

  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-800 text-sm font-extrabold">
        {value}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider">
        téléchargements
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 1}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

export default function DaoDownloadChart({ data }: { data: DaoDownload[] }) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const total = data.reduce((s, d) => s + d.total_dao_downloads, 0);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Répartition des téléchargements
              </h3>
              <p className="text-xs text-slate-400">
                Volume par dossier
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {total} total
          </div>
        </div>

        {/* Donut + Legend */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full" style={{ minHeight: "260px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total_dao_downloads"
                  nameKey="dossier__title"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={62}
                  paddingAngle={3}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  cornerRadius={4}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} téléchargements`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend */}
          <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 px-2">
            {data.map((item, index) => {
              const pct = total > 0 ? ((item.total_dao_downloads / total) * 100).toFixed(1) : "0";
              return (
                <div
                  key={item.dossier__title}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    activeIndex === index
                      ? "bg-slate-50"
                      : "hover:bg-slate-50/50"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-600">
                    {item.dossier__title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { ViewCount } from "@/types/adminDashboard";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";

const GRADIENT_ID = "viewsBarGrad";

export default function ViewsChart({ data }: { data: ViewCount[] }) {
  const max = Math.max(...data.map((d) => d.total_views), 1);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Consultations par DAO
                </h3>
                <p className="text-xs text-slate-400">
                  Nombre de vues par dossier
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total: {data.reduce((s, d) => s + d.total_views, 0)}
          </div>
        </div>

        {/* Chart */}
        <div className="w-full" style={{ minHeight: "280px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="dossier_id"
                stroke="#cbd5e1"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
              />
              <YAxis
                stroke="#cbd5e1"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(59,130,246,0.06)" }}
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
                labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
                itemStyle={{ color: "#60a5fa", fontSize: "14px", fontWeight: 800 }}
                labelFormatter={(label) => `DAO #${label}`}
                formatter={(value: number) => [`${value} vues`, "Consultations"]}
              />
              <Bar
                dataKey="total_views"
                fill={`url(#${GRADIENT_ID})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                animationDuration={1200}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    opacity={entry.total_views === max ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

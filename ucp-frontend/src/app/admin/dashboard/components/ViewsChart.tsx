"use client";
import { ViewCount } from "@/types/adminDashboard";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";

export default function ViewsChart({ data }: { data: ViewCount[] }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Consultations par DAO
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Nombre de fois où un dossier spécifique a été visualisé.</p>
      </div>

      <div className="w-full" style={{ minHeight: "300px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="dossier_id" stroke="#94A3B8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1E293B", borderRadius: "8px", border: "none", color: "#FFF" }}
              itemStyle={{ color: "#3B82F6", fontSize: "13px" }}
              labelStyle={{ fontSize: "12px", color: "#94A3B8" }}
            />
            <Bar dataKey="total_views" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
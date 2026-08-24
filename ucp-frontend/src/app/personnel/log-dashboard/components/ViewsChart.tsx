"use client";
import { ViewCount } from "@/types/adminDashboard";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts";

export default function ViewsChart({ data }: { data: ViewCount[] }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="mb-6 pt-1">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
            1
          </div>
          Consultations par DAO
        </h3>
        <p className="text-xs text-slate-500 mt-1 ml-7">Nombre de fois où un dossier spécifique a été visualisé.</p>
      </div>

      <div className="w-full" style={{ minHeight: "300px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="dossier_id" stroke="#94A3B8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "none", color: "#FFF" }}
              itemStyle={{ color: "#3B82F6", fontSize: "13px" }}
              labelStyle={{ fontSize: "12px", color: "#94A3B8" }}
            />
            <Bar dataKey="total_views" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
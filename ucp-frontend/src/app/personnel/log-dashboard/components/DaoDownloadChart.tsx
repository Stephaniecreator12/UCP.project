"use client";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import { DaoDownload } from "@/types/adminDashboard";

const COLORS = ["#10B981", "#3B82F6", "#7C3AED", "#EC4899", "#F59E0B"];

export default function DaoDownloadChart({ data }: { data: DaoDownload[] }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-md flex flex-col">
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="mb-4 pt-1">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
            2
          </div>
          Répartition des téléchargements
        </h3>
        <p className="text-xs text-slate-500 mt-1 ml-7">Comparatif du volume de téléchargement des pièces maîtresses par dossier.</p>
      </div>

      <div className="w-full flex justify-center items-center" style={{ minHeight: "300px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total_dao_downloads"
              nameKey="dossier__title"
              outerRadius={90}
              innerRadius={60}
              paddingAngle={4}
            >
              {data.map((_: DaoDownload, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "12px" }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
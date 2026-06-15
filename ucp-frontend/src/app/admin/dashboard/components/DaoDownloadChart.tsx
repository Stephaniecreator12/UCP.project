"use client";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import { DaoDownload } from "@/types/adminDashboard";

const COLORS = ["#3B82F6", "#7C3AED", "#EC4899", "#10B981", "#F59E0B"];

export default function DaoDownloadChart({ data }: { data: DaoDownload[] }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Répartition des téléchargements
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Comparatif du volume de téléchargement des pièces maîtresses par dossier.</p>
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
              contentStyle={{ backgroundColor: "#1E293B", borderRadius: "8px", border: "none", color: "#FFF", fontSize: "12px" }}
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
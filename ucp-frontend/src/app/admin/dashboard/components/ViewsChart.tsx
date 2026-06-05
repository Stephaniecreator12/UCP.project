"use client";
import {
    ViewCount
} from "@/types/adminDashboard";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function ViewsChart({ data }: { data: ViewCount[] }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow">

      <h3 className="font-semibold mb-4">
        Consultations DAO
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="dossier_id" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="total_views"
            fill="#3B82F6"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
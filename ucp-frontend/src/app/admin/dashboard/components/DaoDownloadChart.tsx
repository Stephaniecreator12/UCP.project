"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";
import {
    DaoDownload
} from "@/types/adminDashboard";
const COLORS = [
  "#2563EB",
  "#7C3AED",
  "#EC4899",
  "#10B981",
];

export default function DaoDownloadChart({ data }: { data: DaoDownload[] }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow">

      <h3 className="font-semibold mb-4">
        Téléchargements DAO
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total_dao_downloads"
            nameKey="dossier__title"
            outerRadius={110}
          >
            {data.map((_: DaoDownload, index: number) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
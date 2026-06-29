"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/admin/TdrSt/dashboard/ui/card";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DocumentTypeData {
  name: string;
  value: number;
  color: string;
}

interface DocumentsPieChartProps {
  data?: DocumentTypeData[];
}

const DEFAULT_COLORS = ["#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec489a", "#14b8a6"];

export function DocumentsPieChart({ data: propData }: DocumentsPieChartProps) {
  const data = propData && propData.length > 0 ? propData : [];
  const hasData = data.length > 0 && data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Documents par type</CardTitle>
          <CardDescription>Classification des documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 350, minHeight: 350 }} className="flex items-center justify-center">
            <p className="text-slate-500 text-center">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Documents par type</CardTitle>
        <CardDescription>Classification des documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 350, minHeight: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithColors}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
                formatter={(value) => {
                      if (typeof value === "number") {
                        return [`${value} document${value > 1 ? "s" : ""}`, "Documents"];
                      }
                      return ["-", "Documents"];
                    }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
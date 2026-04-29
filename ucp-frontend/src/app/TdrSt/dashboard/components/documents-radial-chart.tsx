"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

interface SourceData {
  source: string;
  documents: number;
  fullMark: number;
}

interface DocumentsRadialChartProps {
  data?: SourceData[];
}

export function DocumentsRadialChart({ data: propData }: DocumentsRadialChartProps) {
  const data = propData && propData.length > 0 ? propData : [];
  const hasData = data.length > 0 && data.some((item) => item.documents > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Documents par source</CardTitle>
          <CardDescription>Répartition par source de financement</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 350, minHeight: 350 }} className="flex items-center justify-center">
            <p className="text-slate-500 text-center">Aucune donnée disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxDocuments = Math.max(...data.map((d) => d.documents), 1);
  const dataWithFullMark = data.map((item) => ({
    ...item,
    fullMark: Math.ceil(maxDocuments / 10) * 10,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Documents par source</CardTitle>
        <CardDescription>Répartition par source de financement</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 350, minHeight: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataWithFullMark}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="source"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
              />
              <Radar
                name="Documents"
                dataKey="documents"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.25}
                strokeWidth={2}
              />
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
                formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
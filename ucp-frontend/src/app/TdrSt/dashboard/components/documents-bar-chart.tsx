"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/TdrSt/dashboard/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MonthlyData {
  month: string;
  count: number;
}

interface DocumentsBarChartProps {
  data?: MonthlyData[];
}

export function DocumentsBarChart({ data: propData }: DocumentsBarChartProps) {
  const defaultData: MonthlyData[] = [
    { month: "Jan", count: 0 }, { month: "Fév", count: 0 }, { month: "Mar", count: 0 },
    { month: "Avr", count: 0 }, { month: "Mai", count: 0 }, { month: "Juin", count: 0 },
    { month: "Juil", count: 0 }, { month: "Aoû", count: 0 }, { month: "Sep", count: 0 },
    { month: "Oct", count: 0 }, { month: "Nov", count: 0 }, { month: "Déc", count: 0 },
  ];

  const data = propData && propData.length > 0 ? propData : defaultData;
  const hasData = data.some((item) => item.count > 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-slate-900">Documents déposés</CardTitle>
        <CardDescription>
          Nombre de documents déposés par mois {hasData ? "(base de données)" : "(données non disponibles)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 350, minHeight: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,23,42,0.04)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
                formatter={(value) => {
                    if (typeof value === "number") {
                      return [`${value} document${value > 1 ? "s" : ""}`, "Dépôts"];
                    }
                    return ["-", "Dépôts"];
                  }}
              />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!hasData && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Aucune donnée disponible pour la période affichée.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

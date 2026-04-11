"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { source: "Subventions", documents: 245, fullMark: 300 },
  { source: "Prêts bancaires", documents: 189, fullMark: 300 },
  { source: "Fonds propres", documents: 156, fullMark: 300 },
  { source: "Investisseurs", documents: 210, fullMark: 300 },
  { source: "Crowdfunding", documents: 78, fullMark: 300 },
  { source: "Aides publiques", documents: 278, fullMark: 300 },
]

export function DocumentsRadialChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Documents par source</CardTitle>
        <CardDescription>Répartition par source de financement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="source" tick={{ fill: "#64748b", fontSize: 11 }} />
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
                  color: "#0f172a",
                  boxShadow: "0 10px 30px -18px rgba(6,20,34,0.55)",
                }}
                labelStyle={{ color: "#64748b", fontWeight: 700 }}
              />
              <Legend formatter={(value) => <span className="text-sm text-slate-700">{value}</span>} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

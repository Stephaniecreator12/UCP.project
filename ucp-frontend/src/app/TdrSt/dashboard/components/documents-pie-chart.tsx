"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Factures", value: 420, color: "#22c55e" },
  { name: "Contrats", value: 285, color: "#0ea5e9" },
  { name: "Rapports", value: 198, color: "#f59e0b" },
  { name: "Devis", value: 156, color: "#ef4444" },
  { name: "Autres", value: 97, color: "#8b5cf6" },
]

export function DocumentsPieChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Documents par type</CardTitle>
        <CardDescription>Classification des documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
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
  )
}

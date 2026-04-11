"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Jan", documents: 186 },
  { month: "Fév", documents: 305 },
  { month: "Mar", documents: 237 },
  { month: "Avr", documents: 273 },
  { month: "Mai", documents: 209 },
  { month: "Juin", documents: 314 },
  { month: "Juil", documents: 256 },
  { month: "Aoû", documents: 178 },
  { month: "Sep", documents: 342 },
  { month: "Oct", documents: 291 },
  { month: "Nov", documents: 267 },
  { month: "Déc", documents: 198 },
]

export function DocumentsBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Documents déposés</CardTitle>
        <CardDescription>Nombre de documents déposés par mois (base de données)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                stroke="currentColor"
                className="text-slate-500"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-slate-500"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,23,42,0.04)" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  color: "#0f172a",
                  boxShadow: "0 10px 30px -18px rgba(6,20,34,0.55)",
                }}
                labelStyle={{ color: "#64748b", fontWeight: 700 }}
              />
              <Bar dataKey="documents" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

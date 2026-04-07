"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

const data = [
  { name: "Factures", value: 420, color: "oklch(0.65 0.18 200)" },
  { name: "Contrats", value: 285, color: "oklch(0.75 0.15 85)" },
  { name: "Rapports", value: 198, color: "oklch(0.6 0.15 150)" },
  { name: "Devis", value: 156, color: "oklch(0.7 0.18 35)" },
  { name: "Autres", value: 97, color: "oklch(0.55 0.15 300)" },
]

export function DocumentsPieChart() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">Documents par type</CardTitle>
        <CardDescription className="text-muted-foreground">
          Classification des documents
        </CardDescription>
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

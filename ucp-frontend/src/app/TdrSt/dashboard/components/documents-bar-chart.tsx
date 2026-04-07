"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { month: "Jan", documents: 186 },
  { month: "Fév", documents: 305 },
  { month: "Mar", documents: 237 },
  { month: "Avr", documents: 273 },
  { month: "Mai", documents: 209 },
  { month: "Jun", documents: 314 },
  { month: "Jul", documents: 256 },
  { month: "Aoû", documents: 178 },
  { month: "Sep", documents: 342 },
  { month: "Oct", documents: 291 },
  { month: "Nov", documents: 267 },
  { month: "Déc", documents: 198 },
]

export function DocumentsBarChart() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">Documents déposés</CardTitle>
        <CardDescription className="text-muted-foreground">
          Nombre de documents déposés par mois (Base de données)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                labelStyle={{ color: 'oklch(0.65 0 0)' }}
              />
              <Bar 
                dataKey="documents" 
                fill="oklch(0.65 0.18 200)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

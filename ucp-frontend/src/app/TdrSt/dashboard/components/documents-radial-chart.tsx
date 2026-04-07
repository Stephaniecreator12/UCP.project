"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

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
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">Documents par source</CardTitle>
        <CardDescription className="text-muted-foreground">
          Répartition par source de financement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="oklch(0.28 0.01 260)" />
              <PolarAngleAxis 
                dataKey="source" 
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              />
              <Radar
                name="Documents"
                dataKey="documents"
                stroke="oklch(0.65 0.18 200)"
                fill="oklch(0.65 0.18 200)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.01 260)',
                  border: '1px solid oklch(0.28 0.01 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
              />
              <Legend 
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

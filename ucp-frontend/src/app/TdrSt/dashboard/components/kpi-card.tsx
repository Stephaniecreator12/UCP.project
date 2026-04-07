"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/TdrSt/dashboard/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  threshold?: {
    warning: number
    danger: number
  }
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
}

export function KPICard({ title, value, unit, threshold, trend, icon }: KPICardProps) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value
  
  const getStatusColor = () => {
    if (!threshold) return "text-primary"
    if (numericValue >= threshold.danger) return "text-destructive"
    if (numericValue >= threshold.warning) return "text-accent"
    return "text-chart-3"
  }

  const getStatusBg = () => {
    if (!threshold) return "bg-primary/10"
    if (numericValue >= threshold.danger) return "bg-destructive/10"
    if (numericValue >= threshold.warning) return "bg-accent/10"
    return "bg-chart-3/10"
  }

  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("rounded-lg p-2", getStatusBg())}>
          {icon || <Clock className={cn("h-4 w-4", getStatusColor())} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold", getStatusColor())}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-chart-3" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={trend.isPositive ? "text-chart-3" : "text-destructive"}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground">vs mois précédent</span>
          </div>
        )}
        {threshold && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted">
              <div 
                className={cn("h-1.5 rounded-full transition-all", getStatusBg().replace('/10', ''))}
                style={{ 
                  width: `${Math.min((numericValue / threshold.danger) * 100, 100)}%` 
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              seuil: {threshold.warning}j
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

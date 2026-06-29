"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/admin/TdrSt/dashboard/ui/card"
import { cn } from "@/lib/utils"
import { Clock, TrendingDown, TrendingUp } from "lucide-react"

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
    if (!threshold) return "text-emerald-700"
    if (numericValue >= threshold.danger) return "text-rose-700"
    if (numericValue >= threshold.warning) return "text-amber-700"
    return "text-emerald-700"
  }

  const getStatusBg = () => {
    if (!threshold) return "bg-emerald-50 border-emerald-100"
    if (numericValue >= threshold.danger) return "bg-rose-50 border-rose-100"
    if (numericValue >= threshold.warning) return "bg-amber-50 border-amber-100"
    return "bg-emerald-50 border-emerald-100"
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-600">{title}</CardTitle>
        <div className={cn("rounded-xl border p-2.5", getStatusBg())}>
          {icon || <Clock className={cn("h-4 w-4", getStatusColor())} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold", getStatusColor())}>{value}</span>
          {unit ? <span className="text-sm text-slate-600">{unit}</span> : null}
        </div>

        {trend ? (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-700" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-700" />
            )}
            <span className={trend.isPositive ? "text-emerald-700" : "text-rose-700"}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-slate-500">vs mois précédent</span>
          </div>
        ) : null}

        {threshold ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200">
              <div
                className={cn("h-1.5 rounded-full transition-all", getStatusColor().replace("text-", "bg-"))}
                style={{ width: `${Math.min((numericValue / threshold.danger) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">seuil: {threshold.warning}j</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

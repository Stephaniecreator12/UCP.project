import { DashboardHeader } from "@/TdrSt/dashboard/components/dashboard-header"
import { KPICard } from "@/TdrSt/dashboard/components/kpi-card"
import { DocumentsBarChart } from "@/TdrSt/dashboard/components/documents-bar-chart"
import { DocumentsPieChart } from "@/TdrSt/dashboard/components/documents-pie-chart"
import { DocumentsRadialChart } from "@/TdrSt/dashboard/components/documents-radial-chart"
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader />
        
        {/* KPI Cards Row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Documents ce mois"
            value={342}
            icon={<FileText className="h-4 w-4 text-primary" />}
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Délai moyen validation"
            value={4.2}
            unit="jours"
            icon={<Clock className="h-4 w-4 text-accent" />}
            threshold={{ warning: 5, danger: 7 }}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Documents validés"
            value={287}
            icon={<CheckCircle className="h-4 w-4 text-chart-3" />}
            trend={{ value: 15, isPositive: true }}
          />
          <KPICard
            title="En attente"
            value={55}
            icon={<AlertTriangle className="h-4 w-4 text-chart-4" />}
            trend={{ value: 3, isPositive: false }}
          />
        </div>

        {/* Charts Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Bar Chart - Documents déposés par mois */}
          <div className="lg:col-span-2">
            <DocumentsBarChart />
          </div>
          
          {/* Pie Chart - Documents par type */}
          <DocumentsPieChart />
          
          {/* Radial Chart - Documents par source de financement */}
          <DocumentsRadialChart />
        </div>

        {/* Footer Stats */}
        <div className="mt-8 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">3,056</p>
              <p className="text-sm text-muted-foreground">Total documents (année)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-3">94.2%</p>
              <p className="text-sm text-muted-foreground">Taux de validation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">6</p>
              <p className="text-sm text-muted-foreground">Sources de financement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

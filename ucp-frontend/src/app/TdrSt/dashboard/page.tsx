import TopHeader from "@/app/components/TopHeader"
import { DocumentsBarChart } from "@/TdrSt/dashboard/components/documents-bar-chart"
import { DocumentsPieChart } from "@/TdrSt/dashboard/components/documents-pie-chart"
import { DocumentsRadialChart } from "@/TdrSt/dashboard/components/documents-radial-chart"
import { KPICard } from "@/TdrSt/dashboard/components/kpi-card"
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopHeader />

      <main className="w-full px-4 py-6 md:px-9 md:py-8">
        <div className="w-full space-y-6" style={{ maxInlineSize: "calc(100% - 2cm)", marginInline: "auto" }}>
          <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-2xl border-t-4 border-t-emerald-600 px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <Link
                    href="/TdrSt/formulaire"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span aria-hidden="true">←</span>
                    Retour au formulaire
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                      <FileText className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">Dashboard TdR/ST</h1>
                      <p className="mt-0.5 text-sm text-slate-600">Tableau de bord des indicateurs</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="hidden sm:inline">30 derniers jours</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="hidden sm:inline">Actualiser</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">3,056</p>
                <p className="text-sm text-slate-600">Total documents (année)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">94.2%</p>
                <p className="text-sm text-slate-600">Taux de validation</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">6</p>
                <p className="text-sm text-slate-600">Sources de financement</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Documents ce mois"
              value={342}
              icon={<FileText className="h-4 w-4 text-emerald-700" />}
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              title="Délai moyen validation"
              value={4.2}
              unit="jours"
              icon={<Clock className="h-4 w-4 text-amber-700" />}
              threshold={{ warning: 5, danger: 7 }}
              trend={{ value: 8, isPositive: true }}
            />
            <KPICard
              title="Documents validés"
              value={287}
              icon={<CheckCircle className="h-4 w-4 text-emerald-700" />}
              trend={{ value: 15, isPositive: true }}
            />
            <KPICard
              title="En attente"
              value={55}
              icon={<AlertTriangle className="h-4 w-4 text-amber-700" />}
              trend={{ value: 3, isPositive: false }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <DocumentsBarChart />
            </div>
            <DocumentsPieChart />
            <DocumentsRadialChart />
          </div>

          
        </div>
      </main>
    </div>
  )
}

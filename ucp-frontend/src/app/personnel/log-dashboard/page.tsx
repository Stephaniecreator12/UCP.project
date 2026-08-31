"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/config";
import {
  Eye,
  Download,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Activity,
} from "lucide-react";
import StatCard from "@/app/personnel/log-dashboard/components/StatCard";
import ViewsChart from "@/app/personnel/log-dashboard/components/ViewsChart";
import DaoDownloadChart from "@/app/personnel/log-dashboard/components/DaoDownloadChart";
import AnnexesTable from "@/app/personnel/log-dashboard/components/AnnexesTable";
import MonitoringPanel from "@/app/personnel/log-dashboard/components/MonitoringPanel";
import UsersTraceability from "@/app/personnel/log-dashboard/components/UsersTraceability";
import { getToken } from "@/services/auth";
import TopHeader from "@/app/components/TopHeader";
import {
  ViewCount,
  DaoDownload,
  AnnexeRatio,
  MonitoringData,
  UserTraceability,
} from "@/types/adminDashboard";

export default function AdminDashboardPage() {
  const [views, setViews] = useState<ViewCount[]>([]);
  const [downloads, setDownloads] = useState<DaoDownload[]>([]);
  const [annexes, setAnnexes] = useState<AnnexeRatio[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [users, setUsers] = useState<UserTraceability[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      api.get("/logs/views-count/", { headers }),
      api.get("/logs/dao-downloads/", { headers }),
      api.get("/logs/annexes-ratios/", { headers }),
      api.get("/logs/monitoring/", { headers }),
      api.get("/logs/individual/", { headers }),
    ]).then(
      ([viewsRes, downloadsRes, annexesRes, monitoringRes, usersRes]) => {
        setViews(viewsRes.data.data);
        setDownloads(downloadsRes.data.data);
        setAnnexes(annexesRes.data.data);

        const rawMonitoring =
          monitoringRes.data?.data || monitoringRes.data;
        if (Array.isArray(rawMonitoring)) {
          setMonitoring(rawMonitoring.length > 0 ? rawMonitoring[0] : null);
        } else if (rawMonitoring) {
          setMonitoring(rawMonitoring);
        } else {
          setMonitoring(null);
        }

        setUsers(usersRes.data.data);
        setTimeout(() => setLoaded(true), 80);
      }
    );
  }, []);

  const totalViews = views.reduce(
    (acc: number, item: ViewCount) => acc + item.total_views,
    0
  );
  const totalDownloads = downloads.reduce(
    (acc: number, item: DaoDownload) => acc + item.total_dao_downloads,
    0
  );
  const conversion =
    totalViews > 0
      ? ((totalDownloads / totalViews) * 100).toFixed(1)
      : "0";
  const closureRate = monitoring?.closure_rate ?? 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
        {/* Header Block */}
        <div
          className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-500 md:flex-row md:items-center ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100/60 to-teal-50/40 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />

          <div className="relative z-10 flex min-w-0 items-center gap-3.5">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-400 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                Tableau de bord d&apos;administration
              </h1>
              <p className="text-xs font-semibold text-slate-400">
                Suivi des performances, traçabilité et monitoring des DAO
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 md:mt-0">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {views.length} DAO suivis
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {users.length} entreprises actives
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className={`transition-all duration-500 delay-100 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <StatCard
              title="Consultations"
              value={totalViews}
              description="Vues totales sur les dossiers"
              icon={<Eye className="h-5 w-5" size={20} />}
              accent="blue"
            />
          </div>
          <div
            className={`transition-all duration-500 delay-200 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <StatCard
              title="Téléchargements DAO"
              value={totalDownloads}
              description="Dossiers complets récupérés"
              icon={<Download className="h-5 w-5" size={20} />}
              accent="purple"
            />
          </div>
          <div
            className={`transition-all duration-500 delay-300 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <StatCard
              title="Taux de conversion"
              value={`${conversion}%`}
              description="Ratio téléchargements / vues"
              icon={<BarChart3 className="h-5 w-5" size={20} />}
              accent="pink"
            />
          </div>
          <div
            className={`transition-all duration-500 delay-[400ms] ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <StatCard
              title="Taux de clôture"
              value={`${closureRate}%`}
              description="Dossiers finalisés"
              icon={<CheckCircle2 className="h-5 w-5" size={20} />}
              accent="emerald"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div
          className={`grid grid-cols-1 gap-5 lg:grid-cols-2 transition-all duration-500 delay-500 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <ViewsChart data={views} />
          <DaoDownloadChart data={downloads} />
        </div>

        {/* Panels Row */}
        <div
          className={`grid grid-cols-1 gap-5 lg:grid-cols-2 transition-all duration-500 delay-[600ms] ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <AnnexesTable data={annexes} />
          <MonitoringPanel data={monitoring} />
        </div>

        {/* Users Traceability */}
        <div
          className={`transition-all duration-500 delay-700 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <UsersTraceability users={users} />
        </div>
      </div>
    </main>
  );
}

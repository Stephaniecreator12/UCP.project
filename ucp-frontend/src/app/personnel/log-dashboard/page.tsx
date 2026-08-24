"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/config";
import { Eye, Download, BarChart3, CheckCircle2, Layers, Sparkles } from "lucide-react";
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
    UserTraceability
} from "@/types/adminDashboard";
export default function AdminDashboardPage() {
    const [views, setViews] = useState<ViewCount[]>([]);
    const [downloads, setDownloads] = useState<DaoDownload[]>([]);
    const [annexes, setAnnexes] = useState<AnnexeRatio[]>([]);
    const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
    const [users, setUsers] = useState<UserTraceability[]>([]);

    useEffect(() => {
        const token = getToken();

        const headers = {
            Authorization: `Bearer ${token}`,
        };

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
                setMonitoring(monitoringRes.data.data);
                setUsers(usersRes.data.data);
                const rawMonitoring = monitoringRes.data?.data || monitoringRes.data;
                if (Array.isArray(rawMonitoring)) {
                    setMonitoring(rawMonitoring.length > 0 ? rawMonitoring[0] : null);
                } else if (rawMonitoring) {
                    setMonitoring(rawMonitoring);
                } else {
                    setMonitoring(null);
                }
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
            ? ((totalDownloads / totalViews) * 100).toFixed(2)
            : 0;

    return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
        <TopHeader />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">
        {/* Header Block */}
        <div className="group relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgb(0,0,0,0.035)] md:flex-row md:items-center">
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-110" />

          <div className="relative z-10 flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <BarChart3 className="h-4 w-4" />
              </div>
              <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <h1 className="truncate text-lg font-black tracking-tight text-slate-800">
                Tableau de bord d&apos;administration
              </h1>
              <p className="text-[12px] font-semibold text-slate-500">
                Suivi des performances, traçabilité et monitoring des DAO
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Consultations" 
            value={totalViews} 
            description="Total des vues sur les dossiers"
            icon={<Eye className="text-blue-600" size={20} />}
          />
          <StatCard 
            title="Téléchargements DAO" 
            value={totalDownloads} 
            description="Dossiers complets récupérés"
            icon={<Download className="text-purple-600" size={20} />}
          />
          <StatCard 
            title="Taux de conversion" 
            value={`${conversion}%`} 
            description="Ratio Téléchargements / Vues"
            icon={<BarChart3 className="text-pink-600" size={20} />}
          />
          <StatCard
            title="Taux de clôture"
            value={`${monitoring?.closure_rate ?? 0}%`}
            description="Dossiers finalisés à temps"
            icon={<CheckCircle2 className="text-emerald-600" size={20} />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ViewsChart data={views} />
          <DaoDownloadChart data={downloads} />
        </div>

        {/* Panels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnnexesTable data={annexes} />
          <MonitoringPanel data={monitoring} />
        </div>

        {/* Users Traceability */}
        <UsersTraceability users={users} />
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/config";
import { Eye, Download, BarChart3, CheckCircle2 } from "lucide-react";
import StatCard from "@/app/admin/dashboard/components/StatCard";
import ViewsChart from "@/app/admin/dashboard/components/ViewsChart";
import DaoDownloadChart from "@/app/admin/dashboard/components/DaoDownloadChart";
import AnnexesTable from "@/app/admin/dashboard/components/AnnexesTable";
import MonitoringPanel from "@/app/admin/dashboard/components/MonitoringPanel";
import UsersTraceability from "@/app/admin/dashboard/components/UsersTraceability";
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
    <div className="w-full min-h-screen bg-slate-50/50 flex flex-col">
      <div className="w-full bg-white border-b border-slate-200/80">
        <TopHeader />
      </div>

      <div className="w-full flex-1 py-10 px-6 md:px-12 lg:px-16 flex flex-col gap-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tableau de bord d administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des performances, traçabilité des entreprises et monitoring des Dossiers d Appel d Offres (DAO).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ViewsChart data={views} />
          <DaoDownloadChart data={downloads} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnnexesTable data={annexes} />
          <MonitoringPanel data={monitoring} />
        </div>

        <UsersTraceability users={users} />
      </div>
    </div>
  );
}
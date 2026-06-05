"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/config";

import StatCard from "@/app/admin/dashboard/components/StatCard";
import ViewsChart from "@/app/admin/dashboard/components/ViewsChart";
import DaoDownloadChart from "@/app/admin/dashboard/components/DaoDownloadChart";
import AnnexesTable from "@/app/admin/dashboard/components/AnnexesTable";
import MonitoringPanel from "@/app/admin/dashboard/components/MonitoringPanel";
import UsersTraceability from "@/app/admin/dashboard/components/UsersTraceability";
import { getToken } from "@/services/auth";
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
                setMonitoring(monitoringRes.data.data[0]);
                setUsers(usersRes.data.data);
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
        <div className="p-8 bg-slate-50 min-h-screen">

            <h1 className="text-3xl font-bold mb-8">
                Dashboard DAO
            </h1>

            <div className="grid grid-cols-4 gap-6 mb-8">
                <StatCard title="Consultations" value={totalViews} />
                <StatCard title="Téléchargements DAO" value={totalDownloads} />
                <StatCard title="Conversion" value={`${conversion}%`} />
                <StatCard
                    title="Taux clôture"
                    value={`${monitoring?.closure_rate ?? 0}%`}
                />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <ViewsChart data={views} />
                <DaoDownloadChart data={downloads} />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <AnnexesTable data={annexes} />
                <MonitoringPanel data={monitoring} />
            </div>

            <UsersTraceability users={users} />
        </div>
    );
}
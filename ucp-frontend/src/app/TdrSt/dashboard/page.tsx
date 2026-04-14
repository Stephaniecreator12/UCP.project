"use client";

import { useEffect, useState } from "react";
import TopHeader from "@/app/components/TopHeader";
import { DocumentsBarChart } from "@/TdrSt/dashboard/components/documents-bar-chart";
import { DocumentsPieChart } from "@/TdrSt/dashboard/components/documents-pie-chart";
import { DocumentsRadialChart } from "@/TdrSt/dashboard/components/documents-radial-chart";
import { KPICard } from "@/TdrSt/dashboard/components/kpi-card";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalDocumentsYear: number;
  validationRate: number;
  financementSourcesCount: number;
  monthlyDocuments: { month: string; count: number }[];
  documentsByType: { name: string; value: number; color: string }[];
  documentsBySource: { source: string; documents: number; fullMark: number }[];
  kpis: {
    currentMonth: { value: number; trend: number };
    avgDelay: { value: number; unit: string; trend: number; warningThreshold: number; dangerThreshold: number };
    validated: { value: number; trend: number };
    pending: { value: number; trend: number };
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAccessToken = () => {
    // JWT access token est stocké ici
    return localStorage.getItem("access_token");
  };

  const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return null;

    try {
      const response = await fetch("/api/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access);
        return data.access;
      }
    } catch (err) {
      console.error("Refresh token error:", err);
    }
    return null;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      let token = getAccessToken();

      if (!token) {
        throw new Error("Aucun token d'authentification trouvé. Veuillez vous connecter.");
      }

      let response = await fetch("/api/TdrSt/dashboard/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // Si token expiré (401), essayer de le rafraîchir
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          response = await fetch("/api/TdrSt/dashboard/", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newToken}`,
            },
          });
        } else {
          // Refresh failed, rediriger vers login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("L'API n'a pas retourné du JSON");
      }

      const result = await response.json();
      setStats(result);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopHeader />
        <main className="w-full px-4 py-6 md:px-9 md:py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Chargement des données...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopHeader />
        <main className="w-full px-4 py-6 md:px-9 md:py-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur d&apos;authentification</h2>
            <p className="text-red-600">{error}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Aller à la page de connexion
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) return null;

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
                      <p className="mt-0.5 text-sm text-slate-600">Tableau de bord des indicateurs - Vision globale</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={fetchDashboardData}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </header>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.totalDocumentsYear}</p>
                <p className="text-sm text-slate-600">Total documents (année)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">{(stats.validationRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-slate-600">Taux de validation</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.financementSourcesCount}</p>
                <p className="text-sm text-slate-600">Sources de financement</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Documents ce mois"
              value={stats.kpis.currentMonth.value}
              icon={<FileText className="h-4 w-4 text-emerald-700" />}
              trend={{ value: stats.kpis.currentMonth.trend, isPositive: true }}
            />
            <KPICard
              title="Délai moyen validation"
              value={stats.kpis.avgDelay.value}
              unit={stats.kpis.avgDelay.unit}
              icon={<Clock className="h-4 w-4 text-amber-700" />}
              threshold={{
                warning: stats.kpis.avgDelay.warningThreshold,
                danger: stats.kpis.avgDelay.dangerThreshold,
              }}
              trend={{ value: stats.kpis.avgDelay.trend, isPositive: true }}
            />
            <KPICard
              title="Documents validés"
              value={stats.kpis.validated.value}
              icon={<CheckCircle className="h-4 w-4 text-emerald-700" />}
              trend={{ value: stats.kpis.validated.trend, isPositive: true }}
            />
            <KPICard
              title="En attente"
              value={stats.kpis.pending.value}
              icon={<AlertTriangle className="h-4 w-4 text-amber-700" />}
              trend={{ value: stats.kpis.pending.trend, isPositive: false }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <DocumentsBarChart data={stats.monthlyDocuments} />
            </div>
            <DocumentsPieChart data={stats.documentsByType} />
            <DocumentsRadialChart data={stats.documentsBySource} />
          </div>
        </div>
      </main>
    </div>
  );
}
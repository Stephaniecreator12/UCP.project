"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import TopHeader from "@/app/components/TopHeader";
import { getCurrentUser, getToken } from "@/services/auth";
import { listMarkets } from "@/services/procurement";
import type { ProcurementMarket } from "@/types/procurement";

const PROCEDURE_LABELS: Record<string, string> = {
  AOI: "AOI",
  AON: "AON",
  DC: "DC",
  GRE_A_GRE: "Gré à gré",
};

const CATEGORY_LABELS: Record<string, string> = {
  BIENS: "Biens",
  SERVICES: "Services",
  INFRA: "Infrastructures",
};

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publié",
  CANCELLED: "Annulé",
  CLOSED: "Clôturé",
};

const STATUS_BADGES: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  CLOSED: "bg-slate-200 text-slate-700 border-slate-300",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function DaoDcDashboardPage() {
  const router = useRouter();
  const [currentUser] = useState(() => getCurrentUser());
  const [markets, setMarkets] = useState<ProcurementMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await listMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les dossiers DAO / DC.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const stats = useMemo(() => {
    const published = markets.filter((item) => item.status === "PUBLISHED").length;
    const cancelled = markets.filter((item) => item.status === "CANCELLED").length;
    const closed = markets.filter((item) => item.status === "CLOSED").length;

    return [
      {
        label: "Publiés",
        value: published,
        tone: "from-emerald-500 to-teal-600",
      },
      {
        label: "Annulés",
        value: cancelled,
        tone: "from-rose-500 to-red-600",
      },
      {
        label: "Clôturés",
        value: closed,
        tone: "from-slate-500 to-slate-700",
      },
    ];
  }, [markets]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <TopHeader />

      <div className="mx-auto max-w-[1320px] px-4 py-8">
        <section className="mb-8 rounded-[30px] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                Passation des marchés
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                DAO / Demande de Cotation
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Prépare les dossiers internes UCP, complète le financement, le calendrier,
                les pièces techniques et la publication publique depuis un seul module.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500">
                Connecté en tant que{" "}
                <span className="text-slate-800">
                  {currentUser?.first_name || currentUser?.username || "Utilisateur"}
                </span>
              </p>
            </div>

            <Link
              href="/dao-dc/nouveau"
              className="btn-primary w-full sm:w-auto"
            >
              Nouveau dossier DAO / DC
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[24px] border border-white/60 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)]"
            >
              <div
                className={`mb-4 inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white ${stat.tone}`}
              >
                {stat.label}
              </div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">
                Dossiers actuellement enregistrés
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_46px_-34px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              Tableau des dossiers DAO / DC
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vue d’ensemble des dossiers créés et de leur publication.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Chargement des dossiers DAO / DC...
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : markets.length === 0 ? (
            <div className="px-6 py-12">
              <p className="text-base font-semibold text-slate-700">
                Aucun dossier DAO / DC enregistré pour le moment.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Commence par créer un nouveau dossier pour lancer le workflow.
              </p>
              <Link
                href="/dao-dc/nouveau"
                className="btn-primary mt-5 inline-flex"
              >
                Créer le premier dossier
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Référence</th>
                    <th className="px-6 py-4">Marché</th>
                    <th className="px-6 py-4">Procédure</th>
                    <th className="px-6 py-4">Catégorie</th>
                    <th className="px-6 py-4">Date limite</th>
                    <th className="px-6 py-4">Pièces</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {markets.map((market) => (
                    <tr key={market.id} className="align-top">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {market.reference_number}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Créé le {formatDateTime(market.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {market.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Code projet : {market.project_code || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {PROCEDURE_LABELS[market.procedure_type] || market.procedure_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {CATEGORY_LABELS[market.category] || market.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDateTime(market.deadline)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <p>{market.technical_documents.length} doc. technique(s)</p>
                        <p>{market.annexes.length} annexe(s)</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_BADGES[market.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                        >
                          {STATUS_LABELS[market.status] || market.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

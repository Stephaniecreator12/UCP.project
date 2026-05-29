"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  FileText,
  FolderKanban,
  Layers3,
  XCircle,
} from "lucide-react";

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
  PUBLISHED: "border-[#bce9cd] bg-[#e6f8ef] text-[#0c6f3d]",
  CANCELLED: "border-[#f6c8c8] bg-[#fde9e9] text-[#8d2525]",
  CLOSED: "border-[#cfd6dd] bg-[#f0f2f4] text-[#435161]",
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
    const technicalDocuments = markets.reduce(
      (total, item) => total + item.technical_documents.length,
      0,
    );
    const annexes = markets.reduce((total, item) => total + item.annexes.length, 0);

    return [
      {
        icon: FolderKanban,
        label: "Dossiers",
        value: markets.length,
        helper: "DAO/DC enregistrés",
        className: "border-[#d9dee3] bg-[#f6f7f8] text-[#0c7340]",
      },
      {
        icon: CheckCircle2,
        label: "Publiés",
        value: published,
        helper: "Visibles sur le portail",
        className: "border-[#bce9cd] bg-[#e6f8ef] text-[#0c6f3d]",
      },
      {
        icon: XCircle,
        label: "Annulés",
        value: cancelled,
        helper: "Sans ouverture possible",
        className: "border-[#f6c8c8] bg-[#fde9e9] text-[#8d2525]",
      },
      {
        icon: Layers3,
        label: "Clôturés",
        value: closed,
        helper: "Dépôt terminé",
        className: "border-[#cfd6dd] bg-[#f0f2f4] text-[#435161]",
      },
      {
        icon: FileText,
        label: "Pièces",
        value: technicalDocuments + annexes,
        helper: `${technicalDocuments} techniques · ${annexes} annexes`,
        className: "border-[#d9dee3] bg-white text-[#17212e]",
      },
    ];
  }, [markets]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#eceeef_0%,#e8eaed_100%)] text-[#17212e]">
      <TopHeader />

      <div className="page-enter mx-auto flex max-w-[1480px] flex-col gap-4 px-4 pb-8 pt-4 md:px-8">
        <section className="page-enter-up relative grid gap-4 rounded-[14px] border border-[#d9dee3] bg-white px-4 py-4 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-[14px] bg-gradient-to-r from-[#0ea85b] to-[#57d18d]"
            aria-hidden="true"
          />

          <div className="min-w-0 pt-1">
            <p className="m-0 text-[0.7rem] uppercase tracking-[0.05em] text-[#627080]">
              UCP · Passation de marchés
            </p>
            <h1 className="my-[0.32rem] text-[1.35rem] font-bold tracking-[0.04em] text-[#0c7340]">
              DAO / Demande de Cotation
            </h1>
            <p className="max-w-3xl text-[0.85rem] font-medium leading-6 text-[#627080]">
              Tableau des DAO/DC créés depuis le formulaire interne, avec suivi de
              publication, date limite et pièces déposées.
            </p>
            <p className="mt-2 text-[0.78rem] font-semibold text-[#627080]">
              Connecté en tant que{" "}
              <span className="text-[#17212e]">
                {currentUser?.first_name || currentUser?.username || "Utilisateur"}
              </span>
            </p>
          </div>

          <Link
            href="/dao-dc/nouveau"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-[#76cba0] bg-[linear-gradient(180deg,#15ba66,#078848)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105"
          >
            <FilePlus2 className="h-4 w-4" />
            Créer DAO
          </Link>
        </section>

        <section
          className="page-enter-up grid gap-3 md:grid-cols-5"
          style={{ animationDelay: "0.08s" }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className={`rounded-[14px] border px-4 py-3 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] ${stat.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.05em] opacity-75">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 opacity-80" />
                </div>
                <strong className="mt-1 block text-[1.45rem] leading-none">
                  {stat.value}
                </strong>
                <p className="mt-1 text-[0.72rem] font-semibold opacity-75">
                  {stat.helper}
                </p>
              </article>
            );
          })}
        </section>

        <section
          className="page-enter-up overflow-hidden rounded-[14px] border border-[#d9dee3] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)]"
          style={{ animationDelay: "0.14s" }}
        >
          <div className="flex flex-col gap-3 border-b border-[#d9dee3] bg-[#f6f7f8] px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[1rem] font-bold tracking-[0.03em] text-[#17212e]">
                Tableau des dossiers DAO / DC
              </h2>
              <p className="mt-1 text-[0.78rem] font-medium text-[#627080]">
                Vue opérationnelle des dossiers publiés avant l’ouverture des offres.
              </p>
            </div>
            <Link
              href="/dao-dc/nouveau"
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full border border-[#76cba0] bg-white px-4 py-2 text-xs font-bold text-[#0c7340] transition hover:bg-[#e6f8ef]"
            >
              <FilePlus2 className="h-4 w-4" />
              Nouveau dossier
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center px-6 py-10 text-sm font-semibold text-[#627080]">
              Chargement des dossiers DAO / DC...
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-sm font-semibold text-[#8d2525]">
              {error}
            </div>
          ) : markets.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center px-6 py-12 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d9dee3] bg-[#f6f7f8] text-[#0c7340]">
                  <FilePlus2 className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-bold text-[#17212e]">
                  Aucun dossier DAO / DC enregistré pour le moment.
                </p>
                <p className="mt-2 text-sm font-medium text-[#627080]">
                  Crée le premier dossier pour alimenter le dashboard d’ouverture.
                </p>
                <Link
                  href="/dao-dc/nouveau"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-[#76cba0] bg-[linear-gradient(180deg,#15ba66,#078848)] px-5 py-2.5 text-sm font-bold text-white"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Créer DAO
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-white text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#627080]">
                    <th className="border-b border-[#d9dee3] px-4 py-3">Référence</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Marché</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Procédure</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Catégorie</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Date limite</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Pièces</th>
                    <th className="border-b border-[#d9dee3] px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((market) => (
                    <tr
                      key={market.id}
                      className="align-top transition-colors hover:bg-[#f6faf8]"
                    >
                      <td className="border-b border-[#eef1f3] px-4 py-3">
                        <p className="font-bold text-[#17212e]">
                          {market.reference_number}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#627080]">
                          Créé le {formatDateTime(market.created_at)}
                        </p>
                      </td>
                      <td className="max-w-[360px] border-b border-[#eef1f3] px-4 py-3">
                        <p className="font-bold leading-5 text-[#17212e]">
                          {market.title}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#627080]">
                          Code projet : {market.project_code || "-"}
                        </p>
                      </td>
                      <td className="border-b border-[#eef1f3] px-4 py-3 text-sm font-semibold text-[#435161]">
                        {PROCEDURE_LABELS[market.procedure_type] ||
                          market.procedure_type ||
                          "-"}
                      </td>
                      <td className="border-b border-[#eef1f3] px-4 py-3 text-sm font-semibold text-[#435161]">
                        {CATEGORY_LABELS[market.category] || market.category || "-"}
                      </td>
                      <td className="border-b border-[#eef1f3] px-4 py-3 text-sm font-semibold text-[#435161]">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-[#0c7340]" />
                          {formatDateTime(market.deadline)}
                        </span>
                      </td>
                      <td className="border-b border-[#eef1f3] px-4 py-3 text-sm font-semibold text-[#627080]">
                        <p>{market.technical_documents.length} doc. technique(s)</p>
                        <p>{market.annexes.length} annexe(s)</p>
                      </td>
                      <td className="border-b border-[#eef1f3] px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                            STATUS_BADGES[market.status] ||
                            "border-[#d9dee3] bg-[#f6f7f8] text-[#435161]"
                          }`}
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

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/app/components/TopHeader";
import {
  fetchCurrentUser,
  getCurrentUser,
  getToken,
  isSecretaireUser,
  type UserProfile,
} from "@/services/auth";
import { getSeances } from "@/services/ouvertureOffre";
import type { SeanceOuverture } from "@/types/ouvertureOffre";

type ScreenState = "loading" | "ready" | "forbidden" | "error";

const formatDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR");
};

const getDisplayPresident = (seance: SeanceOuverture) =>
  seance.president_detail?.full_name || seance.president_detail?.username || "-";

const statusLabelMap: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "Brouillon",
  EN_SAISIE: "En saisie",
  A_VALIDER: "À valider",
  VALIDEE: "Validée",
};

const statusClassMap: Record<SeanceOuverture["statut"], string> = {
  BROUILLON: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  EN_SAISIE: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  A_VALIDER: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  VALIDEE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

export default function OuvertureOffrePage() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [seances, setSeances] = useState<SeanceOuverture[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const stored = getCurrentUser();
        const user = stored ?? (await fetchCurrentUser());

        if (!isSecretaireUser(user)) {
          setCurrentUser(user);
          setScreenState("forbidden");
          return;
        }

        const data = await getSeances();
        setCurrentUser(user);
        setSeances(data);
        setScreenState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger le module.");
        setScreenState("error");
      }
    };

    void bootstrap();
  }, [router]);

  const stats = useMemo(() => {
    return {
      brouillons: seances.filter((item) => item.statut === "BROUILLON").length,
      aValider: seances.filter((item) => item.statut === "A_VALIDER").length,
      validees: seances.filter((item) => item.statut === "VALIDEE").length,
    };
  }, [seances]);

  return (
    <>
      <TopHeader />
      <main className="min-h-[calc(100vh-2cm)] bg-[#f5f7fb] px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#0e7f47]">
                  Module secrétaire
                </p>
                <h1 className="text-3xl font-black text-slate-900">
                  Ouverture des offres
                </h1>
                <p className="max-w-2xl text-sm text-slate-500">
                  Tableau de bord des séances d&apos;ouverture publique, connecté au backend Django du module.
                </p>
              </div>

              {currentUser && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Secrétaire :</span>{" "}
                  {`${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username}
                </div>
              )}
            </div>
          </section>

          {screenState === "loading" && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              Chargement des séances en cours...
            </section>
          )}

          {screenState === "forbidden" && (
            <section className="rounded-[24px] border border-rose-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Accès non autorisé</h2>
              <p className="mt-2 text-sm text-slate-600">
                Cette interface est réservée aux utilisateurs du groupe SECRETAIRE.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Retour au dashboard
                </button>
              </div>
            </section>
          )}

          {screenState === "error" && (
            <section className="rounded-[24px] border border-rose-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Erreur de chargement</h2>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
            </section>
          )}

          {screenState === "ready" && (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Brouillons
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{stats.brouillons}</p>
                </article>
                <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    À valider
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{stats.aValider}</p>
                </article>
                <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Validées
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{stats.validees}</p>
                </article>
              </section>

              <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Séances enregistrées</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Visualise les brouillons, les séances en attente et les séances finalisées.
                    </p>
                  </div>

                  <Link
                    href="/ouverture_offre/nouvelle"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0e7f47] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b693a]"
                  >
                    Nouvelle séance
                  </Link>
                </div>

                <div className="mt-6 overflow-x-auto">
                  {seances.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                      Aucune séance disponible pour le moment.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <th className="pb-3 pr-4">Référence dossier</th>
                          <th className="pb-3 pr-4">Président</th>
                          <th className="pb-3 pr-4">Date séance</th>
                          <th className="pb-3 pr-4">Statut</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {seances.map((seance) => (
                          <tr key={seance.id} className="text-sm text-slate-700">
                            <td className="py-4 pr-4 font-semibold text-slate-900">
                              {seance.reference_dossier}
                            </td>
                            <td className="py-4 pr-4">{getDisplayPresident(seance)}</td>
                            <td className="py-4 pr-4">{formatDate(seance.date_seance)}</td>
                            <td className="py-4 pr-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusClassMap[seance.statut]}`}
                              >
                                {statusLabelMap[seance.statut]}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="text-xs font-semibold text-slate-500">
                                Détail à venir
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

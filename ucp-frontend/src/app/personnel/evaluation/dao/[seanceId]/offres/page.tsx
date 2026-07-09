"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
} from "lucide-react";
import EvaluatorHeader from "@/app/personnel/evaluation/components/EvaluatorHeader";
import {
  ActionPageShell,
  InlineMessage,
  LoadingCard,
} from "@/app/personnel/demande-achat/components/ActionPageShell";
import {
  fetchDaoOffres,
  type DaoOffreItem,
  type DaoOffresResponse,
  getToken,
} from "@/services/evaluationService";

function progressionMeta(progression: DaoOffreItem["progression"]) {
  switch (progression) {
    case "TERMINEE":
      return {
        label: "Terminée",
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        action: "Voir",
      };
    case "EN_COURS":
      return {
        label: "En cours",
        icon: Clock,
        className: "border-amber-200 bg-amber-50 text-amber-800",
        action: "Continuer",
      };
    default:
      return {
        label: "Pas commencé",
        icon: Circle,
        className: "border-slate-200 bg-slate-50 text-slate-600",
        action: "Évaluer",
      };
  }
}

export default function DaoOffresPage() {
  const params = useParams();
  const router = useRouter();
  const seanceId = Number(params.seanceId);

  const [data, setData] = useState<DaoOffresResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/personnel/evaluation/login?seance=${seanceId}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seanceId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await fetchDaoOffres(seanceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <EvaluatorHeader seanceId={seanceId} />
      <ActionPageShell
        eyebrow="Évaluation des offres"
        title={data?.reference_dossier || "Chargement…"}
        description={
          data?.objet_dossier || "Liste des offres à évaluer pour ce DAO."
        }
        headerActions={
          <Link
            href={`/personnel/evaluation/classement/${seanceId}`}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <Trophy className="h-4 w-4" />
            Classement final
          </Link>
        }
      >
        {error && <InlineMessage tone="error" text={error} />}
        {loading && <LoadingCard text="Chargement des offres…" />}

        {!loading && data && (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.offres.map((offre) => {
              const meta = progressionMeta(offre.progression);
              const Icon = meta.icon;
              return (
                <article
                  key={offre.offre_id}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="h-1 bg-[linear-gradient(90deg,#0f9f63_0%,#35b27f_100%)]" />
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Offre {offre.ordre_passage}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {offre.nom_soumissionnaire}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {Number(offre.montant_global).toLocaleString("fr-FR")}{" "}
                        MGA
                        {offre.lot_numero ? ` · Lot ${offre.lot_numero}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        {offre.consensus_alerte && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Consensus {offre.consensus_ecart} pts
                          </span>
                        )}
                        {!offre.peut_saisir_financiere &&
                          offre.progression !== "PAS_COMMENCE" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                              Financière verrouillée
                            </span>
                          )}
                      </div>
                    </div>
                    <Link
                      href={`/personnel/evaluation/offres/${offre.offre_id}?seance=${seanceId}`}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md"
                    >
                      {meta.action}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ActionPageShell>
    </div>
  );
}

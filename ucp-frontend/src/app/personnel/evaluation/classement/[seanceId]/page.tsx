"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import EvaluatorHeader from "@/app/personnel/evaluation/components/EvaluatorHeader";
import {
  ActionPageShell,
  InlineMessage,
  LoadingCard,
} from "@/app/personnel/demande-achat/components/ActionPageShell";
import {
  fetchCurrentUser,
  getCurrentUser,
  getToken,
  isSecretaireContractualisationUser,
  isSecretaireUser,
  type UserProfile,
} from "@/services/auth";
import {
  attribuerMarche,
  fetchClassement,
  type ClassementResponse,
} from "@/services/evaluationService";

export default function ClassementPage() {
  const params = useParams();
  const router = useRouter();
  const seanceId = Number(params.seanceId);

  const [data, setData] = useState<ClassementResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/personnel/evaluation/login?seance=${seanceId}`);
      return;
    }
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      void fetchCurrentUser()
        .then((profile) => setCurrentUser(profile))
        .catch(() => setCurrentUser(null));
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seanceId]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await fetchClassement(seanceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleAttribuer = async (offreId: number) => {
    try {
      setActionLoadingId(offreId);
      setError("");
      const result = await attribuerMarche(seanceId, offreId);
      router.push(`/personnel/contractualisation/${result.contrat_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoadingId(null);
    }
  };

  const canAward =
    isSecretaireUser(currentUser) ||
    isSecretaireContractualisationUser(currentUser);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <EvaluatorHeader seanceId={seanceId} />
      <ActionPageShell
        eyebrow="Classement final"
        title={data?.reference_dossier || "Synthèse DAO"}
        description={
          data
            ? `${data.objet_dossier} — Progression ${data.progression}`
            : "Classement des offres évaluées"
        }
        backHref={`/personnel/evaluation/dao/${seanceId}/offres`}
        backLabel="Retour aux offres"
      >
        {error && <InlineMessage tone="error" text={error} />}
        {loading && <LoadingCard text="Calcul du classement…" />}

        {!loading && data && !data.classement_disponible && (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Le classement sera disponible quand toutes les offres auront été
            terminées par les 3 évaluateurs ({data.progression}).
          </div>
        )}

        {!loading && data && (
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Rang</th>
                  <th className="px-4 py-3">Soumissionnaire</th>
                  <th className="px-4 py-3 text-center">Score total</th>
                  <th className="px-4 py-3 text-center">Technique</th>
                  <th className="px-4 py-3 text-center">Financier</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.lignes.map((ligne) => (
                  <tr
                    key={ligne.offre_id}
                    className={`border-t border-slate-100 ${
                      ligne.est_moins_disante ? "bg-emerald-50/60" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {ligne.rang ?? "—"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {ligne.nom_soumissionnaire}
                      {ligne.est_moins_disante && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Moins disante
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-emerald-800">
                      {ligne.score_total != null
                        ? `${ligne.score_total.toFixed(1)}/100`
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">
                      {ligne.score_technique?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">
                      {ligne.score_financier?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {ligne.qualifie_technique &&
                        ligne.est_conforme !== false ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500" />
                        )}
                        {ligne.consensus_alerte && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {ligne.attribuee ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Attribué
                        </span>
                      ) : canAward && ligne.rang === 1 ? (
                        <button
                          type="button"
                          onClick={() => void handleAttribuer(ligne.offre_id)}
                          disabled={actionLoadingId === ligne.offre_id}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === ligne.offre_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Attribuer
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          {canAward ? "—" : "Réservé"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.classement_disponible && (
          <p className="mt-4 text-sm text-slate-500">
            Le PDF consolidé sera généré depuis le tableau de bord secrétaire
            (phase suivante).
          </p>
        )}
      </ActionPageShell>
    </div>
  );
}

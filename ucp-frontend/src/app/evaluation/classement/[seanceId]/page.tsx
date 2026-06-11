"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import {
  ActionPageShell,
  InlineMessage,
  LoadingCard,
} from "@/app/demande-achat/components/ActionPageShell";
import {
  fetchClassement,
  type ClassementResponse,
} from "@/services/evaluationService";
import { getToken } from "@/services/auth";

export default function ClassementPage() {
  const params = useParams();
  const router = useRouter();
  const seanceId = Number(params.seanceId);

  const [data, setData] = useState<ClassementResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/evaluation/login?seance=${seanceId}`);
      return;
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf9_0%,#f1f5f3_100%)]">
      <ActionPageShell
        eyebrow="Classement final"
        title={data?.reference_dossier || "Synthèse DAO"}
        description={
          data
            ? `${data.objet_dossier} — Progression ${data.progression}`
            : "Classement des offres évaluées"
        }
        backHref={`/evaluation/dao/${seanceId}/offres`}
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
                </tr>
              </thead>
              <tbody>
                {data.lignes.map((ligne) => (
                  <tr key={ligne.offre_id} className="border-t border-slate-100">
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {ligne.rang ?? "—"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {ligne.nom_soumissionnaire}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-emerald-800">
                      {ligne.score_total != null ? `${ligne.score_total.toFixed(1)}/100` : "—"}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">
                      {ligne.score_technique?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-600">
                      {ligne.score_financier?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {ligne.qualifie_technique && ligne.est_conforme !== false ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500" />
                        )}
                        {ligne.consensus_alerte && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.classement_disponible && (
          <p className="mt-4 text-sm text-slate-500">
            Le PDF consolidé sera généré depuis le tableau de bord secrétaire (phase suivante).
          </p>
        )}
      </ActionPageShell>
    </div>
  );
}

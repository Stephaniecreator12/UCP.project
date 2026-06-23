"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AuditTrailPanel from "../../components/Audittrailpanel";
import DecisionForm from "../../components/Decisionform";
import EvaluateursPanel from "../../components/Evaluateurspanel";
import ExamenPreliminaireForm from "../../components/Examenpreliminaireform";
import FinancierForm from "../../components/Financierform";
import ScoreConsolidePanel from "../../components/Scoreconsolidepanel";
import StatutBadge from "../../components/Statutbadge";
import {
  critereTechniqueService,
  evaluationConfigService,
  evaluationHeaderService,
  type CritereTechnique,
  type EvaluationHeaderDetail,
} from "../../../../services/evaluations/Index";

export default function EvaluationDossierPage({ params }: { params: { id: string } }) {
  const evaluationId = Number(params.id);

  const [dossier, setDossier] = useState<EvaluationHeaderDetail | null>(null);
  const [criteres, setCriteres] = useState<CritereTechnique[]>([]);
  const [nombreValidateursRequis, setNombreValidateursRequis] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await evaluationHeaderService.getDossier(evaluationId);
        if (cancelled) return;
        setDossier(data);

        const [critereData, config] = await Promise.all([
          critereTechniqueService.listByMarche(data.marche),
          evaluationConfigService.getByMarche(data.marche),
        ]);
        if (cancelled) return;
        setCriteres(critereData.results.filter((c) => c.actif));
        if (config) setNombreValidateursRequis(config.nombre_validateurs_requis_double_aveugle);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le dossier.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50/60 flex items-center justify-center text-gray-500">
        Chargement du dossier…
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="w-full min-h-screen bg-gray-50/60 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-6">
          {error ?? "Dossier introuvable."}
        </div>
      </div>
    );
  }

  const examenBloque = dossier.examen_preliminaire?.is_conforme === false;

  return (
    <div className="w-full min-h-screen bg-gray-50/60 pb-16 font-sans p-2.5">
      <div className="mx-auto px-4 mt-8 max-w-4xl">
        <Link
          href="/evaluations"
          className="text-sm text-green-700 hover:text-green-900 font-medium inline-flex items-center gap-1 mb-4"
        >
          ← Retour à la liste des évaluations
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Dossier d'évaluation
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Marché #{dossier.marche} · Soumissionnaire #{dossier.soumissionnaire}
              {dossier.lot_numero ? ` · Lot ${dossier.lot_numero}` : ""}
            </p>
          </div>
          <StatutBadge statut={dossier.statut} />
        </div>

        {examenBloque && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
            Cette offre a été éliminée à l'examen préliminaire : les étapes suivantes restent
            consultables mais ne sont plus applicables.
          </div>
        )}

        <div className="space-y-6">
          <ExamenPreliminaireForm
            evaluationId={dossier.id}
            examen={dossier.examen_preliminaire}
            onSaved={(examen) => setDossier({ ...dossier, examen_preliminaire: examen })}
          />

          {!examenBloque && (
            <>
              <EvaluateursPanel
                evaluationId={dossier.id}
                evaluateurs={dossier.evaluateurs}
                criteres={criteres}
                nombreValidateursRequis={nombreValidateursRequis}
                onEvaluateurUpdated={(updated) =>
                  setDossier({
                    ...dossier,
                    evaluateurs: dossier.evaluateurs.map((e) =>
                      e.id === updated.id ? updated : e
                    ),
                  })
                }
              />

              <FinancierForm
                evaluationId={dossier.id}
                financiere={dossier.evaluation_financiere}
                deverrouille={dossier.financier_deverrouille}
                onSaved={(financiere) => setDossier({ ...dossier, evaluation_financiere: financiere })}
              />

              <ScoreConsolidePanel
                score={dossier.score_consolide}
                onUpdated={(score) => setDossier({ ...dossier, score_consolide: score })}
              />

              <DecisionForm
                evaluationId={dossier.id}
                statut={dossier.statut}
                decision={dossier.decision}
                onSaved={(decision) =>
                  setDossier({ ...dossier, decision, statut: "FINALISE" })
                }
              />
            </>
          )}

          <AuditTrailPanel contentType="evaluationheader" objectId={dossier.id} />
        </div>
      </div>
    </div>
  );
}
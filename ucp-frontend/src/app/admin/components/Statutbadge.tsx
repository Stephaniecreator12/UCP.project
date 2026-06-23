import type { StatutEvaluation } from "@/types/evaluations";

const STYLES: Record<StatutEvaluation, { label: string; classes: string }> = {
  EN_COURS: {
    label: "Évaluation en cours",
    classes: "bg-blue-50 text-blue-800 border-blue-200",
  },
  ELIMINE_PRELIMINAIRE: {
    label: "Éliminé – examen préliminaire",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  ELIMINE_TECHNIQUE: {
    label: "Éliminé – évaluation technique",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  CONSENSUS_REQUIS: {
    label: "Consensus requis",
    classes: "bg-amber-50 text-amber-800 border-amber-200",
  },
  QUALIFIE_FINANCIER: {
    label: "Qualifié pour ouverture financière",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  FINALISE: {
    label: "Finalisé",
    classes: "bg-gray-100 text-gray-700 border-gray-300",
  },
};

export default function StatutBadge({ statut }: { statut: StatutEvaluation }) {
  const style = STYLES[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.classes}`}
    >
      {style.label}
    </span>
  );
}
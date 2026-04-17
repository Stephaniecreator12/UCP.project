"use client";

import { useEffect, useState } from "react";

import {
  CloseDemandePayload,
  DemandeAchat,
  closeDemandeAchat,
} from "@/services/achats";
import PurchaseSelect from "@/app/demande-achat/components/PurchaseSelect";

type ClosureModalProps = {
  demande: DemandeAchat | null;
  open: boolean;
  onClose: () => void;
  onSaved: (demande: DemandeAchat) => void;
};

type ClosureFormState = {
  statut_final: "CLOTURE" | "PARTIELLEMENT_EXECUTE" | "ANNULE";
  niveau_satisfaction: number;
  commentaires_finaux: string;
  date_cloture: string;
};

const statusLabels: Record<string, string> = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  A_COMPLETER: "À compléter",
  VALIDEE: "Validée",
  EN_COMMANDE: "En commande",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  CLOTUREE: "Clôturée",
  REJETEE: "Rejetée",
};

const receptionStatusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  RECEPTION_PARTIELLE: "Réception partielle",
  RECEPTION_COMPLETE: "Réception complète",
};

const closureStatusOptions = [
  { value: "CLOTURE", label: "Clôturé" },
  { value: "PARTIELLEMENT_EXECUTE", label: "Partiellement exécuté" },
  { value: "ANNULE", label: "Annulé" },
] as const;

const buildClosureForm = (demande: DemandeAchat | null): ClosureFormState => ({
  statut_final:
    (demande?.statut_final as ClosureFormState["statut_final"]) ??
    (demande?.statut_reception === "RECEPTION_PARTIELLE"
      ? "PARTIELLEMENT_EXECUTE"
      : "CLOTURE"),
  niveau_satisfaction: demande?.niveau_satisfaction ?? 4,
  commentaires_finaux: demande?.commentaires_finaux ?? "",
  date_cloture: demande?.date_cloture ?? "",
});

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ClosureModal({
  demande,
  open,
  onClose,
  onSaved,
}: ClosureModalProps) {
  const [form, setForm] = useState<ClosureFormState>(buildClosureForm(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setForm(buildClosureForm(demande));
    setError(null);
  }, [demande, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, saving]);

  if (!open || !demande) return null;

  const canClose =
    demande.statut !== "CLOTUREE" &&
    ["RECEPTION_COMPLETE", "RECEPTION_PARTIELLE"].includes(
      demande.statut_reception ?? "",
    );

  const handleSubmit = async () => {
    if (!canClose) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await closeDemandeAchat(
        demande.id,
        form as CloseDemandePayload,
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de clôture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-950/30 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="closure-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div 
        className="my-8 w-[min(1000px,100%)] rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)]"
        style={{ zoom: 0.8 }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Section 10
            </p>
            <h2
              id="closure-modal-title"
              className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
            >
              Clôture du dossier
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {demande.numero_demande} • {demande.objet}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-60"
            aria-label="Fermer la clôture"
          >
            ×
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Statut global"
                value={statusLabels[demande.statut] ?? demande.statut}
              />
              <InfoCard
                label="Réception"
                value={
                  receptionStatusLabels[demande.statut_reception ?? ""] ||
                  demande.statut_reception ||
                  "-"
                }
              />
              <InfoCard
                label="Date réception"
                value={formatDate(demande.date_reception)}
              />
              <InfoCard
                label="Réceptionnaire"
                value={demande.receptionnaire || "-"}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Statut final">
                <PurchaseSelect
                  value={form.statut_final}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      statut_final: value as ClosureFormState["statut_final"],
                    }))
                  }
                  options={[...closureStatusOptions]}
                  className="field"
                  disabled={!canClose}
                />
              </Field>

              <Field label="Date clôture">
                <input
                  type="date"
                  value={form.date_cloture}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      date_cloture: e.target.value,
                    }))
                  }
                  className="field"
                  disabled={!canClose}
                />
              </Field>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Satisfaction du demandeur
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        niveau_satisfaction: value,
                      }))
                    }
                    disabled={!canClose}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      form.niveau_satisfaction === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    } ${!canClose ? "opacity-60" : ""}`}
                  >
                    {value} / 5
                  </button>
                ))}
              </div>
            </div>

            <Field label="Commentaires finaux">
              <textarea
                value={form.commentaires_finaux}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    commentaires_finaux: e.target.value,
                  }))
                }
                className="field min-h-32"
                disabled={!canClose}
                placeholder="Retour d'expérience, satisfaction, remarques finales"
              />
            </Field>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Règle métier
              </p>
              <div className="mt-3 space-y-2.5">
                <ChecklistItem text="Clôture seulement après réception" />
                <ChecklistItem text="Réception complète ou partielle autorisée" />
                <ChecklistItem text="Satisfaction renseignée par le demandeur" />
                <ChecklistItem text="Statut final enregistré" />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Résolution
              </p>
              <div className="mt-3 space-y-3">
                <InfoCard
                  label="Écart"
                  value={demande.type_ecart ? demande.type_ecart.replace(/_/g, " ") : "-"}
                />
                <InfoCard
                  label="Action corrective"
                  value={
                    demande.action_corrective
                      ? demande.action_corrective.replace(/_/g, " ")
                      : "-"
                  }
                />
              </div>
            </section>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-sm text-slate-600">
            {canClose
              ? "Cette validation met fin au cycle demandeur."
              : demande.statut === "CLOTUREE"
                ? "Ce dossier est déjà clôturé."
                : "La clôture devient disponible après une réception complète ou partielle."}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canClose || saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Valider la clôture"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
        ✓
      </span>
      <span className="text-sm leading-6 text-slate-700">{text}</span>
    </div>
  );
}

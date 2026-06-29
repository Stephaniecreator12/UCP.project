"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
  Paperclip,
} from "lucide-react";

import {
  DemandeAchat,
  LigneBesoin,
  fetchDemandeDocumentBlob,
} from "@/services/achats";

import {
  buildLifecycleTimeline,
  expeditionLabels,
  finalStatusLabels,
  formatDate,
  formatDateTime,
  formatMoney,
  procedureLabels,
  receptionStatusLabels,
  statusClasses,
  statusLabels,
  stepLabels,
  toDisplayLabel,
  typeLabels,
  financementLabels,
} from "./demandeAchatShared";

type DemandeDetailPanelProps = {
  demande: DemandeAchat;
  actionSlot?: ReactNode;
  defaultShowTimeline?: boolean;
};

// Ces tables ne servent qu'à rendre les champs backend plus lisibles
// dans la fiche détaillée d'un état de besoins.
const uniteTechniqueLabels: Record<string, string> = {
  FONDS_PROPRES: "Fonds Propres",
  GAVI: "GAVI",
  FONDS_MONDIAL: "Fonds Mondial",
  BANQUE_MONDIALE: "Banque Mondiale / IDA",
  AUTRES: "Autres partenaires",
};


const conformiteQuantiteLabels: Record<string, string> = {
  CONFORME: "Conforme",
  NON_CONFORME: "Non conforme",
  PARTIELLE: "Partielle",
};

const conformiteQualiteLabels: Record<string, string> = {
  CONFORME: "Conforme",
  NON_CONFORME: "Non conforme",
  DEFECTUEUX: "Défectueux",
};

const actionCorrectiveLabels: Record<string, string> = {
  REMPLACEMENT: "Remplacement",
  AVOIR: "Avoir",
  REJET: "Rejet",
  REPARATION: "Réparation",
};

const documentTypeLabels: Record<string, string> = {
  SPECIFICATIONS_TECHNIQUES: "Spécifications techniques détaillées",
  TDR_SIMPLIFIE: "Termes de référence simplifiés",
  DEVIS_ESTIMATIF: "Devis estimatif",
  BON_SORTIE_STOCK: "Bon de sortie stock",
  BON_LIVRAISON: "Bon de livraison signé",
  PV_RECEPTION: "Procès-verbal de réception",
};

const getDocumentTypeLabel = (type: string) =>
  documentTypeLabels[type] ?? toDisplayLabel(type);

const getDocumentFileName = (value?: string | null) => {
  if (!value) return "Document";

  const sanitized = value.split("?")[0];
  const filename = sanitized.split("/").pop() || "Document";

  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
};

// Ces helpers évitent d'afficher des blocs ou des cellules vides
// quand une information n'est pas encore renseignée.
const hasDisplayValue = (value: ReactNode) =>
  value !== null && value !== undefined && value !== "";

const renderDisplayValue = (value?: ReactNode) =>
  hasDisplayValue(value ?? null) ? value : "-";

const formatDateRange = (
  start?: string | null,
  end?: string | null,
) => {
  if (!start && !end) return "-";
  if (start && end) return `${formatDate(start)} au ${formatDate(end)}`;
  if (start) return `À partir du ${formatDate(start)}`;
  return `Jusqu'au ${formatDate(end)}`;
};

const formatQuantity = (
  quantity?: number | null,
  unite?: string | null,
) => {
  if (quantity === null || quantity === undefined) return "-";

  const unit = unite?.trim();
  return unit ? `${quantity} ${unit}` : String(quantity);
};

const getLineTotal = (ligne: LigneBesoin) => {
  if (
    ligne.cout_total_estime !== null &&
    ligne.cout_total_estime !== undefined &&
    ligne.cout_total_estime !== ""
  ) {
    return ligne.cout_total_estime;
  }

  const unitPrice = Number(ligne.prix_unitaire_estime || 0);
  const quantity = ligne.type_service ? 1 : Number(ligne.quantite || 0);
  return unitPrice * quantity;
};

export default function DemandeDetailPanel({
  demande,
  actionSlot,
  defaultShowTimeline = false,
}: DemandeDetailPanelProps) {
  const lignesBesoin = Array.isArray(demande.lignes_besoin) ? demande.lignes_besoin : [];
  const validations = Array.isArray(demande.validations) ? demande.validations : [];
  const documents = Array.isArray(demande.documents) ? demande.documents : [];
  const [showTimeline, setShowTimeline] = useState(defaultShowTimeline);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const timeline = useMemo(() => buildLifecycleTimeline(demande), [demande]);

  // Chaque sous-section métier du détail ne s'affiche que si le dossier
  // contient déjà des informations utiles pour cette étape.
  const hasPassationData = Boolean(
    demande.type_procedure ||
      demande.fournisseur_retenu ||
      demande.email_fournisseur ||
      demande.numero_bon_commande ||
      demande.montant_commande ||
      demande.date_bon_commande ||
      demande.delai_livraison_contractuel ||
      demande.conditions_livraison ||
      demande.garantie,
  );
  const hasLivraisonData = Boolean(
    demande.etat_expedition ||
      demande.date_livraison_prevue ||
      demande.date_arrivee_prevue ||
      demande.date_arrivee_effective ||
      demande.conditions_livraison,
  );
  const hasReceptionData = Boolean(
    demande.date_reception ||
      demande.receptionnaire ||
      demande.conformite_quantite ||
      demande.conformite_qualite ||
      (demande.statut_reception && demande.statut_reception !== "EN_ATTENTE") ||
      demande.type_ecart ||
      demande.action_corrective ||
      demande.description_ecart ||
      demande.observations_reception,
  );
  const hasResolutionData = Boolean(
    demande.date_resolution || demande.suivi_resolution,
  );
  const hasClosureData = Boolean(
    demande.statut_final ||
      demande.date_cloture ||
      demande.niveau_satisfaction ||
      demande.commentaires_finaux,
  );

  // Les pièces jointes sont ouvertes via le backend pour conserver
  // l'authentification et éviter d'exposer des URLs directes.
  const handleOpenDocument = async (documentId: number) => {
    setDocumentError(null);
    setOpeningDocumentId(documentId);

    try {
      const blob = await fetchDemandeDocumentBlob(documentId);
      const objectUrl = window.URL.createObjectURL(blob);
      const popup = window.open(objectUrl, "_blank", "noopener,noreferrer");

      if (!popup) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : "Impossible d'ouvrir le document.",
      );
    } finally {
      setOpeningDocumentId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-[13px] leading-relaxed text-slate-800">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Statut
          </span>
          <span
            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${
              statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"
            }`}
          >
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Étape
          </span>
          <span className="inline-flex rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
            {stepLabels[demande.etape_validation_actuelle] ??
              demande.etape_validation_actuelle}
          </span>
        </div>

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-900 transition-all hover:text-slate-600"
        >
          {showTimeline ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Chronologie
        </button>
      </div>

      {actionSlot ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
          {actionSlot}
        </div>
      ) : null}

      {showTimeline && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Activity className="h-3 w-3" /> Chronologie du processus
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {timeline
              .filter((item) => item.date || demande.statut === "BROUILLON")
              .map((item) => {
                const done = !!item.date;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 border-l-2 border-slate-200 pl-3 pr-6"
                  >
                    <span
                      className={`text-sm font-bold ${
                        done ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {done ? formatDateTime(item.date!) : "En attente"}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.42fr)_minmax(300px,0.88fr)] xl:grid-cols-[minmax(0,1.58fr)_minmax(340px,0.92fr)] 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.9fr)]">
        <div className="flex flex-col gap-5">
          <Section title="Informations générales">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
              <DataPair label="Demandeur" value={demande.demandeur_nom} colSpan={2} />
              <DataPair label="Profil" value={demande.demandeur_group} colSpan={2} />
              <DataPair label="Référence" value={demande.numero_demande} />
              <DataPair label="Version" value={demande.version} />
              <DataPair
                label="Type de besoin"
                value={typeLabels[demande.type_demande] ?? demande.type_demande}
              />
              <DataPair
                label="Catégorie"
                value={toDisplayLabel(demande.categorie_besoin)}
              />
              <DataPair
                label="Priorité"
                value={toDisplayLabel(demande.priorite)}
                highlight={demande.priorite === "URGENT"}
              />
              <DataPair label="Date création" value={formatDateTime(demande.created_at)} />
              <DataPair
                label="Date soumission"
                value={formatDateTime(demande.submitted_at)}
              />
              <DataPair
                label="Dernière mise à jour"
                value={formatDateTime(demande.updated_at)}
              />
              <DataPair
                label="Unité technique"
                value={
                  uniteTechniqueLabels[demande.unite_technique] ??
                  toDisplayLabel(demande.unite_technique)
                }
                colSpan={2}
              />
              <DataPair
                label="Service bénéficiaire final"
                value={demande.service_beneficiaire}
                colSpan={2}
              />
            </div>
          </Section>

          <Section title="Expression du besoin">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock
                  label="Objet de l'état de besoins"
                  value={demande.objet}
                  className="md:col-span-2"
                />
                <InfoBlock label="Référence PTBA" value={demande.lien_ptba} />
                <InfoBlock
                  label="Source de financement"
                  value={
                    financementLabels[demande.source_financement || "NON_DEFINI"] ??
                    toDisplayLabel(demande.source_financement)
                  }
                />
                <InfoBlock
                  label="Justification"
                  value={demande.justification}
                  className="md:col-span-2"
                  prose
                />
              </div>
            </div>
          </Section>

          <Section title={`Besoins détaillés (${lignesBesoin.length})`}>
            {lignesBesoin.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Aucun besoin détaillé enregistré.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {lignesBesoin.map((ligne, index) => (
                  <NeedLineCard key={ligne.id ?? index} ligne={ligne} index={index} />
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Coût estimé total
              </span>
              <span className="text-base font-black text-slate-900">
                {formatMoney(demande.cout_total_estime)}
              </span>
            </div>
          </Section>

          {validations.length > 0 && (
            <Section title="Validation & Décisions">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {validations.map((val, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="w-[148px] border-r border-slate-100 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                          {val.etape_label}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-bold text-slate-900">
                              {val.decision_label}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">{val.validateur_nom}</span>
                            <span className="text-slate-400">
                              {formatDateTime(val.created_at)}
                            </span>
                          </div>
                          {val.signature_electronique && (
                            <div className="mt-0.5 text-[10px] font-mono text-slate-400">
                              {val.signature_electronique}
                            </div>
                          )}
                          {val.commentaire ? (
                            <div className="mt-1 whitespace-pre-wrap text-slate-500 italic">
                              {val.commentaire}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Suivi Budgétaire">
            <div className="flex flex-col gap-2">
              <DataPairRow label="Ligne budg." value={demande.ligne_budgetaire} />
              <DataPairRow
                label="Source"
                value={
                  financementLabels[demande.source_financement || "NON_DEFINI"] ??
                  toDisplayLabel(demande.source_financement)
                }
              />
              <DataPairRow label="Réf. PTBA" value={demande.lien_ptba} />
              <DataPairRow label="N° Subvention" value={demande.numero_subvention} />
              <div className="my-1 border-t border-slate-100"></div>
              <DataPairRow
                label="Solde initial"
                value={formatMoney(demande.solde_disponible_ligne_budgetaire)}
                monospace
              />
              <DataPairRow
                label="Montant DA"
                value={formatMoney(demande.cout_total_estime)}
                monospace
                boldValue
              />
              <DataPairRow
                label="Engagement"
                value={demande.numero_engagement_budgetaire || "En attente"}
                highlight={!demande.numero_engagement_budgetaire}
              />
              {demande.solde_apres_engagement != null && (
                <DataPairRow
                  label="Solde restant"
                  value={formatMoney(demande.solde_apres_engagement)}
                  monospace
                  highlight
                />
              )}
            </div>
          </Section>

          {documents.length > 0 && (
            <Section title="Documents Joints">
              <div className="flex flex-col gap-1.5">
                {documentError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {documentError}
                  </div>
                ) : null}
                {documents.map((doc, i) => (
                  <button
                    key={doc.id ?? i}
                    type="button"
                    onClick={() => doc.id && handleOpenDocument(doc.id)}
                    disabled={!doc.id || !doc.fichier || openingDocumentId === doc.id}
                    className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        {getDocumentTypeLabel(doc.type_document)}
                      </span>
                      <div className="mt-1 text-xs font-medium text-slate-500">
                        {getDocumentFileName(doc.fichier)}
                      </div>
                      {doc.uploaded_at ? (
                        <div className="mt-1 text-xs text-slate-400">
                          Ajouté le {formatDateTime(doc.uploaded_at)}
                        </div>
                      ) : null}
                      {doc.commentaire ? (
                        <span className="mt-1 block text-xs text-slate-500">
                          {doc.commentaire}
                        </span>
                      ) : null}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
                      {openingDocumentId === doc.id ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Ouverture...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Voir
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {hasPassationData && (
            <Section title="Passation">
              <div className="flex flex-col gap-2">
                <DataPairRow
                  label="Procédure"
                  value={
                    procedureLabels[demande.type_procedure ?? ""] ||
                    toDisplayLabel(demande.type_procedure)
                  }
                />
                <DataPairRow label="Fournisseur" value={demande.fournisseur_retenu} />
                <DataPairRow label="Email fournisseur" value={demande.email_fournisseur} />
                <DataPairRow
                  label="N° Commande"
                  value={demande.numero_bon_commande}
                  monospace
                />
                <DataPairRow
                  label="Date bon"
                  value={formatDate(demande.date_bon_commande)}
                />
                <DataPairRow
                  label="Montant validé"
                  value={formatMoney(demande.montant_commande)}
                  monospace
                  boldValue
                />
                <DataPairRow
                  label="Délai contractuel"
                  value={
                    demande.delai_livraison_contractuel != null
                      ? `${demande.delai_livraison_contractuel} jour(s)`
                      : undefined
                  }
                />
                <DataPairRow
                  label="Conditions"
                  value={demande.conditions_livraison}
                />
                <DataPairRow label="Garantie" value={demande.garantie} />
              </div>
            </Section>
          )}

          {hasLivraisonData && (
            <Section title="Marché - Expédition">
              <div className="flex flex-col gap-2">
                <DataPairRow
                  label="Statut livr."
                  value={
                    expeditionLabels[demande.etat_expedition ?? ""] ||
                    toDisplayLabel(demande.etat_expedition)
                  }
                />
                <DataPairRow
                  label="Livraison prévue"
                  value={formatDate(demande.date_livraison_prevue)}
                />
                <DataPairRow
                  label="Arrivée prévue"
                  value={formatDate(demande.date_arrivee_prevue)}
                />
                <DataPairRow
                  label="Arrivée effective"
                  value={formatDate(demande.date_arrivee_effective)}
                />
              </div>
            </Section>
          )}

          {hasReceptionData && (
            <Section title="Marché - Réception">
              <div className="flex flex-col gap-2">
                <DataPairRow
                  label="Statut récept."
                  value={
                    receptionStatusLabels[demande.statut_reception ?? ""] ||
                    toDisplayLabel(demande.statut_reception)
                  }
                />
                <DataPairRow label="Date" value={formatDate(demande.date_reception)} />
                <DataPairRow label="Réceptionnaire" value={demande.receptionnaire} />
                <DataPairRow
                  label="Conformité quantité"
                  value={
                    conformiteQuantiteLabels[demande.conformite_quantite ?? ""] ||
                    demande.conformite_quantite
                  }
                />
                <DataPairRow
                  label="Conformité qualité"
                  value={
                    conformiteQualiteLabels[demande.conformite_qualite ?? ""] ||
                    demande.conformite_qualite
                  }
                />
              </div>

              {demande.observations_reception ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Observations de réception
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {demande.observations_reception}
                  </p>
                </div>
              ) : null}

              {demande.type_ecart ? (
                <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-rose-600">
                    Écart signalé
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoBlock
                      label="Type d'écart"
                      value={toDisplayLabel(demande.type_ecart)}
                    />
                    <InfoBlock
                      label="Action corrective"
                      value={
                        actionCorrectiveLabels[demande.action_corrective ?? ""] ||
                        toDisplayLabel(demande.action_corrective)
                      }
                    />
                    <InfoBlock
                      label="Description"
                      value={demande.description_ecart}
                      className="md:col-span-2"
                      prose
                    />
                  </div>
                </div>
              ) : null}
            </Section>
          )}

          {hasResolutionData && (
            <Section title="Résolution d'Écart">
              <div className="flex flex-col gap-2">
                <DataPairRow
                  label="Date résolution"
                  value={formatDate(demande.date_resolution)}
                />
              </div>
              {demande.suivi_resolution ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suivi résolution
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {demande.suivi_resolution}
                  </p>
                </div>
              ) : null}
            </Section>
          )}

          {hasClosureData && (
            <Section title="Clôture finale">
              <div className="flex flex-col gap-2">
                <DataPairRow
                  label="Statut final"
                  value={
                    finalStatusLabels[demande.statut_final ?? ""] ||
                    demande.statut_final
                  }
                />
                <DataPairRow
                  label="Date clôture"
                  value={formatDate(demande.date_cloture)}
                />
                <DataPairRow
                  label="Satisfaction"
                  value={
                    demande.niveau_satisfaction
                      ? `${demande.niveau_satisfaction} / 5`
                      : undefined
                  }
                  boldValue
                />
              </div>
              {demande.commentaires_finaux ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Commentaires finaux
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {demande.commentaires_finaux}
                  </p>
                </div>
              ) : null}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-b border-slate-100 pb-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function DataPair({
  label,
  value,
  highlight = false,
  colSpan = 1,
}: {
  label: string;
  value?: ReactNode;
  highlight?: boolean;
  colSpan?: number;
}) {
  return (
    <div style={{ gridColumn: `span ${colSpan}` }}>
      <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-[13px] font-bold ${highlight ? "text-red-600" : "text-slate-900"}`}>
        {renderDisplayValue(value)}
      </p>
    </div>
  );
}

function DataPairRow({
  label,
  value,
  monospace = false,
  boldValue = false,
  highlight = false,
}: {
  label: string;
  value?: ReactNode;
  monospace?: boolean;
  boldValue?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px] py-0.5">
      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest pt-0.5">{label}</span>
      <span
        className={`text-right ${
          monospace ? "font-mono" : ""
        } ${boldValue ? "font-black text-slate-900" : "font-bold text-slate-700"} ${
          highlight ? "font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded" : ""
        }`}
      >
        {renderDisplayValue(value)}
      </span>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  className,
  prose = false,
}: {
  label: string;
  value?: ReactNode;
  className?: string;
  prose?: boolean;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div
        className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 ${
          prose ? "whitespace-pre-wrap" : ""
        }`}
      >
        {renderDisplayValue(value)}
      </div>
    </div>
  );
}

function NeedLineCard({
  ligne,
  index,
}: {
  ligne: LigneBesoin;
  index: number;
}) {
  const isService = Boolean(ligne.type_service);
  const total = getLineTotal(ligne);
  const lineLabel = isService
    ? ligne.description_service || toDisplayLabel(ligne.type_service)
    : ligne.designation;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm font-black text-slate-700">
              {ligne.ordre ?? index + 1}
            </span>
            <div>
              <p className="text-[13px] font-bold text-slate-900">
                {renderDisplayValue(lineLabel)}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                {isService
                  ? `Service • ${toDisplayLabel(ligne.type_service)}`
                  : "Matériel"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Montant estimé
            </p>
            <p className="text-[13px] font-black text-slate-900">{formatMoney(total)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {isService ? (
            <Badge label={formatDateRange(ligne.date_debut, ligne.date_fin)} />
          ) : (
            <Badge label={`Quantité: ${formatQuantity(ligne.quantite, ligne.unite)}`} />
          )}
          {ligne.quantite_recue != null ? (
            <Badge label={`Reçu: ${formatQuantity(ligne.quantite_recue, ligne.unite)}`} />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {isService ? (
          <>
            <LineField label="Type de service" value={toDisplayLabel(ligne.type_service)} />
            <LineField label="Période d'exécution" value={formatDateRange(ligne.date_debut, ligne.date_fin)} />
            <LineField label="Coût estimé" value={formatMoney(total)} emphasize />
            <LineField label="Lieu d'exécution" value={ligne.lieu_execution} />
            <LineField label="Durée estimée" value={ligne.duree_estimee} />
            <LineField
              label="Nombre de bénéficiaires"
              value={ligne.nombre_beneficiaires}
            />
            <LineField
              label="Description du service"
              value={ligne.description_service}
              className="md:col-span-2 xl:col-span-3"
              prose
            />
            <LineField
              label="Livrables attendus"
              value={ligne.livrables_attendus}
              className="md:col-span-2 xl:col-span-3"
              prose
            />
          </>
        ) : (
          <>
            <LineField label="Désignation" value={ligne.designation} />
            <LineField label="Marque / Modèle" value={ligne.marque_modele} />
            <LineField
              label="Quantité demandée"
              value={formatQuantity(ligne.quantite, ligne.unite)}
            />
            <LineField label="Unité" value={ligne.unite} />
            <LineField
              label="Prix unitaire estimé"
              value={formatMoney(ligne.prix_unitaire_estime)}
            />
            <LineField label="Coût total estimé" value={formatMoney(total)} emphasize />
            <LineField label="Lieu de livraison" value={ligne.lieu_livraison} />
            <LineField label="Destinataire final" value={ligne.destinataire_final} />
            <LineField
              label="Quantité reçue"
              value={
                ligne.quantite_recue != null
                  ? formatQuantity(ligne.quantite_recue, ligne.unite)
                  : undefined
              }
            />
            <LineField
              label="Caractéristiques techniques"
              value={ligne.caracteristiques_techniques}
              className="md:col-span-2 xl:col-span-3"
              prose
            />
          </>
        )}

        {ligne.observation_reception ? (
          <LineField
            label="Observation de réception"
            value={ligne.observation_reception}
            className="md:col-span-2 xl:col-span-3"
            prose
          />
        ) : null}
      </div>
    </article>
  );
}

function LineField({
  label,
  value,
  className,
  prose = false,
  emphasize = false,
}: {
  label: string;
  value?: ReactNode;
  className?: string;
  prose?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div
        className={`rounded-xl border px-3 py-2 text-[13px] ${
          emphasize
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-slate-50 text-slate-700"
        } ${prose ? "whitespace-pre-wrap" : ""}`}
      >
        {renderDisplayValue(value)}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      {label}
    </span>
  );
}

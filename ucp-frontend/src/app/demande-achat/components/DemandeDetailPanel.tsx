"use client";

import { ReactNode, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Activity, Paperclip } from "lucide-react";

import { DemandeAchat } from "@/services/achats";

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
} from "./demandeAchatShared";

type DemandeDetailPanelProps = {
  demande: DemandeAchat;
  actionSlot?: ReactNode;
  defaultShowTimeline?: boolean;
};

export default function DemandeDetailPanel({
  demande,
  actionSlot,
  defaultShowTimeline = false,
}: DemandeDetailPanelProps) {
  const [showTimeline, setShowTimeline] = useState(defaultShowTimeline);
  const timeline = useMemo(() => buildLifecycleTimeline(demande), [demande]);

  const hasPassationData = Boolean(
    demande.type_procedure ||
      demande.fournisseur_retenu ||
      demande.numero_bon_commande ||
      demande.montant_commande ||
      demande.date_bon_commande,
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
      (demande.statut_reception && demande.statut_reception !== "EN_ATTENTE") ||
      demande.type_ecart ||
      demande.action_corrective ||
      demande.description_ecart ||
      demande.observations_reception,
  );

  return (
    <div className="flex flex-col gap-5 text-[13px] text-slate-800 font-sans leading-tight">
      
      {/* Top Banner (Status + Action) */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200 rounded p-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Statut</span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${statusClasses[demande.statut] ?? "bg-slate-200 text-slate-700"}`}>
            {statusLabels[demande.statut] ?? demande.statut}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500 uppercase tracking-widest text-[10px]">Étape</span>
          <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-bold uppercase text-slate-700 bg-white border border-slate-200">
            {stepLabels[demande.etape_validation_actuelle] ?? demande.etape_validation_actuelle}
          </span>
        </div>
        
        <div className="flex-1"></div>

        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          {showTimeline ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {showTimeline ? "Masquer la chronologie" : "Voir la chronologie"}
        </button>
      </div>

      {actionSlot ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded p-3">
          {actionSlot}
        </div>
      ) : null}

      {showTimeline && (
        <div className="border border-slate-200 rounded bg-white p-4">
          <h3 className="font-bold text-slate-600 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Chronologie du processus
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {timeline.filter(t => t.date || demande.statut === "BROUILLON").map((item, idx) => {
              const done = !!item.date;
              return (
                <div key={item.id} className="flex flex-col gap-1 pr-6 border-l-2 border-slate-200 pl-3">
                  <span className={`text-xs font-bold ${done ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</span>
                  <span className="text-[11px] text-slate-500">{done ? formatDateTime(item.date!) : 'En attente'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        
        {/* LEFT COLUMN: Data Details */}
        <div className="flex flex-col gap-5">
          
          <Section title="Informations générales">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
              <DataPair label="Type demande" value={typeLabels[demande.type_demande] ?? demande.type_demande} />
              <DataPair label="Catégorie" value={toDisplayLabel(demande.categorie_besoin)} />
              <DataPair label="Priorité" value={toDisplayLabel(demande.priorite)} highlight={demande.priorite === "URGENT"} />
              <DataPair label="Date création" value={formatDate(demande.created_at)} />
              
              <DataPair label="Unité Technique" value={demande.unite_technique} colSpan={2} />
              <DataPair label="Service Bénéf." value={demande.service_beneficiaire} colSpan={2} />
            </div>
            {demande.justification && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Justification</span>
                <p className="mt-1 text-[13px] text-slate-700 whitespace-pre-wrap">{demande.justification}</p>
              </div>
            )}
          </Section>

          <Section title={`Besoins détaillés (${demande.lignes_besoin.length})`}>
            <div className="flex flex-col rounded border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[12px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 w-8 text-center">N°</th>
                    <th className="px-3 py-2">Désignation / Service</th>
                    <th className="px-3 py-2">Quantité</th>
                    <th className="px-3 py-2 text-right">Prix Unitaire</th>
                    <th className="px-3 py-2 text-right">Montant Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demande.lignes_besoin.map((ligne, idx) => {
                    const isService = Boolean(ligne.type_service);
                    const total = Number(ligne.prix_unitaire_estime || 0) * Number(isService ? 1 : ligne.quantite || 0);
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{ligne.ordre ?? idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-normal min-w-[200px]">
                          {isService ? ligne.description_service || toDisplayLabel(ligne.type_service) : ligne.designation}
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {isService ? `Période: ${formatDate(ligne.date_debut)} - ${formatDate(ligne.date_fin)}` : ligne.caracteristiques_techniques}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {isService ? "-" : `${ligne.quantite} ${ligne.unite}`}
                          {ligne.quantite_recue != null && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">Reçu: {ligne.quantite_recue}</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatMoney(ligne.prix_unitaire_estime)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{formatMoney(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex justify-end items-center gap-3">
                <span className="text-[11px] uppercase font-bold text-slate-500">Coût estimé total :</span>
                <span className="text-[14px] font-black text-slate-900">{formatMoney(demande.cout_total_estime)}</span>
              </div>
            </div>
          </Section>

          {demande.validations.length > 0 && (
            <Section title="Validation & Décisions">
               <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-[12px]">
                  <tbody className="divide-y divide-slate-100">
                    {demande.validations.map((val, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 w-[140px] font-semibold text-slate-700 bg-slate-50 border-r border-slate-100">
                          {val.etape_label}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{val.decision_label}</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-slate-600">{val.validateur_nom}</span>
                            <span className="text-slate-400">({formatDateTime(val.created_at)})</span>
                          </div>
                          {val.commentaire && <div className="mt-1 text-slate-500 italic">« {val.commentaire} »</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        {/* RIGHT COLUMN: Budget, Docs, Passation... */}
        <div className="flex flex-col gap-5">
          
          <Section title="Suivi Budgétaire">
            <div className="flex flex-col gap-2">
              <DataPairRow label="Ligne budg." value={demande.ligne_budgetaire} />
              <DataPairRow label="Source" value={demande.source_financement} />
              <DataPairRow label="Réf. PTBA" value={demande.lien_ptba || "-"} />
              <div className="border-t border-slate-100 my-1"></div>
              <DataPairRow label="Solde initial" value={formatMoney(demande.solde_disponible_ligne_budgetaire)} monospace />
              <DataPairRow label="Montant DA" value={formatMoney(demande.cout_total_estime)} monospace boldValue />
              {demande.solde_apres_engagement != null && (
                <DataPairRow label="Solde restant" value={formatMoney(demande.solde_apres_engagement)} monospace highlight />
              )}
            </div>
          </Section>

          {demande.documents.length > 0 && (
            <Section title="Documents Joints">
              <div className="flex flex-col gap-1.5">
                {demande.documents.map((doc, i) => (
                  <div key={i} className="flex flex-col border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50/50">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-[12px]">
                      <Paperclip className="h-3 w-3 text-slate-400" />
                      {doc.type_document}
                    </span>
                    {doc.commentaire && <span className="text-[11px] text-slate-500 mt-0.5 ml-4.5">{doc.commentaire}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {hasPassationData && (
            <Section title="Processus Achat">
              <div className="flex flex-col gap-2">
                <DataPairRow label="Procédure" value={procedureLabels[demande.type_procedure ?? ""] || demande.type_procedure || "-"} />
                <DataPairRow label="Fournisseur" value={demande.fournisseur_retenu || "-"} />
                <DataPairRow label="N° Commande" value={demande.numero_bon_commande || "-"} monospace />
                <DataPairRow label="Montant validé" value={formatMoney(demande.montant_commande)} monospace boldValue />
              </div>
            </Section>
          )}

          {hasLivraisonData && (
            <Section title="Logistique">
              <div className="flex flex-col gap-2">
                <DataPairRow label="Statut livr." value={expeditionLabels[demande.etat_expedition ?? ""] || "-"} />
                <DataPairRow label="Date attendue" value={formatDate(demande.date_arrivee_prevue ?? demande.date_livraison_prevue)} />
                {demande.date_arrivee_effective && <DataPairRow label="Date effective" value={formatDate(demande.date_arrivee_effective)} />}
              </div>
            </Section>
          )}

          {hasReceptionData && (
            <Section title="Réception">
              <div className="flex flex-col gap-2">
                <DataPairRow label="Statut récept." value={receptionStatusLabels[demande.statut_reception ?? ""] || "-"} />
                <DataPairRow label="Date" value={formatDate(demande.date_reception)} />
                <DataPairRow label="Agent" value={demande.receptionnaire || "-"} />
                
                {demande.type_ecart && (
                  <div className="mt-2 bg-rose-50 border border-rose-100 rounded p-2">
                    <span className="text-[10px] uppercase font-bold text-rose-600 block mb-1">Écart signalé ({toDisplayLabel(demande.type_ecart)})</span>
                    <p className="text-[11px] text-rose-900">{demande.description_ecart}</p>
                    {demande.action_corrective && <p className="text-[11px] font-semibold text-rose-700 mt-1">Action: {toDisplayLabel(demande.action_corrective)}</p>}
                  </div>
                )}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

// Composants Mutualisés pour la Modal

function Section({ title, children }: any) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="font-bold uppercase tracking-widest text-[#64748b] text-[10px] border-b border-slate-200 pb-1">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function DataPair({ label, value, highlight = false, colSpan = 1 }: any) {
  return (
    <div style={{ gridColumn: `span ${colSpan}` }}>
      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-rose-600' : 'text-slate-900'}`}>{value || "-"}</p>
    </div>
  );
}

function DataPairRow({ label, value, monospace = false, boldValue = false, highlight = false }: any) {
  return (
    <div className="flex justify-between items-start text-[12px]">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`text-right ${monospace ? 'font-mono' : ''} ${boldValue ? 'font-bold text-slate-900' : 'text-slate-700'} ${highlight ? 'text-indigo-600 font-bold' : ''}`}>
        {value || "-"}
      </span>
    </div>
  );
}

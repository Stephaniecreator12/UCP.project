import type { CreateTdrStDraftPayload, TdrStDocumentType } from "@/services/tdrSt";
import type { DemandeAchat, LigneBesoin } from "@/services/achats";

const UNITE_TECHNIQUE_LABELS: Record<string, string> = {
  PASSATION: "Passation des marchés",
  SUIVI_EVALUATION: "Suivi-évaluation",
  FINANCE: "Finance",
  LOGISTIQUE: "Logistique",
  COORDINATION: "Coordination",
  TECHNIQUE: "Technique",
  RH_ADMIN: "Ressource humaine/administrative",
};

const getUniteTechniqueLabel = (value: string) =>
  UNITE_TECHNIQUE_LABELS[value] ?? value;

const addDaysToIsoDate = (value: string, days: number) => {
  const baseDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return value;
  }
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().split("T")[0];
};

const getDurationInDays = (start: string, end: string) => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 30;
  }
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const getLigneTotal = (ligne: LigneBesoin, isServiceRequest: boolean) =>
  Number(ligne.prix_unitaire_estime || 0) * Number(isServiceRequest ? 1 : ligne.quantite || 0);

export const buildTdrDraftPayloadFromDemande = (
  demande: Pick<
    DemandeAchat,
    "id" | "type_demande" | "unite_technique" | "objet" | "lien_ptba" | "lignes_besoin"
  >,
): CreateTdrStDraftPayload => {
  const lignes = demande.lignes_besoin || [];
  const serviceRequest = demande.type_demande === "PETITS_SERVICES";
  const totalEstimate = lignes.reduce(
    (sum, ligne) => sum + getLigneTotal(ligne, serviceRequest),
    0,
  );

  const startDate = serviceRequest
    ? lignes
        .map((ligne) => ligne.date_debut || "")
        .filter(Boolean)
        .sort()[0] || getTodayDate()
    : getTodayDate();
  const endDate = serviceRequest
    ? lignes
        .map((ligne) => ligne.date_fin || "")
        .filter(Boolean)
        .sort()
        .at(-1) || addDaysToIsoDate(startDate, 30)
    : addDaysToIsoDate(startDate, 30);
  const typeDocument: TdrStDocumentType = "TDR";

  return {
    demande_achat_id: demande.id,
    unite_technique: getUniteTechniqueLabel(demande.unite_technique),
    type_document: typeDocument,
    categorie_activite: "",
    intitule: demande.objet.trim(),
    reference_ptba: demande.lien_ptba.trim(),
    periode_debut: startDate,
    periode_fin: endDate,
    duree_estimee_valeur: getDurationInDays(startDate, endDate),
    duree_estimee_unite: "JOURS",
    sources_financement: [],
    numero_subvention: "",
    ligne_budgetaire: "",
    montant_estime_usd: totalEstimate.toFixed(2),
    procedure_envisagee: "DC",
  };
};

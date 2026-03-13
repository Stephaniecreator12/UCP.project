/**
 * Configurations pour chaque tableau
 * Travaux, Biens & Services, Consultants
 */

import { ColumnConfig, SelectOption } from "@/types/grid";
import { MenuItemType } from "@/types/grid";

// Options pour les listes déroulantes strictement contrôlées

//BST:bien & service et travaux
const METHOD_OPTIONS_BST: SelectOption[] = [
  { value: "aon", label: "AON", description: "Appel d'Offres National" },
  { value: "aoi", label: "AOI", description: "Appel d'Offres International" },
  { value: "dc", label: "DC", description: "Demande de Cotations" },
  { value: "ed", label: "ED", description: "Entente Directe" },
];

// for Travaux
const METHOD_OPTIONS_CONSULTANT: SelectOption[] = [
  { value: "sfq", label: "SFQ", description: "Sélection Fondée sur la Qualité" },
  { value: "sfqc", label: "SFQC", description: "Sélection Fondée sur la Qualité et le Coût" },
  { value: "smc", label: "SMC", description: "Sélection au Moindre Coût" },
  { value: "sqc", label: "SQC", description: "Sélection fondée sur les Qualifications du Consultant" },
  { value: "sci", label: "SCI", description: "Sélection de Consultants Individuels" },
  { value: "sed", label: "SED", description: "Sélection par Entente Directe" },
];

const APPROACH_OPTIONS: SelectOption[] = [
  { value: "open", label: "Ouverte", description: "Ouverte à tous les soumissionnaires qualifiés" },
  { value: "restricted", label: "Restreinte", description: "Participation limitée aux soumissionnaires invités" },
  { value: "selective", label: "Sélective", description: "Sélection sur critères techniques et administratifs" },
];

// Colonnes pour Travaux et Biens & Services (identiques)
export const WORKS_GOODS_COLUMNS: ColumnConfig[] = [
  {
    key: "tracking_code",
    label: "Code suivi",
    width: "100px",
    editable: true,
    placeholder: "Code",
  },
  {
    key: "title",
    label: "Intitulé",
    width: "150px",
    type: "text",
    editable: true,
    placeholder: "Intitulé du marché",
  },
  {
    key: "estimated_amount",
    label: "Montant estimatif (MGA)",
    width: "150px",
    type: "number",
    editable: true,
    placeholder: "0.00",
  },
  {
    key: "agmo",
    label: "AGMO",
    width: "130px",
    type: "text",
    editable: true,
    placeholder: "Saisir AGMO",
  },
  {
    key: "method",
    label: "Méthode P.M.",
    width: "100px",
    type: "select",
    editable: true,
    options: METHOD_OPTIONS_BST,
  },
  {
    key: "approach",
    label: "Approches",
    width: "120px",
    type: "select",
    editable: true,
    options: APPROACH_OPTIONS,
  },
  {
    key: "review_status",
    label: "Revue",
    width: "90px",
    readonly: true,
    editable: false,
    calculated: true,
    calculateValue: (row) => String(row.review_status ?? "post"),
  },
  {
    key: "planned_vs_actual",
    label: "Prévu vs Réel",
    width: "100px",
    editable: false,
    isSplit: true,
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "specifications_date",
    label: "Listes et spécifications",
    width: "100px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "tender_documents_date",
    label: "Dossiers d'appel d'offres",
    width: "100px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "launch_date",
    label: "Date de lancement",
    width: "100px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "opening_date",
    label: "Date d'ouverture",
    width: "30px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "evaluation_report",
    label: "Rapport d'évaluation",
    width: "40px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "contract_date",
    label: "Date signature contrat",
    width: "130px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    // DATE DRIVER - ÉDITABLE (Date Fin)
    key: "delivery_date",
    label: "Date de livraison",
    width: "130px",
    type: "date",
    editable: true,
    isSplit: true,
    splitController: "planned_vs_actual",
  },
  {
    key: "action_calculation",
    label: "Planifier",
    width: "80px",
    type: "action_button",
    editable: false,
  },
  {
    key: "comments",
    label: "Commentaires",
    width: "200px",
    type: "textarea",
    editable: true,
    placeholder: "Ajouter des commentaires...",
  },
  {
    key: "status",
    label: "status",
    width: "150px",
    readonly: true,
    editable: false,
    calculated: true,
    calculateValue: (row) => String(row.status ?? "-"),
  },
];

// Colonnes pour Consultants
export const CONSULTANTS_COLUMNS: ColumnConfig[] = [
  {
    key: "tracking_code",
    label: "Réf N° / Code suivi",
    width: "100px",
    editable: true,
    placeholder: "Réf N°/ Code",
  },
  {
    key: "title",
    label: "Intitulé",
    width: "120px",
    type: "text",
    editable: true,
    placeholder: "Intitulé de la consultation",
  },
  {
    key: "estimated_amount",
    label: "Montant estimatif (MGA)",
    width: "150px",
    type: "number",
    editable: true,
    placeholder: "0.00",
  },
  {
    key: "method",
    label: "Méthode",
    width: "120px",
    type: "select",
    editable: true,
    options: METHOD_OPTIONS_CONSULTANT,
  },
  {
    key: "approach",
    label: "Approche",
    width: "120px",
    type: "select",
    editable: true,
    options: APPROACH_OPTIONS,
  },
  {
    key: "review_status",
    label: "Revue",
    width: "120px",
    type: "select",
    editable: true,
  },
  {
    key: "pricing_type",
    label: "Forfait / Temps passé",
    width: "100px",
    editable: false,
    isSplit: true,
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "terms_of_reference",
    label: "Termes de référence",
    width: "100px",
    type: "date",
    editable: true,
    readonly: false,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    key: "ami",
    label: "AMI",
    width: "100px",
    type: "date",
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    key: "restricted_list",
    label: "Liste restreinte",
    width: "120px",
    type: "date",
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    key: "request_for_proposal",
    label: "Demande de proposition",
    width: "140px",
    type: "date",
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "invitation_date",
    label: "Date invitation",
    width: "130px",
    type: "date",
    readonly: false,
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "submissions_opening_date",
    label: "Date ouverture des plis",
    width: "140px",
    type: "date",
    readonly: false,
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    key: "technical_evaluation",
    label: "Rapport d'évaluation technique",
    width: "150px",
    type: "date",
    editable: true, // Saisie manuelle
    readonly: false,
    isSplit: true,
    splitController: "pricing_type",
    // Saisie manuelle
  },
  { 
    // DATE CALCULÉE (Retro-planning)
    key: "financial_opening_date",
    label: "Ouverture des plis financiers",
    width: "150px",
    type: "date",
    editable: true, // Editable après calcul
    readonly: false,
    isSplit: true,
    splitController: "pricing_type",
    // Editable après calcul
  },
  { 
    key: "contract_draft",
    label: "Projet de contrat négocié",
    width: "140px",
    type: "date",
    editable: true, // Saisie manuelle
    readonly: false,
    isSplit: true,
    splitController: "pricing_type",
    // Saisie manuelle
  },
  {
    // DATE CALCULÉE (Retro-planning)
    key: "contract_date",
    label: "Date signature contrat",
    width: "130px",
    type: "date",
    editable: true, // Editable après calcul
    readonly: false,
    isSplit: true,
    splitController: "pricing_type",
    // Editable après calcul
  },
  {
    // DATE DRIVER - ÉDITABLE (Date Fin)
    key: "mission_end_date",
    label: "Date fin de mission",
    width: "130px",
    type: "date",
    readonly: false,
    editable: true,
    isSplit: true,
    splitController: "pricing_type",
  },
  {
    key: "action_calculation",
    label: "Planifier",
    width: "80px",
    type: "action_button",
    editable: false,
  },
  {
    key: "comments",
    label: "Commentaires",
    width: "150px",
    type: "textarea",
    editable: true,
    placeholder: "Ajouter des commentaires...",
  },
  {
    key: "status",
    label: "status",
    width: "150px",
    readonly: true,
    editable: false,
    calculated: true,
    calculateValue: (row) => String(row.status ?? "-"),
  },
];

// Configuration par type de menu
export const TABLE_CONFIGS = {
  works: {
    label: "Travaux",
    columns: WORKS_GOODS_COLUMNS,
    icon: "▣",
  },
  "goods-services": {
    label: "Biens & Services",
    columns: WORKS_GOODS_COLUMNS, // Identique à Travaux
    icon: "◫",
  },
  consultants: {
    label: "Consultants",
    columns: CONSULTANTS_COLUMNS,
    icon: "◉",
  },
};

// Ordre d'affichage des menus (à modifier pour réorganiser la sidebar)
export const MENU_ITEMS: MenuItemType[] = [
  "works",
  "goods-services",
  "consultants",
];

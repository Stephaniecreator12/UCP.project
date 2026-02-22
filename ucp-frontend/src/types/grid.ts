/**
 * Types pour la grille/tableau
 */

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "textarea"
  // Boutons de bascule (ex: Prévu / Réel, Forfait / Temps passé)
  | "toggle"
  | "action_button"; // Bouton d'action (ex: Calculer)

export type MenuItemType = "works" | "goods-services" | "consultants";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  width?: string;
  type?: FieldType;
  editable?: boolean;
  readonly?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  calculated?: boolean;
  calculateValue?: (row: GridRow) => string | number;
  isSplit?: boolean;
  splitController?: string;
  actionHandler?: (row: GridRow) => void;
}

export interface GridRow {
  [key: string]: unknown;
  _id?: string; // ID temporaire pour les nouvelles lignes
}

export interface GridState {
  rows: GridRow[];
  editingCell: { rowId: string; columnKey: string } | null;
  editValue: unknown;
}

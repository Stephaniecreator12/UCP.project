"use client";

import React, { useState } from "react";
import { ColumnConfig, GridRow } from "@/types/grid";
import GridCell from "./GridCell";


// Props pour le composant GridTable
interface GridTableProps {
  columns: ColumnConfig[];
  rows: GridRow[];
  onRowChange?: (rowId: string, columnKey: string, value: unknown) => void;
  onRowSave?: (row: GridRow) => void;
  onRowDelete?: (rowId: string) => void;
  onRowStop?: (rowId: string) => void;
  onAddRow?: () => void;
  onRowUpdate?: (updatedRow: GridRow) => void;
  isLoading?: boolean;
}

export default function GridTable({
  columns,
  rows,
  onRowChange,
  onRowSave,
  onRowDelete,
  onRowStop,
  onAddRow,
  onRowUpdate,
  isLoading = false,
}: GridTableProps) {
  // Etat pour tracker quelle cellule est en cours d'edition
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnKey: string;
  } | null>(null);

  // Etat pour la valeur actuellement tapee dans l'input
  const [editValue, setEditValue] = useState<unknown>("");

  const splitDateColumns = columns.filter((c) => c.type === "date" && c.isSplit);
  const isDriverDateKey = (key: string): boolean => {
    return key === "delivery_date" || key === "mission_end_date";
  };

  const hasValue = (value: unknown): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== "";
  };
  const hasUnsavedRow = rows.some((row) => String(row._id ?? "").startsWith("_new_"));

  const maxIsoDate = (a: string, b: string): string => {
    return a > b ? a : b;
  };

  const getTodayLocalIso = (): string => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().split("T")[0];
  };

  const getBottomSwitchBlockReason = (
    row: GridRow,
    controllerKey: string,
    bottomLabel: string,
    topLabel: string
  ): string | null => {
    const requiredTopColumns = columns.filter(
      (c) =>
        c.splitController === controllerKey &&
        c.editable !== false &&
        !c.readonly &&
        c.type !== "action_button"
    );

    const missing = requiredTopColumns.find((c) => !hasValue(row[c.key]));
    if (!missing) return null;

    return `Remplissez d'abord "${missing.label}" dans ${topLabel} avant de passer en ${bottomLabel}.`;
  };

  const getSplitDateContext = (columnKey: string) => {
    const isActual = columnKey.endsWith("_actual");
    const baseKey = isActual ? columnKey.replace(/_actual$/, "") : columnKey;
    const columnConfig = splitDateColumns.find((c) => c.key === baseKey);

    if (!columnConfig) return null;

    const index = splitDateColumns.findIndex((c) => c.key === baseKey);
    return { isActual, baseKey, index };
  };

  const validateDateOrder = (
    row: GridRow,
    columnKey: string,
    nextValue: unknown
  ): string | null => {
    if (!hasValue(nextValue)) return null;

    const nextDate = String(nextValue);
    const minDate = getMinDateForColumn(row, columnKey);
    if (minDate && nextDate < minDate) {
      return `La date doit être supérieure ou égale à ${minDate}.`;
    }

    const dateContext = getSplitDateContext(columnKey);
    if (!dateContext) return null;

    const { isActual, baseKey, index } = dateContext;

    if (isDriverDateKey(baseKey)) {
      return null;
    }

    if (isActual && !hasValue(row[baseKey])) {
      return "Impossible de saisir le Réel tant que la date Prévue de cette colonne est vide.";
    }

    if (index > 0) {
      const previousColumn = splitDateColumns[index - 1];
      const previousKey = isActual
        ? `${previousColumn.key}_actual`
        : previousColumn.key;
      const previousValue = row[previousKey];

      if (!hasValue(previousValue)) {
        return "Remplissez d'abord la colonne précédente.";
      }

      if (String(nextValue) < String(previousValue)) {
        return "La date doit être supérieure ou égale à la date de la colonne précédente.";
      }
    }

    return null;
  };

  const getMinDateForColumn = (row: GridRow, columnKey: string): string | undefined => {
    let minDate: string | undefined = getTodayLocalIso();
    const dateContext = getSplitDateContext(columnKey);

    if (!dateContext) {
      return minDate;
    }

    const { isActual, baseKey, index } = dateContext;

    if (isActual) {
      const plannedDate = row[baseKey];
      if (hasValue(plannedDate)) {
        const plannedIso = String(plannedDate);
        minDate = minDate ? maxIsoDate(minDate, plannedIso) : plannedIso;
      }
    }

    if (index > 0) {
      const previousColumn = splitDateColumns[index - 1];
      const previousKey = isActual
        ? `${previousColumn.key}_actual`
        : previousColumn.key;
      const previousValue = row[previousKey];
      if (hasValue(previousValue)) {
        const previousIso = String(previousValue);
        minDate = minDate ? maxIsoDate(minDate, previousIso) : previousIso;
      }
    }

    return minDate;
  };

  // Quand on clique sur une cellule
  const handleCellClick = (rowId: string | undefined, column: ColumnConfig) => {
    if (!rowId || !column.editable || column.readonly) {
      return;
    }

    setEditingCell({ rowId, columnKey: column.key });
    const currentValue = rows.find((r) => r._id === rowId)?.[column.key];
    setEditValue(currentValue ?? "");
  };

  // Quand on change la valeur dans l'input
  const handleCellChange = (value: unknown) => {
    setEditValue(value);
  };

  // Quand on quitte une cellule ou appuie sur Entree
  const handleCellBlur = () => {
    if (!editingCell) return;

    const row = rows.find((r) => r._id === editingCell.rowId);

    if (row && onRowChange) {
      const dateValidationError = validateDateOrder(
        row,
        editingCell.columnKey,
        editValue
      );

      if (dateValidationError) {
        alert(dateValidationError);
        return;
      }

      console.log("Saving row change:", editingCell.rowId, editingCell.columnKey, editValue);
      onRowChange(editingCell.rowId, editingCell.columnKey, editValue);
      // REMOVED AUTO-SAVE: onRowSave is now only called manually via the main button
    }

    setEditingCell(null);
    setEditValue("");
  };

  // Gestion des touches (Enter = save, Escape = cancel)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  // Obtenir la largeur d'une colonne
  const getColumnWidth = (column: ColumnConfig): string => {
    const configuredWidth = column.width || "150px";
    const configuredWidthPx = Number.parseInt(configuredWidth, 10);
    const safeConfiguredWidth = Number.isNaN(configuredWidthPx)
      ? 150
      : configuredWidthPx;
    const compactConfiguredWidth = Math.round(safeConfiguredWidth * 0.9);
    const headerBasedMinWidth = Math.max(86, column.label.length * 6 + 24);
    return `${Math.max(compactConfiguredWidth, headerBasedMinWidth)}px`;
  };

  // Afficher la valeur d'une cellule
  const getCellValue = (row: GridRow, column: ColumnConfig): string => {
    if (column.calculated && column.calculateValue) {
      return String(column.calculateValue(row));
    }

    const value = row[column.key];

    if (value === null || value === undefined) {
      return "";
    }

    // Si c'est un select, on affiche le Label correspondant à la valeur
    if (column.type === "select" && column.options) {
      const option = column.options.find((opt) => opt.value === value);
      return option ? option.label : String(value);
    }

    if (typeof value === "boolean") {
      return value ? "oui" : "non";
    }

    return String(value);
  };

  const getStatusInlineStyle = (value: unknown): React.CSSProperties => {
    const status = String(value ?? "").trim().toLowerCase();
    const normalized = status
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("retard")) {
      return { backgroundColor: "#b91c1c", color: "#ffffff" };
    }
    if (normalized.includes("dans les temps")) {
      return { backgroundColor: "#4f8a3f", color: "#ffffff" };
    }
    if (normalized.includes("termine")) {
      return { backgroundColor: "#2f8a5c", color: "#ffffff" };
    }
    if (normalized.includes("arrete")) {
      return { backgroundColor: "#64748b", color: "#ffffff" };
    }
    return {};
  };

  // CALCUL des dates (via Backend)
  const handleCalculate = async (row: GridRow) => {
    // 1. Determine Driver Date
    const driverDate =
      row.delivery_date ||
      row.delivery_date_actual ||
      row.mission_end_date ||
      row.mission_end_date_actual;
    if (!driverDate) {
      alert("Veuillez d'abord saisir une date de fin (Livraison ou Fin de mission).");
      return;
    }
    if (!hasValue(row.method)) {
      alert("Veuillez d'abord choisir une méthode.");
      return;
    }

    try {
      // 2. Appel Backend
      // Import dynamique ou passage en props si besoin, ici on utilise l'import direct
      const { calculatePlanning } = await import("@/services/api");

      const type =
        (row.type as "Travaux" | "Biens" | "Consultance" | undefined) ?? "Travaux";
      const method = String(row.method).toLowerCase();
      const newDates = await calculatePlanning(type, driverDate, method);

      // 3. Mapping des résultats (Backend -> Frontend keys)
      // Le backend renvoie: dossiers_appel_prevu, date_lancement_prevu, etc.
      // Le frontend attend: tender_documents_date, launch_date, etc.

      const mappedDates: GridRow =
        type === "Consultance"
          ? {
              terms_of_reference: newDates.TdR_prevu,
              ami: newDates.ami_prevu,
              request_for_proposal: newDates.demande_proposition_prevu,
              submissions_opening_date: newDates.date_ouverture_prevu,
              financial_opening_date: newDates.ouverture_plis_prevu,
              contract_date: newDates.date_signature_prevu,
              mission_end_date: newDates.date_fin_prevu,
            }
          : {
              tender_documents_date: newDates.dossiers_appel_prevu,
              launch_date: newDates.date_lancement_prevu,
              opening_date: newDates.date_ouverture_prevu,
              evaluation_report: newDates.rapport_evaluation_prevu,
              contract_date: newDates.date_signature_prevu,
              specifications_date:
                newDates.listesetspecifications || newDates.dossiers_appel_prevu,
            };

      // Apply updates
      if (onRowUpdate && row._id) {
        // On doit mettre à jour plusieurs champs. 
        const updatedRow = {
          ...row,
          ...mappedDates,
          _isCalculated: true
        };

        onRowUpdate(updatedRow);
      }

      alert("Calcul terminé avec succès !");

    } catch (error: unknown) {
      console.error(error);
      let msg = error instanceof Error ? error.message : "Erreur inconnue";
      if (msg === "Failed to fetch") {
        msg = "Impossible de contacter le serveur. Vérifiez que le backend est lancé sur l'adresse IP configurée.";
      }
      alert("Erreur: " + msg);
    }
  };

  // CHECK: Can we edit this cell?
  const isCellEditable = (row: GridRow, column: ColumnConfig, isActual: boolean) => {
    // 1. Global overrides
    if (column.readonly) return false;
    if (column.editable === false) return false;

    // 2. Action Button -> Always clickable (handled separately, but not "editable" in input sense)
    if (column.type === "action_button") return false;

    // 3. Driver Dates -> Always editable
    if (column.key === "delivery_date" || column.key === "mission_end_date") return true;

    // 4. PLANNED DATES Logic
    // "Ces dates prevue apres calcul deviennent editables"
    // Heuristic: If we have a calculated marker OR values exist, allow edit.
    if (!isActual && column.type === "date") {
      // If it's a date driver, we already returned true.
      // For others:
      const hasValues = !!row[column.key];
      const isCalculated = row._isCalculated === true;
      const dateColumns = columns.filter(c => c.type === "date" && c.isSplit);
      const myIndex = dateColumns.findIndex(c => c.key === column.key);

      if (myIndex > 0) {
        const prevColumn = dateColumns[myIndex - 1];
        const prevPlannedValue = row[prevColumn.key];
        if (!prevPlannedValue) return false;
      }

      // Strict rule: before calculation, only the driver date is editable.
      // Planned dates become editable only after calculation (or if already populated).
      return hasValues || isCalculated;
    }

    // 5. ACTUAL DATES Logic (Strict Sequential)
    if (isActual && column.type === "date") {
      // Rule A: Planned date must exist
      const plannedValue = row[column.key];
      if (!plannedValue) return false;

      // Rule B: Previous Actual date must exist
      // We need to find the "date index" in the columns list
      // Filter only Date columns that are split (Planned/Actual)
      const dateColumns = columns.filter(c => c.type === "date" && c.isSplit);
      const myIndex = dateColumns.findIndex(c => c.key === column.key);

      if (myIndex > 0) {
        const prevColumn = dateColumns[myIndex - 1];
        const prevActualKey = `${prevColumn.key}_actual`;
        const prevActualValue = row[prevActualKey];
        if (!prevActualValue) return false;
      }
      return true;
    }

    // Default for non-dates or non-split
    return true;
  };

  // Check if we are currently editing (visual state)
  const isEditing = (rowId: string | undefined, columnKey: string) => {
    if (!rowId) return false;
    return editingCell?.rowId === rowId && editingCell?.columnKey === columnKey;
  };

  // RENDU
  return (
    <div className="grid-table-container">
      <div className="grid-table-wrapper">
        <table className="table table-bordered table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th className="text-center action-header" style={{ width: "104px", minWidth: "104px" }}>
                Action
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: getColumnWidth(column),
                    minWidth: getColumnWidth(column),
                  }}
                  title={column.label}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center text-muted py-5"
                >
                  {isLoading
                    ? "Chargement..."
                    : "Aucune donnee disponible."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const normalizedRowStatus = String(row.status ?? "")
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");
                const isRowStopped = normalizedRowStatus === "arrete";
                const isRowClosed =
                  normalizedRowStatus === "arrete" ||
                  normalizedRowStatus === "termine";

                return (
                <tr
                  key={row._id}
                  className={isRowStopped ? "row-stopped" : ""}
                >
                  <td
                    className="text-center align-middle action-cell"
                    style={{ width: "104px", minWidth: "104px", padding: "8px" }}
                  >
                    <div className="d-flex gap-2 justify-content-center action-buttons">
                      {(() => {
                        const status = String(row.status ?? "").trim();
                        const normalizedStatus = status
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "");
                        const isNewRow = String(row._id ?? "").startsWith("_new_");
                        const stopDisabled = isNewRow || normalizedStatus === "arrete";

                        return (
                          <button
                            className="action-btn action-btn-stop"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row._id && onRowStop && !stopDisabled) onRowStop(row._id);
                            }}
                            disabled={stopDisabled}
                            title="Arrêter"
                            aria-label="Arrêter la ligne"
                          >
                            <svg
                              className="action-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </button>
                        );
                      })()}
                      <button
                        className="action-btn action-btn-save"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRowClosed) return;
                          if (onRowSave) onRowSave(row);
                          else console.warn("onRowSave not provided");
                        }}
                        disabled={isRowClosed}
                        title="Enregistrer la ligne"
                        aria-label="Enregistrer la ligne"
                      >
                        <svg
                          className="action-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M6.5 12.5l3.2 3.2L17.5 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row._id && onRowDelete) onRowDelete(row._id);
                        }}
                        title="Supprimer"
                        aria-label="Supprimer la ligne"
                      >
                        <svg
                          className="action-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M8.5 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M6 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M8 8l.8 9.5a1.2 1.2 0 001.2 1.1h4a1.2 1.2 0 001.2-1.1L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          <path d="M10.5 11.2v4.2M13.5 11.2v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {columns.map((column) => {
                    const isStatusColumn = column.key === "status";
                    const statusValue = isStatusColumn ? getCellValue(row, column) : "";
                    const statusCellStyle = isStatusColumn ? getStatusInlineStyle(statusValue) : undefined;

                    return (
                    <td
                      key={`${row._id}-${column.key}`}
                      className={`align-middle grid-cell ${column.editable && !column.readonly
                        ? "editable-cell"
                        : "readonly-cell"
                        }`}
                      style={{
                        width: getColumnWidth(column),
                        minWidth: getColumnWidth(column),
                        padding: isStatusColumn ? "0" : "8px 12px",
                        cursor:
                          column.editable && !column.readonly
                            ? "pointer"
                            : "not-allowed",
                        ...(statusCellStyle || {}),
                      }}>
                      {column.isSplit ? (
                        <div className="d-flex flex-column h-100">
                          {(() => {
                            // 1. Determine Controller State
                            // Identify keys and values
                            const isPricing = column.splitController === "pricing_type" || column.key === "pricing_type";
                            const controllerKey = column.splitController || column.key; // If self-controlled (label column)

                            // Values map
                            const VAL_TOP = isPricing ? "forfait" : "planned";
                            const VAL_BOTTOM = isPricing ? "time_based" : "actual";

                            // Current state (Default to Top if empty)
                            const currentValue = row[controllerKey] || VAL_TOP;
                            const isTopActive = currentValue === VAL_TOP;
                            const isBottomActive = currentValue === VAL_BOTTOM;

                            // 2. Check if this is the "Label/Controller" column itself
                            const isLabelColumn =
                              column.key === "planned_vs_actual" ||
                              column.key === "pricing_type";

                            // Labels
                            let topLabel = "Prévu";
                            let bottomLabel = "Réel";
                            if (column.key === "pricing_type") {
                              topLabel = "Forfait";
                              bottomLabel = "Temps passé";
                            }

                            // HELPER: Render Half Cell
                            const renderHalfCell = (isActual: boolean) => {
                              const isActive = isActual ? isBottomActive : isTopActive;

                              // Determine background color based on logic:
                              // 1. Read-only columns are ALWAYS Grey (Visual consistency)
                              // 2. Active Editable cells are White
                              // 3. Inactive Editable cells are Rose (or Tinted) - "Animation" state
                              // 4. Initial state is Neutral White

                              const isEditable = isCellEditable(row, column, isActual);

                              // SPECTACULAR THEME LOGIC
                              // 1. Read-only columns: Slate 100 (#f1f5f9) - Subtle & Professional
                              // 2. Active Editable cells: White (#ffffff) with Glow
                              // 3. Inactive cells: Slate 50 (#f8fafc)

                              const isColumnReadonly = column.readonly || column.editable === false;
                              const hasExplicitState = !!row[controllerKey];

                              let bgColor = "transparent";
                              let textColor = "#334155"; // Slate 700

                              if (isRowStopped) {
                                bgColor = "transparent";
                                textColor = "inherit";
                              } else

                              if (isColumnReadonly) {
                                bgColor = "#f1f5f9"; // Slate 100
                                textColor = "#64748b"; // Slate 500
                              } else if (!isEditable) {
                                bgColor = "#f8fafc";
                                textColor = "#94a3b8";
                              } else if (!hasExplicitState) {
                                bgColor = "transparent";
                              } else if (isActive) {
                                bgColor = "#ffffff";
                              } else {
                                bgColor = "#f8fafc";
                                textColor = "#64748b";
                              }

                              const bgStyle = { backgroundColor: bgColor, color: textColor };
                              const cursorStyle = (isActive && isEditable) ? "text" : "not-allowed";

                              // --- CONTROLLER BUTTON ---
                              if (isLabelColumn) {
                                const targetValue = isActual ? VAL_BOTTOM : VAL_TOP;
                                const switchBlockedReason =
                                  isActual
                                    ? getBottomSwitchBlockReason(
                                      row,
                                      controllerKey,
                                      bottomLabel,
                                      topLabel
                                    )
                                    : null;
                                const buttonStyle = isRowStopped
                                  ? {
                                      backgroundColor: "transparent",
                                      color: "inherit",
                                      border: "1px solid rgba(255, 255, 255, 0.25)",
                                      boxShadow: "none",
                                      transform: "none",
                                    }
                                  : isActive
                                  ? {
                                    backgroundColor: "#334155", // Slate 700 - Deep & Classy
                                    color: "#ffffff",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    transform: "translateY(-1px)"
                                  }
                                  : {
                                    backgroundColor: "transparent",
                                    color: "#94a3b8",
                                    border: "1px solid #e2e8f0"
                                  };

                                return (
                                  <div
                                    className={`flex-grow-1 p-2 d-flex align-items-center justify-content-center m-1`}
                                    style={{
                                      ...buttonStyle,
                                      minHeight: "35px",
                                      borderRadius: "8px",
                                      cursor: isRowStopped
                                        ? "not-allowed"
                                        : switchBlockedReason
                                          ? "not-allowed"
                                          : "pointer",
                                      fontWeight: "700", // Bolder
                                      fontSize: "0.80rem",
                                      letterSpacing: "0.025em",
                                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                      userSelect: "none",
                                      opacity: isRowStopped || switchBlockedReason ? 0.6 : 1
                                    }}
                                    onClick={(e) => {
                                      if (isRowStopped) {
                                        return;
                                      }
                                      e.stopPropagation();
                                      if (switchBlockedReason) {
                                        alert(switchBlockedReason);
                                        return;
                                      }
                                      if (onRowChange && row._id) {
                                        onRowChange(row._id, column.key, targetValue);
                                      }
                                    }}
                                  >
                                    {isActual ? bottomLabel : topLabel}
                                  </div>
                                );
                              }

                              // --- DATA COLUMN ---
                              const effectiveKey = isActual ? `${column.key}_actual` : column.key;
                              const cellValue = row[effectiveKey];

                              return (
                                <div
                                  className={`flex-grow-1 p-2 ${isActual ? "border-top-subtle" : ""}`}
                                  style={{
                                    ...bgStyle,
                                    minHeight: "35px",
                                    cursor: cursorStyle,
                                    borderTop: isActual ? "1px solid #f1f5f9" : "none",
                                    transition: "all 0.2s ease"
                                  }}
                                  onClick={(e) => {
                                    if (isActive && isEditable) {
                                      e.stopPropagation();
                                      setEditingCell({ rowId: row._id!, columnKey: effectiveKey });
                                      setEditValue(cellValue ?? "");
                                    }
                                  }}
                                >
                                  {editingCell?.rowId === row._id && editingCell?.columnKey === effectiveKey ? (
                                    <GridCell
                                      column={column}
                                      value={editValue}
                                      onChange={handleCellChange}
                                      onConfirm={(val) => {
                                        if (onRowChange && row._id) {
                                          onRowChange(row._id, effectiveKey, val);
                                        }
                                        setEditingCell(null);
                                        setEditValue("");
                                      }}
                                      onBlur={handleCellBlur}
                                      onKeyDown={handleKeyDown}
                                      minDate={column.type === "date" ? getMinDateForColumn(row, effectiveKey) : undefined}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="cell-value text-truncate" style={{ fontWeight: 500 }}>
                                      {cellValue}
                                    </div>
                                  )}
                                </div>
                              );
                            };

                            return (
                              <>
                                {renderHalfCell(false)}
                                {renderHalfCell(true)}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        (() => {
                          const displayValue = getCellValue(row, column);

                          return (
                            <div
                              className={
                                isStatusColumn
                                  ? "h-100 w-100 d-flex align-items-center justify-content-center"
                                  : "h-100 w-100 p-2 d-flex align-items-center justify-content-center"
                              }
                              onClick={() => {
                                if (column.type === "action_button") {
                                  if (column.key === "action_calculation") {
                                    handleCalculate(row);
                                  }
                                } else {
                                  handleCellClick(row._id, column);
                                }
                              }}
                            >
                          {column.type === "action_button" ? (
                            <button className="btn btn-sm" style={{
                              background: "linear-gradient(to right, #26784f, #32a065)",
                              color: "white",
                              border: "none",
                              boxShadow: "0 4px 6px rgba(38, 120, 79, 0.28)"
                            }} onClick={(e) => {
                              e.stopPropagation();
                              handleCalculate(row);
                            }}>
                              Calculer
                            </button>
                          ) : isEditing(row._id, column.key) ? (
                            <GridCell
                              column={column}
                              value={editValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onConfirm={(val) => {
                                if (onRowChange && row._id) {
                                  onRowChange(row._id, column.key, val);
                                }
                                setEditingCell(null);
                                setEditValue("");
                              }}
                              onKeyDown={handleKeyDown}
                              minDate={column.type === "date" ? getMinDateForColumn(row, column.key) : undefined}
                              autoFocus
                            />
                          ) : (
                            <div className="cell-value">
                              {displayValue}
                            </div>
                          )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    );
                  })}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex gap-2 p-3 border-top" style={{ background: "#ffffff", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
        <button
          className="btn"
          style={{
            background: "#10b981",
            color: "white",
            fontWeight: "bold",
            padding: "10px 24px"
          }}
          onClick={onAddRow}
          disabled={isLoading || hasUnsavedRow}
        >
          + Ajouter une ligne
        </button>
      </div>
    </div >
  );
}

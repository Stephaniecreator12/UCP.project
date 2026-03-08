"use client";

import React, { useEffect, useRef } from "react";
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
  onRowUpdate,
  isLoading = false,
}: GridTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previousRowsCountRef = useRef(rows.length);
  const datePopupTimeoutRef = useRef<number | null>(null);
  const [uiPopup, setUiPopup] = React.useState<{
    kind: "date" | "method";
    title: string;
    message: string;
  } | null>(null);

  const showDateValidationPopup = (message: string) => {
    setUiPopup({ kind: "date", title: "Date non valide", message });
    if (datePopupTimeoutRef.current) {
      window.clearTimeout(datePopupTimeoutRef.current);
    }
    datePopupTimeoutRef.current = window.setTimeout(() => {
      setUiPopup(null);
      datePopupTimeoutRef.current = null;
    }, 1600);
  };

  const showMethodRequiredPopup = () => {
    setUiPopup({
      kind: "method",
      title: "Méthode requise",
      message: "Choisissez d'abord une méthode de passation avant de planifier.",
    });
    if (datePopupTimeoutRef.current) {
      window.clearTimeout(datePopupTimeoutRef.current);
    }
    datePopupTimeoutRef.current = window.setTimeout(() => {
      setUiPopup(null);
      datePopupTimeoutRef.current = null;
    }, 2200);
  };

  const scrollToMethodCell = (rowId: string) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const selector = `tr[data-row-id="${rowId}"] td[data-col-key="method"]`;
    const methodCell = wrapper.querySelector<HTMLElement>(selector);
    if (!methodCell) return;

    methodCell.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    methodCell.classList.add("method-required-pulse");
    methodCell.classList.add("method-required-invite");
    const methodInput = methodCell.querySelector<HTMLElement>("select, input, textarea, button");
    if (methodInput) {
      requestAnimationFrame(() => methodInput.focus());
      methodInput.classList.add("method-required-focus");
      window.setTimeout(() => methodInput.classList.remove("method-required-focus"), 1800);
    }
    window.setTimeout(() => {
      methodCell.classList.remove("method-required-pulse");
      methodCell.classList.remove("method-required-invite");
    }, 3600);
  };

  useEffect(() => {
    const previousCount = previousRowsCountRef.current;
    previousRowsCountRef.current = rows.length;

    if (rows.length <= previousCount) return;

    const lastRow = rows[rows.length - 1];
    if (!lastRow || !String(lastRow._id ?? "").startsWith("_new_")) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    requestAnimationFrame(() => {
      wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: "smooth" });
      const targetRowId = String(lastRow._id ?? "");
      const targetRow = wrapper.querySelector<HTMLTableRowElement>(
        `tr[data-row-id="${targetRowId}"]`,
      );
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    });
  }, [rows]);

  useEffect(() => {
    return () => {
      if (datePopupTimeoutRef.current) {
        window.clearTimeout(datePopupTimeoutRef.current);
      }
    };
  }, []);

  const splitDateColumns = columns.filter((c) => c.type === "date" && c.isSplit);
  const linearDateColumns = columns.filter((c) => c.type === "date" && !c.isSplit);
  const isDriverDateKey = (key: string): boolean => {
    return key === "delivery_date" || key === "mission_end_date";
  };

  const hasValue = (value: unknown): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== "";
  };
  const isSupportedMethodValue = (value: unknown): boolean => {
    const method = String(value ?? "").trim().toLowerCase();
    if (!method || method === "non défini" || method === "non defini") return false;
    return ["aon", "aoi", "dc", "ed", "sfq", "sfqc", "smc", "sqc", "sci", "sed"].includes(method);
  };

  const maxIsoDate = (a: string, b: string): string => {
    return a > b ? a : b;
  };

  const minIsoDate = (a: string, b: string): string => {
    return a < b ? a : b;
  };

  const getTodayLocalIso = (): string => {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().split("T")[0];
  };

  const getTomorrowLocalIso = (): string => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
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

  const getColumnConfig = (columnKey: string) => {
    const baseKey = columnKey.endsWith("_actual")
      ? columnKey.replace(/_actual$/, "")
      : columnKey;
    return columns.find((c) => c.key === baseKey);
  };

  const validateDateOrder = (
    row: GridRow,
    columnKey: string,
    nextValue: unknown
  ): string | null => {
    const columnConfig = getColumnConfig(columnKey);
    if (!columnConfig || columnConfig.type !== "date") return null;
    if (!hasValue(nextValue)) return null;

    const nextDate = String(nextValue);
    const { minDate, maxDate } = getDateBounds(row, columnKey);
    if (minDate && nextDate < minDate) {
      return `La date doit être supérieure ou égale à ${minDate}.`;
    }
    if (maxDate && nextDate > maxDate) {
      return `La date doit être inférieure ou égale à ${maxDate}.`;
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
    const columnConfig = getColumnConfig(columnKey);
    if (!columnConfig || columnConfig.type !== "date") return undefined;
    let minDate: string | undefined;
    const dateContext = getSplitDateContext(columnKey);

    if (!dateContext) {
      const linearIndex = linearDateColumns.findIndex((c) => c.key === columnKey);
      if (linearIndex > 0) {
        const previousColumn = linearDateColumns[linearIndex - 1];
        const previousValue = row[previousColumn.key];
        if (hasValue(previousValue)) {
          minDate = String(previousValue);
        }
      }
      return minDate;
    }

    const { isActual, baseKey, index } = dateContext;

    if (!isActual && isDriverDateKey(baseKey)) {
      minDate = getTomorrowLocalIso();
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

  const getMaxDateForColumn = (row: GridRow, columnKey: string): string | undefined => {
    const columnConfig = getColumnConfig(columnKey);
    if (!columnConfig || columnConfig.type !== "date") return undefined;

    let maxDate: string | undefined;
    const dateContext = getSplitDateContext(columnKey);
    if (!dateContext) {
      const linearIndex = linearDateColumns.findIndex((c) => c.key === columnKey);
      if (linearIndex >= 0 && linearIndex < linearDateColumns.length - 1) {
        const nextColumn = linearDateColumns[linearIndex + 1];
        const nextValue = row[nextColumn.key];
        if (hasValue(nextValue)) {
          maxDate = String(nextValue);
        }
      }
      return maxDate;
    }

    const { isActual, index } = dateContext;
    if (isActual) {
      maxDate = getTodayLocalIso();
    }

    if (index < splitDateColumns.length - 1) {
      const nextColumn = splitDateColumns[index + 1];
      const nextKey = isActual ? `${nextColumn.key}_actual` : nextColumn.key;
      const nextValue = row[nextKey];
      if (hasValue(nextValue)) {
        const nextIso = String(nextValue);
        maxDate = maxDate ? minIsoDate(maxDate, nextIso) : nextIso;
      }
    }

    return maxDate;
  };

  const getDateBounds = (row: GridRow, columnKey: string) => {
    const minDate = getMinDateForColumn(row, columnKey);
    let maxDate = getMaxDateForColumn(row, columnKey);
    if (minDate && maxDate && maxDate < minDate) {
      maxDate = minDate;
    }
    return { minDate, maxDate };
  };

  const commitCellValue = (
    row: GridRow,
    column: ColumnConfig,
    columnKey: string,
    value: unknown,
    validateDateRules: boolean = true
  ): boolean => {
    if (!row._id || !onRowChange) return false;

    if (column.type === "date" && validateDateRules) {
      const dateValidationError = validateDateOrder(row, columnKey, value);
      if (dateValidationError) {
        showDateValidationPopup(dateValidationError);
        return false;
      }
    }

    onRowChange(row._id, columnKey, value);
    return true;
  };

  const handleClassicInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLElement).blur();
    }
  };

  // Obtenir la largeur d'une colonne
  const getColumnWidth = (column: ColumnConfig): string => {
    const configuredWidth = column.width || "150px";
    const configuredWidthPx = Number.parseInt(configuredWidth, 10);
    const safeConfiguredWidth = Number.isNaN(configuredWidthPx)
      ? 150
      : configuredWidthPx;
    const compactConfiguredWidth = column.type === "date"
      ? safeConfiguredWidth
      : Math.round(safeConfiguredWidth * 0.9);
    const headerBasedMinWidth = Math.max(86, column.label.length * 6 + 24);
    const dateMinWidth = column.type === "date" ? 138 : 0;
    return `${Math.max(compactConfiguredWidth, headerBasedMinWidth, dateMinWidth)}px`;
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

  // Obtenir les informations de tooltip pour les abréviations
  const getTooltipInfo = (value: unknown, column: ColumnConfig): { text: string; show: boolean } => {
    if (column.type !== "select" || !column.options) {
      return { text: "", show: false };
    }

    const normalizedValue = String(value ?? "");
    const option = column.options.find(
      (opt) => opt.value === normalizedValue || opt.label === normalizedValue,
    );
    if (!option || !option.description) {
      return { text: "", show: false };
    }

    return { text: option.description, show: true };
  };

  // Gestionnaire de tooltips simple et performant
  const handleCellHover = (event: React.MouseEvent, tooltipText: string) => {
    if (!tooltipText) return;
    
    const existingTooltip = document.getElementById('dynamic-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'dynamic-tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.cssText = `
      position: absolute;
      background: linear-gradient(165deg, rgba(11, 18, 25, 0.98), rgba(19, 32, 43, 0.98));
      color: #ecf5ff;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      line-height: 1.35;
      max-width: 340px;
      box-shadow: 0 20px 35px -20px rgba(2, 10, 18, 0.92);
      border: 1px solid rgba(91, 156, 122, 0.36);
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
      transform: translateY(4px);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredLeft = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    const clampedLeft = Math.min(
      window.innerWidth - tooltip.offsetWidth - viewportPadding,
      Math.max(viewportPadding, preferredLeft),
    );
    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
  };

  const handleCellLeave = () => {
    const tooltip = document.getElementById('dynamic-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 200);
    }
  };

  const getStatusToneClass = (value: unknown): string => {
    const status = String(value ?? "").trim().toLowerCase();
    const normalized = status
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("retard")) {
      return "status-tone-late";
    }
    if (normalized.includes("en cours") || normalized.includes("encours") || normalized.includes("traitement")) {
      return "status-tone-progress";
    }
    if (normalized.includes("dans les temps")) {
      return "status-tone-ontime";
    }
    if (normalized.includes("termine")) {
      return "status-tone-done";
    }
    if (normalized.includes("arrete")) {
      return "status-tone-stopped";
    }
    return "status-tone-default";
  };

  // CALCUL des dates (via Backend)
  const handleCalculate = async (row: GridRow) => {
    // 1. Determine Driver Date
    const driverDateValue =
      row.delivery_date ||
      row.delivery_date_actual ||
      row.mission_end_date ||
      row.mission_end_date_actual;
    const driverDate = typeof driverDateValue === "string" ? driverDateValue : "";
    if (!driverDate) {
      alert("Veuillez d'abord saisir une date de fin (Livraison ou Fin de mission).");
      return;
    }
    if (!isSupportedMethodValue(row.method)) {
      showMethodRequiredPopup();
      if (row._id) {
        scrollToMethodCell(String(row._id));
      }
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
              specifications_date: newDates.dossiers_appel_prevu,
            };

      // Apply updates
      if (onRowUpdate && row._id) {
        // On doit mettre à jour plusieurs champs. 
        const updatedRow = {
          ...row,
          ...mappedDates,
          ...(type === "Consultance"
            ? { pricing_type: String(row.pricing_type ?? "").trim() || "forfait" }
            : {}),
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
    const isConsultanceForfaitAfterCalc =
      row.type === "Consultance" &&
      row._isCalculated === true &&
      String(row.pricing_type ?? "forfait").toLowerCase() === "forfait";

    // Explicit non-editable columns.
    if (column.type === "action_button" || column.key === "status") return false;

    // 1. Global overrides
    if (column.readonly) return false;
    if (column.editable === false) return false;

    // 3. Driver Dates -> Always editable only on top lane (Prévu / Forfait).
    // On bottom lane (Réel / Temps passé), sequential rules must still apply.
    if (!isActual && (column.key === "delivery_date" || column.key === "mission_end_date")) {
      return true;
    }

    // 4. PLANNED DATES Logic
    // "Ces dates prevue apres calcul deviennent editables"
    // Heuristic: If we have a calculated marker OR values exist, allow edit.
    if (!isActual && column.type === "date") {
      // Business rule: after planning in Consultance/Forfait, all forfait dates stay manually editable.
      if (isConsultanceForfaitAfterCalc) {
        return true;
      }

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

  // RENDU
  return (
    <div className="grid-table-container">
      <div className="grid-table-wrapper" ref={wrapperRef}>
        <table className="table table-bordered table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th
                className="text-center action-header"
                style={{
                  width: "124px",
                  minWidth: "124px",
                  fontFamily: "var(--font-ui), Segoe UI, Arial, sans-serif",
                  letterSpacing: "0",
                  fontVariantLigatures: "none",
                  fontFeatureSettings: "\"liga\" 0, \"calt\" 0",
                }}
              >
                Action
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: getColumnWidth(column),
                    minWidth: getColumnWidth(column),
                    textAlign: "center",
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
                const isNewRow = String(row._id ?? "").startsWith("_new_");

                return (
                <tr
                  key={row._id}
                  data-row-id={String(row._id ?? "")}
                  className={`${isRowStopped ? "row-stopped" : ""} ${isNewRow ? "row-newly-added" : ""}`.trim()}
                >
                  <td
                    className="text-center align-middle action-cell"
                    style={{ width: "124px", minWidth: "124px", padding: "8px" }}
                  >
                    <div className="d-flex gap-2 justify-content-center action-buttons">
                      {(() => {
                        const status = String(row.status ?? "").trim();
                        const normalizedStatus = status
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "");
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
                              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
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
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
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
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {columns.map((column) => {
                    const isStatusColumn = column.key === "status";
                    const statusValue = isStatusColumn ? getCellValue(row, column) : "";
                    const statusToneClass = isStatusColumn ? getStatusToneClass(statusValue) : "";
                    const isSplitColumn = !!column.isSplit;
                    const isColumnEditableForRow = isSplitColumn
                      ? (isCellEditable(row, column, false) || isCellEditable(row, column, true))
                      : isCellEditable(row, column, false);

                    return (
                    <td
                      key={`${row._id}-${column.key}`}
                      data-col-key={column.key}
                      className={`align-middle grid-cell ${isStatusColumn ? "status-cell" : ""} ${
                        isColumnEditableForRow && !isStatusColumn
                          ? "editable-cell"
                          : "readonly-cell"
                      }`}
                      style={{
                        width: getColumnWidth(column),
                        minWidth: getColumnWidth(column),
                        padding: isStatusColumn ? "0" : "8px 12px",
                        cursor:
                          isColumnEditableForRow && !isStatusColumn
                            ? "pointer"
                            : "not-allowed",
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
                                      backgroundColor: "rgba(235, 226, 214, 0.45)",
                                      color: "#7b6d5b",
                                      border: "1px solid rgba(162, 142, 117, 0.35)",
                                      boxShadow: "none",
                                      transform: "none",
                                    }
                                  : isActive
                                  ? {
                                    background: "linear-gradient(145deg, #7d6a54 0%, #6a5947 100%)",
                                    color: "#fdf7ee",
                                    border: "1px solid rgba(117, 96, 73, 0.9)",
                                    boxShadow: "0 8px 14px -10px rgba(79, 60, 39, 0.9)",
                                    transform: "translateY(-1px)"
                                  }
                                  : {
                                    background: "linear-gradient(180deg, rgba(245, 235, 220, 0.95), rgba(234, 220, 200, 0.95))",
                                    color: "#6d5e4c",
                                    border: "1px solid rgba(170, 150, 124, 0.6)"
                                  };

                                return (
                                  <div
                                    className={`flex-grow-1 p-2 d-flex align-items-center justify-content-center m-1 ${isActual ? "split-divider" : ""}`}
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
                                  className={`flex-grow-1 p-2 ${isActual ? "split-divider" : ""}`}
                                  style={{
                                    ...bgStyle,
                                    minHeight: "35px",
                                    cursor: cursorStyle,
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  {isActive && isEditable ? (
                                    <GridCell
                                      column={column}
                                      value={cellValue ?? ""}
                                      onChange={(val) => {
                                        commitCellValue(row, column, effectiveKey, val, false);
                                      }}
                                      onConfirm={(val) => {
                                        return commitCellValue(row, column, effectiveKey, val, true);
                                      }}
                                      onValidationMessage={showDateValidationPopup}
                                      onBlur={() => undefined}
                                      onKeyDown={handleClassicInputKeyDown}
                                      minDate={column.type === "date" ? getDateBounds(row, effectiveKey).minDate : undefined}
                                      maxDate={column.type === "date" ? getDateBounds(row, effectiveKey).maxDate : undefined}
                                    />
                                  ) : (
                                    <div className="cell-value text-truncate" style={{ fontWeight: 500 }}>
                                      {String(cellValue ?? "")}
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
                          const tooltipInfo = getTooltipInfo(row[column.key], column);

                          return (
                            <div
                              className={
                                isStatusColumn
                                  ? `h-100 w-100 status-pill-inline ${statusToneClass}`
                                  : "h-100 w-100 p-2 d-flex align-items-center justify-content-center"
                              }
                              onMouseEnter={(e) => tooltipInfo.show ? handleCellHover(e, tooltipInfo.text) : undefined}
                              onMouseLeave={handleCellLeave}
                              onClick={() => {
                                if (column.type === "action_button") {
                                  if (column.key === "action_calculation") {
                                    handleCalculate(row);
                                  }
                                }
                              }}
                            >
                          {column.type === "action_button" ? (
                            <button className="btn btn-sm" style={{
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              padding: "6px 8px",
                              borderRadius: "9px",
                              background: "linear-gradient(145deg, #7d6a54 0%, #6a5947 100%)",
                              color: "#fdf7ee",
                              border: "1px solid rgba(117, 96, 73, 0.9)",
                              boxShadow: "0 8px 14px -10px rgba(79, 60, 39, 0.9)",
                              fontFamily: "var(--font-ui), Segoe UI, Arial, sans-serif",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              textAlign: "center",
                              letterSpacing: "0.01em",
                              lineHeight: 1.05,
                              fontVariantLigatures: "none",
                              fontFeatureSettings: "\"liga\" 0, \"calt\" 0",
                            }} onClick={(e) => {
                              e.stopPropagation();
                              handleCalculate(row);
                            }}>
                              Planifier
                            </button>
                          ) : isColumnEditableForRow && !isStatusColumn ? (
                            <GridCell
                              column={column}
                              value={row[column.key] ?? ""}
                              onChange={(val) => {
                                commitCellValue(row, column, column.key, val, false);
                              }}
                              onBlur={() => undefined}
                              onConfirm={(val) => {
                                return commitCellValue(row, column, column.key, val, true);
                              }}
                              onValidationMessage={showDateValidationPopup}
                              onKeyDown={handleClassicInputKeyDown}
                              minDate={column.type === "date" ? getDateBounds(row, column.key).minDate : undefined}
                              maxDate={column.type === "date" ? getDateBounds(row, column.key).maxDate : undefined}
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
      {uiPopup && (
        <div
          className={`date-validation-popup ${
            uiPopup.kind === "method" ? "method-required-popup" : "date-required-popup"
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="date-validation-popup-title">{uiPopup.title}</div>
          <div className="date-validation-popup-text">{uiPopup.message}</div>
        </div>
      )}
    </div >
  );
}

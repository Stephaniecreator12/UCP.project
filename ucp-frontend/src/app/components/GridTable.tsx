"use client";

import React, { useEffect, useRef } from "react";
import { ColumnConfig, GridRow } from "@/types/grid";
import GridCell from "./GridCell";

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
    methodCell.classList.add("animate-[methodPulse_0.9s_ease_2]");
    const methodInput = methodCell.querySelector<HTMLElement>("select, input, textarea, button");
    if (methodInput) {
      requestAnimationFrame(() => methodInput.focus());
      methodInput.classList.add("animate-[methodFocus_0.65s_ease]");
      window.setTimeout(() => methodInput.classList.remove("animate-[methodFocus_0.65s_ease]"), 1800);
    }
    window.setTimeout(() => {
      methodCell.classList.remove("animate-[methodPulse_0.9s_ease_2]");
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
  const isManualPlannedDateKey = (key: string): boolean => {
    return key === "specifications_date";
  };
  const isOptionalLeadingPlannedDateKey = (key: string): boolean => {
    return key === "specifications_date";
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
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  };

  const getTomorrowLocalIso = (): string => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
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
    return { isActual, baseKey, index: splitDateColumns.findIndex((c) => c.key === baseKey) };
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

    if (!isActual && isManualPlannedDateKey(baseKey)) {
      return null;
    }

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
      if (!hasValue(previousValue) && !isActual && row._isCalculated === true && isOptionalLeadingPlannedDateKey(previousColumn.key)) {
        return null;
      }

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
      if (linearIndex > 0 && hasValue(row[linearDateColumns[linearIndex - 1].key])) {
        minDate = String(row[linearDateColumns[linearIndex - 1].key]);
      }
      return minDate;
    }

    const { isActual, baseKey, index } = dateContext;

    if (!isActual && isDriverDateKey(baseKey)) {
      minDate = getTomorrowLocalIso();
    }

    if (index > 0) {
      const previousValue = row[isActual ? `${splitDateColumns[index - 1].key}_actual` : splitDateColumns[index - 1].key];
      if (hasValue(previousValue)) {
        minDate = minDate ? maxIsoDate(minDate, String(previousValue)) : String(previousValue);
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
      if (linearIndex >= 0 && linearIndex < linearDateColumns.length - 1 && hasValue(row[linearDateColumns[linearIndex + 1].key])) {
        maxDate = String(row[linearDateColumns[linearIndex + 1].key]);
      }
      return maxDate;
    }

    const { isActual, index } = dateContext;
    if (!isActual && isManualPlannedDateKey(dateContext.baseKey)) {
      return undefined;
    }
    if (isActual) {
      maxDate = getTodayLocalIso();
    }

    if (index < splitDateColumns.length - 1) {
      const nextValue = row[isActual ? `${splitDateColumns[index + 1].key}_actual` : splitDateColumns[index + 1].key];
      if (hasValue(nextValue)) {
        maxDate = maxDate ? minIsoDate(maxDate, String(nextValue)) : String(nextValue);
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

  const getColumnWidth = (column: ColumnConfig): string => {
    const safeConfiguredWidth = Number.isNaN(Number.parseInt(column.width || "150px", 10)) ? 150 : Number.parseInt(column.width || "150px", 10);
    const compactConfiguredWidth = column.type === "date" ? safeConfiguredWidth : Math.round(safeConfiguredWidth * 0.9);
    return `${Math.max(compactConfiguredWidth, Math.max(86, column.label.length * 6 + 24), column.type === "date" ? 138 : 0)}px`;
  };

  const getCellValue = (row: GridRow, column: ColumnConfig): string => {
    if (column.calculated && column.calculateValue) return String(column.calculateValue(row));
    const value = row[column.key];
    if (value === null || value === undefined) return "";
    if (column.type === "select" && column.options) {
      const option = column.options.find((opt) => opt.value === value);
      return option ? option.label : String(value);
    }
    if (typeof value === "boolean") return value ? "oui" : "non";
    return String(value);
  };

  const getLatestDriverDates = (row: GridRow) => {
    const latestValues: Partial<GridRow> = {};
    const rowId = String(row._id ?? "");

    if (!rowId || !wrapperRef.current) {
      return latestValues;
    }

    const driverKeys = ["delivery_date", "mission_end_date"] as const;

    driverKeys.forEach((key) => {
      const cell = wrapperRef.current?.querySelector<HTMLTableCellElement>(`tr[data-row-id="${rowId}"] td[data-col-key="${key}"]`);
      const input = cell?.querySelector<HTMLInputElement>('input[type="date"]');
      if (input?.value) {
        latestValues[key] = input.value;
      }
    });

    return latestValues;
  };

  const getStatusToneClass = (value: unknown, row: GridRow): string => {
    const normalized = String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!row.listesetspecifications_reel || String(row.listesetspecifications_reel).trim() === "") {
      if (normalized.includes("en cours")) return "bg-[#eff2f5] text-[#516171]";
    }
    if (normalized.includes("retard")) return "bg-[#fde8e8] text-[#a63131]";
    if (normalized.includes("en cours") || normalized.includes("encours") || normalized.includes("traitement")) return "bg-[#e8f4ff] text-[#1f669d]";
    if (normalized.includes("dans les temps")) return "bg-[#e8f8ef] text-[#0f7b43]";
    if (normalized.includes("termine")) return "bg-[#e3f8ef] text-[#0a6f3b]";
    if (normalized.includes("arrete")) return "bg-[#f4ede2] text-[#6c5332]";
    return "bg-[#eff2f5] text-[#516171]";
  };

  const handleCalculate = async (row: GridRow) => {
    const latestDriverDates = getLatestDriverDates(row);
    const rowForCalculation = { ...row, ...latestDriverDates };
    const driverDate = String(
      rowForCalculation.delivery_date ||
      rowForCalculation.delivery_date_actual ||
      rowForCalculation.mission_end_date ||
      rowForCalculation.mission_end_date_actual ||
      ""
    );
    if (!driverDate) {
      alert("Veuillez d'abord saisir une date de fin (Livraison ou Fin de mission).");
      return;
    }
    if (!isSupportedMethodValue(rowForCalculation.method)) {
      showMethodRequiredPopup();
      if (row._id) scrollToMethodCell(String(row._id));
      return;
    }

    try {
      const { calculatePlanning } = await import("@/services/api");
      const type = (rowForCalculation.type as "Travaux" | "Biens" | "Consultance" | undefined) ?? "Travaux";
      const newDates = await calculatePlanning(type, driverDate, String(rowForCalculation.method).toLowerCase());

      const mappedDates: GridRow = type === "Consultance" ? {
        terms_of_reference: newDates.TdR_prevu,
        ami: newDates.ami_prevu,
        request_for_proposal: newDates.demande_proposition_prevu,
        submissions_opening_date: newDates.date_ouverture_prevu,
        financial_opening_date: newDates.ouverture_plis_prevu,
        contract_date: newDates.date_signature_prevu,
        mission_end_date: newDates.date_fin_prevu,
      } : {
        tender_documents_date: newDates.dossiers_appel_prevu,
        launch_date: newDates.date_lancement_prevu,
        opening_date: newDates.date_ouverture_prevu,
        evaluation_report: newDates.rapport_evaluation_prevu,
        contract_date: newDates.date_signature_prevu,
      };

      if (onRowUpdate && row._id) {
        onRowUpdate({
          ...rowForCalculation,
          ...mappedDates,
          ...(type === "Consultance" ? { pricing_type: String(rowForCalculation.pricing_type ?? "").trim() || "forfait" } : {}),
          _isCalculated: true
        });
      }
      alert("Calcul terminé avec succès !");
    } catch (error: unknown) {
      alert("Erreur: " + (error instanceof Error && error.message === "Failed to fetch" ? "Impossible de contacter le serveur. Vérifiez que le backend est lancé sur l'adresse IP configurée." : error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const isCellEditable = (row: GridRow, column: ColumnConfig, isActual: boolean) => {
    const isConsultanceForfaitAfterCalc = row.type === "Consultance" && row._isCalculated === true && String(row.pricing_type ?? "forfait").toLowerCase() === "forfait";
    if (column.type === "action_button" || column.key === "status" || column.readonly || column.editable === false) return false;
    if (!isActual && (column.key === "delivery_date" || column.key === "mission_end_date")) return true;

    if (!isActual && column.type === "date") {
      if (isManualPlannedDateKey(column.key)) return true;
      if (column.key === "tender_documents_date" && row._isCalculated === true) return true;
      if (isConsultanceForfaitAfterCalc) return true;
      const dateColumns = columns.filter(c => c.type === "date" && c.isSplit);
      const myIndex = dateColumns.findIndex(c => c.key === column.key);
      if (myIndex > 0 && !row[dateColumns[myIndex - 1].key]) {
        if (!(row._isCalculated === true && isOptionalLeadingPlannedDateKey(dateColumns[myIndex - 1].key))) {
          return false;
        }
      }
      return !!row[column.key] || row._isCalculated === true;
    }

    if (isActual && column.type === "date") {
      if (!row[column.key]) return false;
      const dateColumns = columns.filter(c => c.type === "date" && c.isSplit);
      const myIndex = dateColumns.findIndex(c => c.key === column.key);
      if (myIndex > 0 && !row[`${dateColumns[myIndex - 1].key}_actual`]) return false;
      return true;
    }

    return true;
  };

  return (
    <>
      <style>{`
        @keyframes dashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rowAddGlow { from { background-color: #e8f8ef; } to { background-color: transparent; } }
        @keyframes methodPulse { 0% { box-shadow: 0 0 0 0 rgba(11, 128, 70, 0.35); } 100% { box-shadow: 0 0 0 13px rgba(11, 128, 70, 0); } }
        @keyframes methodFocus { 0% { transform: scale(1); } 40% { transform: scale(1.03); } 100% { transform: scale(1); } }
      `}</style>
      
      <div className="relative overflow-auto max-h-[80vh] bg-white" ref={wrapperRef}>
        <table className="w-full border-collapse mb-0">
          <thead>
            <tr>
              <th
                className="text-center sticky top-0 left-0 z-30 bg-[#f3fbf6] text-[#395569] text-[0.65rem] tracking-[0.04em] uppercase py-[9px] px-[10px] border border-[#d9dee3] shadow-[4px_0_8px_-8px_rgba(18,34,48,0.45)]"
                style={{ width: "120px", minWidth: "120px", fontFamily: "var(--font-ui), Segoe UI, Arial, sans-serif" }}
              >
                Action
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="sticky top-0 z-20 bg-[#f3fbf6] text-[#395569] text-[0.65rem] tracking-[0.04em] uppercase py-[9px] px-[10px] border border-[#d9dee3] text-center"
                  style={{ width: getColumnWidth(column), minWidth: getColumnWidth(column) }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-[#627080] py-12 border border-[#d9dee3]">
                  {isLoading ? "Chargement..." : "Aucune donnee disponible."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const normalizedStatus = String(row.status ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const isRowStopped = normalizedStatus === "arrete";
                const isRowClosed = isRowStopped || normalizedStatus === "termine";
                const isNewRow = String(row._id ?? "").startsWith("_new_");

                return (
                <tr
                  key={row._id}
                  data-row-id={String(row._id ?? "")}
                  className={`group ${isRowStopped ? "bg-[#f3f3f3] text-[#727272]" : "hover:bg-[#f8fbf9]"} ${isNewRow ? "animate-[rowAddGlow_0.45s_ease]" : ""}`}
                >
                  <td
                    className={`text-center align-middle sticky left-0 z-15 border border-[#d9dee3] p-2 shadow-[4px_0_8px_-8px_rgba(18,34,48,0.45)] ${isRowStopped ? "bg-[#f3f3f3]" : "bg-white group-hover:bg-[#f8fbf9]"}`}
                    style={{ width: "124px", minWidth: "124px" }}
                  >
                    <div className="flex gap-2 justify-center p-[0.36rem]">
                      <button
                        className="border border-[#d9c28f] bg-[#f7f0df] text-[#7d6434] rounded-[9px] w-[30px] h-[30px] inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => { e.stopPropagation(); if (row._id && onRowStop && !isNewRow && !isRowStopped) onRowStop(row._id); }}
                        disabled={isNewRow || isRowStopped}
                        title="Arrêter"
                        aria-label="Arrêter la ligne"
                      >
                        <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                          <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className="border border-[#7bcda1] bg-[#ecf8f1] text-[#0f8148] rounded-[9px] w-[30px] h-[30px] inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => { e.stopPropagation(); if (!isRowClosed && onRowSave) onRowSave(row); }}
                        disabled={isRowClosed}
                        title="Enregistrer la ligne"
                        aria-label="Enregistrer la ligne"
                      >
                        <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                      <button
                        className="border border-[#ebb2b2] bg-[#fff1f1] text-[#b73939] rounded-[9px] w-[30px] h-[30px] inline-flex items-center justify-center cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); if (row._id && onRowDelete) onRowDelete(row._id); }}
                        title="Supprimer"
                        aria-label="Supprimer la ligne"
                      >
                        <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {columns.map((column) => {
                    const isStatusColumn = column.key === "status";
                    const isColumnEditableForRow = column.isSplit ? (isCellEditable(row, column, false) || isCellEditable(row, column, true)) : isCellEditable(row, column, false);

                    return (
                    <td
                      key={`${row._id}-${column.key}`}
                      data-col-key={column.key}
                      className={`align-middle border border-[#d9dee3] ${isStatusColumn ? "" : isRowStopped ? "" : isColumnEditableForRow ? "bg-white group-hover:bg-[#f8fbf9]" : "bg-[#f7f8f9]"}`}
                      style={{ width: getColumnWidth(column), minWidth: getColumnWidth(column), padding: isStatusColumn ? "0" : "8px 12px", cursor: isColumnEditableForRow && !isStatusColumn ? "pointer" : "not-allowed" }}
                    >
                      {column.isSplit ? (
                        <div className="flex flex-col h-full">
                          {[false, true].map(isActual => {
                            const isPricing = column.splitController === "pricing_type" || column.key === "pricing_type";
                            const controllerKey = column.splitController || column.key;
                            const VAL_TOP = isPricing ? "forfait" : "planned";
                            const VAL_BOTTOM = isPricing ? "time_based" : "actual";
                            const currentValue = row[controllerKey] || VAL_TOP;
                            const isActive = isActual ? currentValue === VAL_BOTTOM : currentValue === VAL_TOP;
                            const isLabelColumn = column.key === "planned_vs_actual" || column.key === "pricing_type";
                            
                            let bgColor = "transparent";
                            let textColor = "#334155";
                            if (isRowStopped) { bgColor = "transparent"; textColor = "inherit"; }
                            else if (column.readonly || column.editable === false) { bgColor = "#f1f5f9"; textColor = "#64748b"; }
                            else if (!isCellEditable(row, column, isActual)) { bgColor = "#f8fafc"; textColor = "#94a3b8"; }
                            else if (!row[controllerKey]) { bgColor = "transparent"; }
                            else if (isActive) { bgColor = "#ffffff"; }
                            else { bgColor = "#f8fafc"; textColor = "#64748b"; }

                            if (isLabelColumn) {
                              const targetValue = isActual ? VAL_BOTTOM : VAL_TOP;
                              const switchBlockedReason = isActual ? getBottomSwitchBlockReason(row, controllerKey, isPricing ? "Temps passé" : "Réel", isPricing ? "Forfait" : "Prévu") : null;
                              
                              const buttonStyle = isRowStopped ? { backgroundColor: "rgba(235, 226, 214, 0.45)", color: "#7b6d5b", border: "1px solid rgba(162, 142, 117, 0.35)", boxShadow: "none", transform: "none" }
                                : isActive ? { background: "linear-gradient(145deg, #7d6a54 0%, #6a5947 100%)", color: "#fdf7ee", border: "1px solid rgba(117, 96, 73, 0.9)", boxShadow: "0 8px 14px -10px rgba(79, 60, 39, 0.9)", transform: "translateY(-1px)" }
                                : { background: "linear-gradient(180deg, rgba(245, 235, 220, 0.95), rgba(234, 220, 200, 0.95))", color: "#6d5e4c", border: "1px solid rgba(170, 150, 124, 0.6)" };

                              return (
                                <div
                                  key={isActual ? "bottom" : "top"}
                                  className={`flex-grow p-2 flex items-center justify-center m-1 ${isActual ? "border-t border-[#d9dee3]" : ""}`}
                                  style={{ ...buttonStyle, minHeight: "35px", borderRadius: "8px", cursor: isRowStopped || switchBlockedReason ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "0.80rem", letterSpacing: "0.025em", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", userSelect: "none", opacity: isRowStopped || switchBlockedReason ? 0.6 : 1 }}
                                  onClick={(e) => { e.stopPropagation(); if (isRowStopped) return; if (switchBlockedReason) return alert(switchBlockedReason); if (onRowChange && row._id) onRowChange(row._id, column.key, targetValue); }}
                                >
                                  {isActual ? (isPricing ? "Temps passé" : "Réel") : (isPricing ? "Forfait" : "Prévu")}
                                </div>
                              );
                            }

                            const effectiveKey = isActual ? `${column.key}_actual` : column.key;
                            return (
                              <div
                                key={isActual ? "bottom" : "top"}
                                className={`flex-grow p-2 ${isActual ? "border-t border-[#d9dee3]" : ""}`}
                                style={{ backgroundColor: bgColor, color: textColor, minHeight: "35px", cursor: (isActive && isCellEditable(row, column, isActual)) ? "text" : "not-allowed", transition: "all 0.2s ease" }}
                              >
                                {isActive && isCellEditable(row, column, isActual) ? (
                                  <GridCell column={column} value={row[effectiveKey] ?? ""} onChange={(val) => commitCellValue(row, column, effectiveKey, val, false)} onConfirm={(val) => commitCellValue(row, column, effectiveKey, val, true)} onValidationMessage={showDateValidationPopup} onBlur={() => undefined} onKeyDown={handleClassicInputKeyDown} minDate={column.type === "date" ? getDateBounds(row, effectiveKey).minDate : undefined} maxDate={column.type === "date" ? getDateBounds(row, effectiveKey).maxDate : undefined} />
                                ) : (
                                  <div className="flex items-center justify-center text-center min-h-[34px] py-[0.42rem] px-[0.2rem] text-[0.82rem] overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                                    {String(row[effectiveKey] ?? "")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className={isStatusColumn ? `flex items-center justify-center rounded-full m-[0.35rem] text-[0.74rem] font-bold border border-[#d9dee3] h-full w-full ${getStatusToneClass(getCellValue(row, column), row)}` : "h-full w-full p-2 flex items-center justify-center"}
                          onClick={() => { if (column.type === "action_button" && column.key === "action_calculation") handleCalculate(row); }}
                        >
                          {column.type === "action_button" ? (
                            <button className="w-full box-border py-[6px] px-2 rounded-[9px] bg-[linear-gradient(145deg,#7d6a54_0%,#6a5947_100%)] text-[#fdf7ee] border border-[rgba(117,96,73,0.9)] shadow-[0_8px_14px_-10px_rgba(79,60,39,0.9)] font-['var(--font-ui),Segoe_UI,Arial,sans-serif'] text-[0.78rem] font-bold whitespace-nowrap text-center tracking-[0.01em] leading-[1.05]" onClick={(e) => { e.stopPropagation(); handleCalculate(row); }}>
                              Planifier
                            </button>
                          ) : isColumnEditableForRow && !isStatusColumn ? (
                            <GridCell column={column} value={row[column.key] ?? ""} onChange={(val) => commitCellValue(row, column, column.key, val, false)} onBlur={() => undefined} onConfirm={(val) => commitCellValue(row, column, column.key, val, true)} onValidationMessage={showDateValidationPopup} onKeyDown={handleClassicInputKeyDown} minDate={column.type === "date" ? getDateBounds(row, column.key).minDate : undefined} maxDate={column.type === "date" ? getDateBounds(row, column.key).maxDate : undefined} />
                          ) : (
                            <div className="flex items-center justify-center text-center min-h-[24px] py-0 px-[0.2rem] text-[0.82rem]">
                              {getCellValue(row, column)}
                            </div>
                          )}
                        </div>
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
        <div className={`fixed z-[95] right-4 bottom-4 w-[min(420px,calc(100vw-2rem))] rounded-xl border py-3 px-[0.85rem] shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] animate-[dashFadeIn_0.2s_ease] ${uiPopup.kind === "method" ? "border-[#b7e2ca] bg-[#eaf9f1] text-[#0b6c3b]" : "border-[#f2cc97] bg-[#fff5e7] text-[#744e1d]"}`} role="alert" aria-live="assertive">
          <div className="font-extrabold text-[0.82rem] mb-1">{uiPopup.title}</div>
          <div className="text-[0.8rem] leading-[1.35]">{uiPopup.message}</div>
        </div>
      )}
    </>
  );
}

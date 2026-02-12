"use client";

import React, { useState } from "react";
import { ColumnConfig, GridRow } from "@/types/grid";
import GridCell from "./GridCell";
import "./GridTable.css";

// Props pour le composant GridTable
interface GridTableProps {
  columns: ColumnConfig[];
  rows: GridRow[];
  onRowChange?: (rowId: string, columnKey: string, value: any) => void;
  onRowSave?: (row: GridRow) => void;
  onRowDelete?: (rowId: string) => void;
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
  const [editValue, setEditValue] = useState<any>("");

  const splitDateColumns = columns.filter((c) => c.type === "date" && c.isSplit);
  const isDriverDateKey = (key: string): boolean => {
    return key === "delivery_date" || key === "mission_end_date";
  };

  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== "";
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
    nextValue: any
  ): string | null => {
    if (!hasValue(nextValue)) return null;

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
  const handleCellChange = (value: any) => {
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
    return column.width || "150px";
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

    try {
      // 2. Appel Backend
      // Import dynamique ou passage en props si besoin, ici on utilise l'import direct
      const { calculatePlanning } = await import("@/services/api");

      const method = row.method?.toLowerCase() || "aoi";
      const newDates = await calculatePlanning(driverDate, method);

      // 3. Mapping des résultats (Backend -> Frontend keys)
      // Le backend renvoie: dossiers_appel_prevu, date_lancement_prevu, etc.
      // Le frontend attend: tender_documents_date, launch_date, etc.

      const mappedDates = {
        tender_documents_date: newDates.dossiers_appel_prevu,
        launch_date: newDates.date_lancement_prevu,
        opening_date: newDates.date_ouverture_prevu,
        evaluation_report: newDates.rapport_evaluation_prevu, // Mapping direct sur la clé de colonne
        // Ah, le backend renvoie 'rapport_evaluation_prevu' comme date. 
        // Le frontend a 'evaluation_report' (status read-only). 
        // On va peut-être devoir adapter. Pour l'instant on map ce qu'on peut.

        contract_date: newDates.date_signature_prevu,
        specifications_date: newDates.listesetspecifications || newDates.dossiers_appel_prevu, // Fallback
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

    } catch (error: any) {
      console.error(error);
      let msg = error.message;
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

      return hasValues || isCalculated || myIndex === 0;
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
              <th className="text-center" style={{ width: "60px" }}>
                Actions
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
                    : "Aucune donnee. Cliquez sur Nouvelle ligne pour ajouter."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id}>
                  <td
                    className="text-center align-middle"
                    style={{ width: "60px" }}
                  >
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => row._id && onRowDelete?.(row._id)}
                      title="Supprimer cette ligne"
                    >
                      🗑️
                    </button>
                  </td>

                  {columns.map((column) => (
                    <td
                      key={`${row._id}-${column.key}`}
                      className={`align-middle grid-cell ${column.editable && !column.readonly
                        ? "editable-cell"
                        : "readonly-cell"
                        }`}
                      style={{
                        width: getColumnWidth(column),
                        minWidth: getColumnWidth(column),
                        padding: "8px 12px",
                        cursor:
                          column.editable && !column.readonly
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

                              // Determine background color based on logic:
                              // 1. Read-only columns are ALWAYS Grey
                              // 2. Active Editable cells are White
                              // 3. Inactive Editable cells are Rose (or Tinted)
                              // 4. Blocked Sequential cells (should look disabled/greyish?)

                              const isColumnReadonly = column.readonly || column.editable === false; // Config Level
                              const hasExplicitState = !!row[controllerKey];

                              let bgColor = "#ffffff";
                              let textColor = "#495057";

                              if (isColumnReadonly) {
                                bgColor = "#e9ecef";
                                textColor = "#6c757d";
                              } else if (!isEditable) {
                                // Blocked by logic (e.g. sequence not met)
                                bgColor = "#f8f9fa"; // Very light grey
                                textColor = "#adb5bd"; // Lighter text
                              } else if (!hasExplicitState) {
                                bgColor = "#ffffff";
                              } else if (isActive) {
                                bgColor = "#ffffff";
                              } else {
                                // Inactive
                                if (isPricing) {
                                  bgColor = isActual ? "#f3e8ff" : "#e8f5e9";
                                } else {
                                  bgColor = "#fff1f2";
                                }
                                textColor = "#6c757d";
                              }

                              const bgStyle = { backgroundColor: bgColor, color: textColor };
                              // Cursor: Pointer only if Active AND Editable
                              const cursorStyle = (isActive && isEditable) ? "pointer" : "not-allowed";

                              // --- CONTROLLER COLUMN RENDERING ---
                              if (isLabelColumn) {
                                // Click to toggle state
                                const targetValue = isActual ? VAL_BOTTOM : VAL_TOP;
                                const buttonStyle = isActive
                                  ? {
                                    backgroundColor: "#0d6efd", // Bootstrap Primary Blue
                                    color: "#ffffff",
                                    boxShadow: "0 2px 4px rgba(13, 110, 253, 0.2)",
                                    transform: "scale(1.02)"
                                  }
                                  : {
                                    backgroundColor: "transparent",
                                    color: "#6c757d",
                                    border: "1px solid #dee2e6"
                                  };

                                return (
                                  <div
                                    className={`flex-grow-1 p-2 d-flex align-items-center justify-content-center m-1`}
                                    style={{
                                      ...buttonStyle,
                                      minHeight: "35px",
                                      borderRadius: "8px", // Modern rounded corners
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      fontSize: "0.85rem",
                                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth animation
                                      userSelect: "none"
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Update the row state!
                                      if (onRowChange && row._id) {
                                        onRowChange(row._id, column.key, targetValue);
                                      }
                                    }}
                                  >
                                    {isActual ? bottomLabel : topLabel}
                                  </div>
                                );
                              }

                              // --- DATA COLUMN RENDERING ---
                              const effectiveKey = isActual ? `${column.key}_actual` : column.key;
                              const cellValue = row[effectiveKey];
                              const isCellEditing = isEditing(row._id, effectiveKey);

                              return (
                                <div
                                  className={`flex-grow-1 p-2 ${isActual ? "border-top" : ""}`}
                                  style={{
                                    ...bgStyle,
                                    minHeight: "35px",
                                    cursor: cursorStyle,
                                    transition: "background-color 0.4s ease, color 0.4s ease" // Animation added
                                  }}
                                  onClick={(e) => {
                                    // Only allow editing if part is ACTIVE and Editable
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
                                      onBlur={handleCellBlur}
                                      onKeyDown={handleKeyDown}
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="cell-value text-truncate">
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
                        // Standard non-split cell behavior
                        <div
                          className="h-100 w-100 p-2 d-flex align-items-center justify-content-center"
                          onClick={() => {
                            if (column.type === "action_button") {
                              // Handle Action Button
                              if (column.key === "action_calculation") { // Check key or add specific handler
                                handleCalculate(row);
                              }
                            } else {
                              handleCellClick(row._id, column);
                            }
                          }}
                        >
                          {column.type === "action_button" ? (
                            <button className="btn btn-sm btn-outline-primary" onClick={(e) => {
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
                                // Immediate save (skipping state wait)
                                if (onRowChange && row._id) {
                                  console.log("Immediate confirm:", row._id, column.key, val);
                                  onRowChange(row._id, column.key, val);
                                }
                                setEditingCell(null);
                                setEditValue("");
                              }}
                              onKeyDown={handleKeyDown}
                              autoFocus
                            />
                          ) : (
                            <div className="cell-value">
                              {getCellValue(row, column)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex gap-2 p-3 bg-light border-top">
        <button
          className="btn btn-primary"
          onClick={onAddRow}
          disabled={isLoading}
        >
          + Nouvelle ligne
        </button>
      </div>
    </div >
  );
}

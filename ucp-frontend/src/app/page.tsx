"use client";

import React, { useState, useEffect, useCallback } from "react";
import SidebarMenu from "@/app/components/SidebarMenu";
import GridTable from "@/app/components/GridTable";
import { MenuItemType, GridRow } from "@/types/grid";
import { TABLE_CONFIGS } from "@/config/tableConfigs";
import {
  createProcurement,
  deleteProcurement,
  getAllProcurements,
  getProcurementStatus,
  Procurement,
  stopProcurement,
} from "@/services/api";

export default function GestionMarches() {
  const [activeMenu, setActiveMenu] = useState<MenuItemType>("works");
  const [rows, setRows] = useState<GridRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const config = TABLE_CONFIGS[activeMenu];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allData = await getAllProcurements();
      const filteredData = allData.filter((item) => {
        if (activeMenu === "works") return item.type === "Travaux";
        if (activeMenu === "goods-services") return item.type === "Biens";
        if (activeMenu === "consultants") return item.type === "Consultance";
        return true;
      });
      setRows(
        filteredData.map((item: Procurement) => ({
          ...item,
          _id: String(item.id),
        })),
      );
    } catch {
      setSaveMessage({ type: "error", message: "Erreur de chargement" });
    } finally {
      setIsLoading(false);
    }
  }, [activeMenu]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRow = () => {
    const newId = `_new_${Date.now()}`;
    const typeMapping: Record<MenuItemType, "Travaux" | "Biens" | "Consultance"> = {
      works: "Travaux",
      "goods-services": "Biens",
      consultants: "Consultance",
    };
    const newRow: GridRow = {
      _id: newId,
      review_status: "post",
      type: typeMapping[activeMenu],
    };
    config.columns.forEach((col) => {
      newRow[col.key] = "";
    });
    setRows((prev) => [...prev, newRow]);
  };

  const handleRowChange = (
    rowId: string,
    columnKey: string,
    value: unknown,
  ) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row._id === rowId ? { ...row, [columnKey]: value } : row,
      ),
    );
  };

  const isRowComplete = (row: GridRow): boolean => {
    const requiredColumns = config.columns.filter(
      (col) => col.editable !== false && !col.readonly && col.type !== "action_button",
    );

    return requiredColumns.every((col) => {
      const value = row[col.key];
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
  };

  const handleRowDelete = async (rowId: string) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      if (!rowId.startsWith("_new_")) {
        const password = window.prompt("Confirme avec ton mot de passe:");
        if (!password) {
          setSaveMessage({ type: "error", message: "Suppression annulée (mot de passe requis)." });
          return;
        }
        const rowToDelete = rows.find((r) => r._id === rowId);
        const menuTypeMapping: Record<
          MenuItemType,
          "Travaux" | "Biens" | "Consultance"
        > = {
          works: "Travaux",
          "goods-services": "Biens",
          consultants: "Consultance",
        };
        const type =
          (rowToDelete?.type as
            | "Travaux"
            | "Biens"
            | "Consultance"
            | undefined) ?? menuTypeMapping[activeMenu];

        await deleteProcurement(Number(rowId), type, password);
      }
      setRows((prev) => prev.filter((r) => r._id !== rowId));
      setSaveMessage({ type: "success", message: "Supprimé" });
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Erreur suppression";
      setSaveMessage({ type: "error", message: errorMessage });
    }
  };

  const handleRowStop = async (rowId: string) => {
    if (!window.confirm("Arrêter cette ligne ?")) return;

    try {
      if (rowId.startsWith("_new_")) {
        setSaveMessage({
          type: "error",
          message: "Enregistre d'abord la ligne.",
        });
        return;
      }

      const password = window.prompt("Confirme avec ton mot de passe:");
      if (!password) {
        setSaveMessage({ type: "error", message: "Arrêt annulé (mot de passe requis)." });
        return;
      }

      const rowToStop = rows.find((r) => r._id === rowId);
      if (!rowToStop) {
        setSaveMessage({ type: "error", message: "Ligne introuvable." });
        return;
      }

      const currentStatus = String(rowToStop.status ?? "").trim();
      if (!currentStatus) {
        setSaveMessage({
          type: "error",
          message: "Statut vide: impossible d'arrêter.",
        });
        return;
      }
      if (currentStatus !== "En cours") {
        setSaveMessage({
          type: "error",
          message: `Impossible d'arrêter: statut actuel "${currentStatus}".`,
        });
        return;
      }

      const menuTypeMapping: Record<
        MenuItemType,
        "Travaux" | "Biens" | "Consultance"
      > = {
        works: "Travaux",
        "goods-services": "Biens",
        consultants: "Consultance",
      };

      const type =
        (rowToStop.type as "Travaux" | "Biens" | "Consultance" | undefined) ??
        menuTypeMapping[activeMenu];

      const result = await stopProcurement(Number(rowId), type, password);

      setRows((prev) =>
        prev.map((r) =>
          r._id === rowId ? { ...r, status: result.statut || "Arrêté" } : r,
        ),
      );

      setSaveMessage({ type: "success", message: "Ligne arrêtée." });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erreur arrêt";
      setSaveMessage({ type: "error", message: errorMessage });
    }
  };

  // --- SAUVEGARDE LIGNE PAR LIGNE ---
  const handleRowSave = async (row: GridRow) => {
    setIsSaving(true);
    try {
      if (!isRowComplete(row)) {
        setSaveMessage({
          type: "error",
          message: "Complète toute la ligne avant d'enregistrer.",
        });
        return;
      }

      const typeMapping: Record<string, "Travaux" | "Biens" | "Consultance"> = {
        works: "Travaux",
        "goods-services": "Biens",
        consultants: "Consultance",
      };

      const procurementData: Procurement = {
        ...row,
        type: typeMapping[activeMenu],
        title: row.title || "Sans titre",
        review_notes: row.review_status,
        date_invitation: row.specifications_date || row.launch_date,
        date_opening_submissions: row.opening_date,
        date_contract_signed: row.contract_date,
        date_mission_end: row.delivery_date || row.mission_end_date,
      };

      // Si c'est une nouvelle ligne (commence par _new_) -> CREATE
      // Si c'est une ligne existante -> UPDATE (si supporté, sinon create ?)
      // Pour l'instant on suppose CREATE pour tout ce qui est new, et peut-être rien pour l'ancien si pas supporté

      const result = await createProcurement(procurementData);

      if (result) {
        const savedRow: GridRow = {
          ...row,
          ...result,
          _id: String(result.id),
        };

        let computedStatus = "";
        try {
          computedStatus = await getProcurementStatus(
            typeMapping[activeMenu],
            savedRow,
          );
        } catch {
          computedStatus = savedRow.status
            ? String(savedRow.status)
            : "Statut indisponible";
        }

        setRows((currentRows) =>
          currentRows.map((r) =>
            r._id === row._id ? { ...savedRow, status: computedStatus } : r,
          ),
        );
        setSaveMessage({ type: "success", message: "Ligne enregistrée !" });
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
      setSaveMessage({ type: "error", message: `Erreur: ${errorMessage}` });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleRowUpdate = (updatedRow: GridRow) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row._id === updatedRow._id ? updatedRow : row)),
    );
  };

  return (
    <div className="dashboard">
      <SidebarMenu activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-accent" aria-hidden="true" />
          <div className="dashboard-title-wrap">
            <p className="dashboard-kicker">UCP · Passation de marches</p>
            <h1 className="dashboard-title">{config.label}</h1>
            <p className="dashboard-subtitle">
              Unite de coordination de projet · {rows.length} ligne
              {rows.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="dashboard-header-stats">
            <div className="header-stat-card">
              <span className="header-stat-label">Lignes</span>
              <strong className="header-stat-value">{rows.length}</strong>
            </div>
            <div className="header-stat-card">
              <span className="header-stat-label">Systeme</span>
              <strong className="header-stat-value">
                {isLoading || isSaving ? "Sync..." : "En ligne"}
              </strong>
            </div>
          </div>
        </header>

        {saveMessage && (
          <div className={`save-message save-message-${saveMessage.type}`}>
            {saveMessage.message}
          </div>
        )}

        <div className="dashboard-table-container">
          <GridTable
            columns={config.columns}
            rows={rows}
            onRowChange={handleRowChange}
            onRowSave={handleRowSave}
            onRowUpdate={handleRowUpdate}
            onRowDelete={handleRowDelete}
            onRowStop={handleRowStop}
            onAddRow={handleAddRow}
            isLoading={isLoading || isSaving}
          />
        </div>
      </main>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useCallback } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import GridTable from "@/components/GridTable";
import { MenuItemType, GridRow } from "@/types/grid";
import { TABLE_CONFIGS } from "@/config/tableConfigs";
import {
  createProcurement,
  deleteProcurement,
  getAllProcurements,
  Procurement,
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
      const filteredData = allData.filter(item => {
        if (activeMenu === 'works') return item.type === 'Travaux';
        if (activeMenu === 'goods-services') return item.type === 'Biens';
        if (activeMenu === 'consultants') return item.type === 'Consultance';
        return true;
      });
      setRows(filteredData.map((item: Procurement) => ({ ...item, _id: String(item.id) })));
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
    const newRow: GridRow = { _id: newId, review_status: "post" };
    config.columns.forEach((col) => { newRow[col.key] = ""; });
    setRows((prev) => [...prev, newRow]);
  };

  const handleRowChange = (rowId: string, columnKey: string, value: unknown) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row._id === rowId ? { ...row, [columnKey]: value } : row))
    );
  };

  const handleRowDelete = async (rowId: string) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      if (!rowId.startsWith("_new_")) {
        const typeMapping: Record<string, 'Travaux' | 'Biens' | 'Consultance'> = {
          "works": "Travaux",
          "goods-services": "Biens",
          "consultants": "Consultance"
        };
        const numericId = Number(rowId);
        if (!Number.isFinite(numericId)) throw new Error("ID invalide");
        const ok = await deleteProcurement(numericId, typeMapping[activeMenu]);
        if (!ok) throw new Error("Suppression impossible");
      }
      setRows(prev => prev.filter(r => r._id !== rowId));
      setSaveMessage({ type: "success", message: "Supprimé" });
    } catch {
      setSaveMessage({ type: "error", message: "Erreur suppression" });
    }
  };

  // --- SAUVEGARDE LIGNE PAR LIGNE ---
  const handleRowSave = async (row: GridRow) => {
    setIsSaving(true);
    try {
      const typeMapping: Record<string, 'Travaux' | 'Biens' | 'Consultance'> = {
        "works": "Travaux",
        "goods-services": "Biens",
        "consultants": "Consultance"
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
        setRows(currentRows => currentRows.map(r => r._id === row._id ? { ...r, ...result, _id: String(result.id) } : r));
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
      prevRows.map((row) => (row._id === updatedRow._id ? updatedRow : row))
    );
  };

  return (
    <div className="dashboard">
      <SidebarMenu activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1 className="dashboard-title">{config.label}</h1>
          <p className="dashboard-subtitle">{rows.length} ligne{rows.length > 1 ? "s" : ""}</p>
        </header>

        {saveMessage && (
          <div className={`save-message save-message-${saveMessage.type}`}>{saveMessage.message}</div>
        )}

        <div className="dashboard-table-container">
          <GridTable
            columns={config.columns}
            rows={rows}
            onRowChange={handleRowChange}
            onRowSave={handleRowSave}
            onRowUpdate={handleRowUpdate}
            onRowDelete={handleRowDelete}
            onAddRow={handleAddRow}
            isLoading={isLoading || isSaving}
          />
        </div>

      </main>
    </div>
  );
}

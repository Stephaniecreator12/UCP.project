"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "@/services/api";

export default function GestionMarches() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuItemType>("works");
  const [rows, setRows] = useState<GridRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const config = TABLE_CONFIGS[activeMenu];

  // 1. PROTECTION : Redirection vers login si pas de token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.log("Pas de token, direction login");
      router.push("/login");
    }
  }, [router]);

  // 2. CHARGEMENT DES DONNÉES
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
    } catch (error) {
      setSaveMessage({ type: "error", message: "Erreur de chargement" });
    } finally {
      setIsLoading(false);
    }
  }, [activeMenu]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. GESTION DES LIGNES
  const handleAddRow = () => {
    const newId = `_new_${Date.now()}`;
    const newRow: GridRow = { _id: newId, review_status: "post" };
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

  // 4. SUPPRESSION SÉCURISÉE (SOFT DELETE)
  const handleRowDelete = async (rowId: string) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    
    try {
      if (!rowId.startsWith("_new_")) {
        const rowToDelete = rows.find((r) => r._id === rowId);
        const menuTypeMapping: Record<MenuItemType, "Travaux" | "Biens" | "Consultance"> = {
          works: "Travaux",
          "goods-services": "Biens",
          consultants: "Consultance",
        };
        
        const type = (rowToDelete?.type as "Travaux" | "Biens" | "Consultance" | undefined) 
                     ?? menuTypeMapping[activeMenu];

        // Demander le mot de passe pour le backend
        const password = window.prompt("Veuillez saisir votre mot de passe pour confirmer la suppression :");
        
        if (!password) {
          setSaveMessage({ type: "error", message: "Mot de passe requis pour la suppression" });
          return;
        }

        await deleteProcurement(Number(rowId), type, password);
      }
      
      setRows((prev) => prev.filter((r) => r._id !== rowId));
      setSaveMessage({ type: "success", message: "Supprimé avec succès" });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erreur suppression";
      setSaveMessage({ type: "error", message: errorMessage });
    }
  };

  // 5. SAUVEGARDE
  const handleRowSave = async (row: GridRow) => {
    setIsSaving(true);
    try {
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

      const result = await createProcurement(procurementData);

      if (result) {
        const savedRow: GridRow = {
          ...row,
          ...result,
          _id: String(result.id),
        };

        let computedStatus = "";
        try {
          computedStatus = await getProcurementStatus(typeMapping[activeMenu], savedRow);
        } catch {
          computedStatus = savedRow.status ? String(savedRow.status) : "Statut indisponible";
        }

        setRows((currentRows) =>
          currentRows.map((r) =>
            r._id === row._id ? { ...savedRow, status: computedStatus } : r,
          ),
        );
        setSaveMessage({ type: "success", message: "Ligne enregistrée !" });
      }
    } catch (e: unknown) {
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
          <h1 className="dashboard-title">{config.label}</h1>
          <p className="dashboard-subtitle">
            {rows.length} ligne{rows.length > 1 ? "s" : ""}
          </p>
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
            onAddRow={handleAddRow}
            isLoading={isLoading || isSaving}
          />
        </div>
      </main>
    </div>
  );
}
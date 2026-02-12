"use client";

import React, { useState, useEffect } from "react";
import SidebarMenu from "@/components/SidebarMenu";
import GridTable from "@/components/GridTable";
import { MenuItemType, GridRow } from "@/types/grid";
import { TABLE_CONFIGS } from "@/config/tableConfigs";
import {
  createProcurement,
  updateProcurement,
  deleteProcurement,
  getAllProcurements,
  Procurement,
} from "@/services/api";
import "./dashboard.css";

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuItemType>("works");
  const [rows, setRows] = useState<GridRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const config = TABLE_CONFIGS[activeMenu];
  // Utilisation de ton URL d'environnement
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadData();
  }, [activeMenu]);

  const loadData = async () => {
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
    } catch (error) {
      setSaveMessage({ type: "error", message: "Erreur de chargement" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    const newId = `_new_${Date.now()}`;
    const newRow: GridRow = { _id: newId, review_status: "post" };
    config.columns.forEach((col) => { newRow[col.key] = ""; });
    setRows((prev) => [...prev, newRow]);
  };

  const handleRowChange = (rowId: string, columnKey: string, value: any) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row._id === rowId ? { ...row, [columnKey]: value } : row))
    );
  };

  // --- LA MÉTHODE POST AUTOMATISÉE ICI ---
  const handleRowSave = async (row: GridRow) => {
    setIsSaving(true);
    try {
      const isNewRow = String(row._id).startsWith("_new_");

      if (isNewRow) {
        const typeMapping: Record<string, 'Travaux' | 'Biens' | 'Consultance'> = {
          "works": "Travaux",
          "goods-services": "Biens",
          "consultants": "Consultance"
        };

        // Mapping GridRow -> Procurement
        // Note: On adapte les clés du tableau aux clés attendues par api.ts / Django
        const procurementData: Procurement = {
          ...row,
          type: typeMapping[activeMenu],
          title: row.title || "Sans titre",
          review_notes: row.review_status, // Mapping review_status -> review_notes

          // Mapping des dates
          // Pour Travaux/Biens
          date_invitation: row.specifications_date || row.launch_date,
          date_opening_submissions: row.opening_date,
          date_contract_signed: row.contract_date,
          date_mission_end: row.delivery_date || row.mission_end_date,

          // Pour Consultants (champs spécifiques à mapper si besoin)
          // ... 
        };

        const result = await createProcurement(procurementData);

        if (!result) throw new Error("Erreur lors de la création");

        // Mise à jour de la ligne avec l'ID réel du backend
        setRows(prev => prev.map(r => r._id === row._id ? { ...r, ...result, _id: String(result.id) } : r));
        setSaveMessage({ type: "success", message: "Créé avec succès !" });
      } else {
        // Update logic (non implémentée pour l'instant)
        console.warn("Update non implémenté");
      }

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setSaveMessage({ type: "error", message: "Erreur de sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowDelete = async (rowId: string) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      if (!rowId.startsWith("_new_")) {
        const response = await fetch(`${API_URL}/procurements/${rowId}/`, { method: "DELETE" });
        if (!response.ok) throw new Error();
      }
      setRows(prev => prev.filter(r => r._id !== rowId));
      setSaveMessage({ type: "success", message: "Supprimé" });
    } catch (error) {
      setSaveMessage({ type: "error", message: "Erreur suppression" });
    }
  };

  // --- SAUVEGARDE GLOBALE MANUELLE ---
  const handleGlobalSave = async () => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // On cherche les nouvelles lignes (celles qui ont un ID temporaire _new_)
      const newRows = rows.filter(r => String(r._id).startsWith("_new_"));

      if (newRows.length === 0) {
        setSaveMessage({ type: "success", message: "Aucune nouvelle ligne à sauvegarder" });
        setIsSaving(false);
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      // On sauvegarde chaque nouvelle ligne une par une
      for (const row of newRows) {
        try {
          // 1. On prépare les données (Mapping)
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

            // Mapping des dates
            date_invitation: row.specifications_date || row.launch_date,
            date_opening_submissions: row.opening_date,
            date_contract_signed: row.contract_date,
            date_mission_end: row.delivery_date || row.mission_end_date,
          };

          // 2. Appel API
          await createProcurement(procurementData);

          // Si pas d'erreur, succès
          // Mise à jour de l'ID local avec le vrai ID du backend (Note: createProcurement retourne l'objet maintenant ?)
          // Ah wait, api.ts returns the object. 
          // Let's adjust usage to match new api.ts behavior which returns object or throws.
          // Warning: My previous edit to api.ts makes it throw, so no null check needed.

          // Re-reading my api.ts edit: It returns { ...data, id: createdItem.id }

          const result = await createProcurement(procurementData);
          setRows(currentRows => currentRows.map(r => r._id === row._id ? { ...r, ...result, _id: String(result.id) } : r));
          successCount++;

        } catch (e: any) {
          console.error(e);
          errorCount++;
          // On garde le dernier message d'erreur
          setSaveMessage({ type: "error", message: `Erreur: ${e.message}` });
        }
      }

      // Résultat final
      if (errorCount === 0) {
        setSaveMessage({ type: "success", message: `${successCount} ligne(s) enregistrée(s) avec succès !` });
      } else {
        // Le message d'erreur spécifique est déjà set dans le catch, on le laisse ou on le complète ?
        // On va garder le dernier message d'erreur s'il y en a un
      }

    } catch (error) {
      setSaveMessage({ type: "error", message: "Erreur globale de sauvegarde" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
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
            onRowSave={handleRowSave} // Gardé pour compatibilité
            onRowUpdate={handleRowUpdate} // Nouvelle prop pour mise à jour locale (Calcul)
            onRowDelete={handleRowDelete}
            onAddRow={handleAddRow}
            isLoading={isLoading || isSaving}
          />
        </div>

        <div style={{ marginTop: "30px", textAlign: "center", paddingBottom: "50px" }}>
          <button
            onClick={handleGlobalSave} // <--- Appel de la vraie fonction de sauvegarde
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? "#6c757d" : "#083111ff",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: isSaving ? "wait" : "pointer",
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? "ENREGISTREMENT..." : "ENREGISTRER LES DONNÉES"}
          </button>
        </div>
      </main>
    </div>
  );
}
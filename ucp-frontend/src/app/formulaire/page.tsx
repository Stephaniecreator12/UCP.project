"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import SidebarMenu from "@/app/components/SidebarMenu";
import GridTable from "@/app/components/GridTable";
import TopHeader from "@/app/components/TopHeader";
import { getToken } from "@/services/auth";
import { MenuItemType, GridRow } from "@/types/grid";
import { TABLE_CONFIGS } from "@/config/tableConfigs";
import {
  createProcurement,
  deleteProcurement,
  getAllProcurements,
  getProcurementStatus,
  Procurement,
  stopProcurement,
  updateProcurement,
} from "@/services/api";

export default function GestionMarches() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuItemType>("works");
  const [rows, setRows] = useState<GridRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error" | "danger" | "warning";
    message: string;
  } | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalTitle, setPasswordModalTitle] = useState("");
  const [passwordModalMessage, setPasswordModalMessage] = useState("");
  const [passwordModalConfirmLabel, setPasswordModalConfirmLabel] = useState("Confirmer");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordResolverRef = useRef<((value: string | null) => void) | null>(null);
  const saveMessageTimeoutRef = useRef<number | null>(null);

  const config = TABLE_CONFIGS[activeMenu];
  const hasUnsavedRow = rows.some((row) => String(row._id ?? "").startsWith("_new_"));

  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;

    // Keep digits/sign/decimal separators, then normalize comma to dot.
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalEstimatedAmount = rows.reduce((sum, row) => {
    const raw =
      row.estimated_amount ??
      row.montant_estimatif ??
      row.estimatedAmount ??
      0;
    return sum + parseAmount(raw);
  }, 0);

  const totalEstimatedAmountDisplay = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalEstimatedAmount);

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
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (passwordResolverRef.current) {
        passwordResolverRef.current(null);
        passwordResolverRef.current = null;
      }
      if (saveMessageTimeoutRef.current) {
        window.clearTimeout(saveMessageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    if (saveMessageTimeoutRef.current) {
      window.clearTimeout(saveMessageTimeoutRef.current);
    }
    saveMessageTimeoutRef.current = window.setTimeout(() => {
      setSaveMessage(null);
      saveMessageTimeoutRef.current = null;
    }, 1800);
  }, [saveMessage]);

  const requestPasswordConfirmation = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
  }): Promise<string | null> => {
    setPasswordModalTitle(options.title);
    setPasswordModalMessage(options.message);
    setPasswordModalConfirmLabel(options.confirmLabel || "Confirmer");
    setPasswordInput("");
    setShowPassword(false);
    setIsPasswordModalOpen(true);

    return new Promise((resolve) => {
      passwordResolverRef.current = resolve;
    });
  };

  const closePasswordModal = (value: string | null) => {
    if (passwordResolverRef.current) {
      passwordResolverRef.current(value);
      passwordResolverRef.current = null;
    }
    setIsPasswordModalOpen(false);
    setPasswordInput("");
    setShowPassword(false);
  };

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

  const handleRowDelete = async (rowId: string) => {
    try {
      if (!rowId.startsWith("_new_")) {
        const password = await requestPasswordConfirmation({
          title: "Supprimer la ligne",
          message: "Confirme l'action avec ton mot de passe.",
          confirmLabel: "Supprimer",
        });
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
      setSaveMessage({ type: "danger", message: "Ligne supprimée." });
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Erreur suppression";
      setSaveMessage({ type: "error", message: errorMessage });
    }
  };

  const handleRowStop = async (rowId: string) => {
    try {
      if (rowId.startsWith("_new_")) {
        setSaveMessage({
          type: "error",
          message: "Enregistre d'abord la ligne.",
        });
        return;
      }

      const password = await requestPasswordConfirmation({
        title: "Arrêter la ligne",
        message: "Confirme l'arrêt avec ton mot de passe.",
        confirmLabel: "Arrêter",
      });
      if (!password) {
        setSaveMessage({ type: "error", message: "Arrêt annulé (mot de passe requis)." });
        return;
      }

      const rowToStop = rows.find((r) => r._id === rowId);
      if (!rowToStop) {
        setSaveMessage({ type: "error", message: "Ligne introuvable." });
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

      setSaveMessage({ type: "warning", message: "Ligne arrêtée." });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erreur arrêt";
      setSaveMessage({ type: "error", message: errorMessage });
    }
  };

  // --- SAUVEGARDE LIGNE PAR LIGNE ---
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
        title: String(row.title ?? "Sans titre"),
        review_notes:
          typeof row.review_status === "string" ? row.review_status : undefined,
        specifications_date:
          typeof row.specifications_date === "string"
            ? row.specifications_date
            : undefined,
        date_invitation:
          activeMenu === "consultants"
            ? typeof row.invitation_date === "string"
              ? row.invitation_date
              : undefined
            : typeof row.launch_date === "string"
              ? row.launch_date
              : undefined,
        date_opening_submissions:
          typeof row.opening_date === "string" ? row.opening_date : undefined,
        date_contract_signed:
          typeof row.contract_date === "string" ? row.contract_date : undefined,
        date_mission_end:
          typeof (row.delivery_date || row.mission_end_date) === "string"
            ? String(row.delivery_date || row.mission_end_date)
            : undefined,
      };

      const rowId = String(row._id ?? "");
      const isNewRow = rowId.startsWith("_new_");
      const numericId = Number.parseInt(rowId, 10);
      const canUpdate = !isNewRow && Number.isFinite(numericId);

      const result = canUpdate
        ? await updateProcurement(numericId, procurementData)
        : await createProcurement(procurementData);

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
        setSaveMessage({
          type: "success",
          message: canUpdate
            ? "Ligne modifiée avec succès."
            : "Ligne enregistrée avec succès.",
        });
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
      setSaveMessage({ type: "error", message: `Erreur: ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowUpdate = (updatedRow: GridRow) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row._id === updatedRow._id ? updatedRow : row)),
    );
  };

  const tableContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr) auto",
    minHeight: 0,
    minWidth: 0,
    marginBottom: 0,
    overflow: "hidden",
  };

  const tableInnerStyle: React.CSSProperties = {
    minHeight: 0,
    minWidth: 0,
    maxHeight: "56vh",
    overflow: "hidden",
  };

  const addRowAreaStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 90,
    minHeight: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "10px 14px",
    borderTop: "1px solid rgba(171, 187, 177, 0.7)",
    background:
      "linear-gradient(180deg, rgba(246, 250, 248, 0.98), rgba(236, 243, 239, 0.98))",
  };

  return (
    <div className="app-shell">
      <TopHeader />
      <div className="dashboard">
        <SidebarMenu activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
        <main className="dashboard-content form-dashboard-content">
          <header className="dashboard-header">
            <div className="dashboard-header-accent" aria-hidden="true" />
            <div className="dashboard-title-wrap">
              <p className="dashboard-kicker">UCP · Passation de marches</p>
              <h1 className="dashboard-title">{config.label}</h1>
              <p className="dashboard-subtitle">
                Unite de coordination de projet
              </p>
            </div>
            <div className="dashboard-header-stats">
              <div className="header-stat-card">
                <span className="header-stat-label">Marchés</span>
                <strong className="header-stat-value">{rows.length}</strong>
              </div>
              <div className="header-stat-card">
                <span className="header-stat-label">Montant total estimatif (Ar)</span>
                <strong className="header-stat-value">{totalEstimatedAmountDisplay}</strong>
              </div>
            </div>
          </header>

          {saveMessage && (
            <div className={`save-message save-message-${saveMessage.type}`}>
              {saveMessage.message}
            </div>
          )}

          <div
            className="dashboard-table-container form-dashboard-table-container"
            style={tableContainerStyle}
          >
            <div style={tableInnerStyle}>
              <GridTable
                columns={config.columns}
                rows={rows}
                onRowChange={handleRowChange}
                onRowSave={handleRowSave}
                onRowUpdate={handleRowUpdate}
                onRowDelete={handleRowDelete}
                onRowStop={handleRowStop}
                isLoading={isLoading || isSaving}
              />
            </div>
            <div className="table-add-row-area form-table-add-row-area" style={addRowAreaStyle}>
              <button
                type="button"
                className="global-add-row-fab form-global-add-row-fab"
                onClick={handleAddRow}
                disabled={isLoading || isSaving || hasUnsavedRow}
              >
                <span className="add-row-btn-icon" aria-hidden="true">+</span>
                <span>Ajouter une ligne</span>
              </button>
            </div>
          </div>

          <div className="form-dark-floating-add-row" aria-hidden="false">
            <button
              type="button"
              className="global-add-row-fab form-global-add-row-fab"
              onClick={handleAddRow}
              disabled={isLoading || isSaving || hasUnsavedRow}
            >
              <span className="add-row-btn-icon" aria-hidden="true">+</span>
              <span>Ajouter une ligne</span>
            </button>
          </div>

          {isPasswordModalOpen && (
            <div className="password-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
              <div className="password-modal-card">
                <h2 id="password-modal-title" className="password-modal-title">
                  {passwordModalTitle}
                </h2>
                <p className="password-modal-message">{passwordModalMessage}</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = passwordInput.trim();
                    if (!trimmed) return;
                    closePasswordModal(trimmed);
                  }}
                >
                  <div className="password-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="password-modal-input"
                      placeholder="Mot de passe"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      title={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M10.6 10.6a2 2 0 102.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M9.3 5.1A11 11 0 0112 4c5.5 0 9.5 4 10 8a10.6 10.6 0 01-3.1 5.3M6.2 7.2A11.4 11.4 0 002 12c.2 1.9 1.4 3.8 3.2 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8s-9.5-4-10-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="password-modal-actions">
                    <button
                      type="button"
                      className="password-modal-btn password-modal-btn-secondary"
                      onClick={() => closePasswordModal(null)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="password-modal-btn password-modal-btn-primary"
                      disabled={!passwordInput.trim()}
                    >
                      {passwordModalConfirmLabel}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

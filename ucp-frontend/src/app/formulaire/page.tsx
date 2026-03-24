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
  const columnsForGrid = config.columns.map((c) =>
  c.key === "method"
    ? {
        ...c,
        label: activeMenu === "goods-services" ? "Méthode E.P.M" : "Méthode P.M",
      }
    : c,
);

  const hasUnsavedRow = rows.some((row) => String(row._id ?? "").startsWith("_new_"));

  // ... [Garde tes fonctions existantes intactes : parseAmount, loadData, handleRowChange, etc. Ne modifie que le JSX en bas] ...
  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalEstimatedAmount = rows.reduce((sum, row) => {
    const raw = row.estimated_amount ?? row.montant_estimatif ?? row.estimatedAmount ?? 0;
    return sum + parseAmount(raw);
  }, 0);

  const totalEstimatedAmountDisplay = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalEstimatedAmount);

const loadData = useCallback(async (): Promise<GridRow[]> => {
  setIsLoading(true);
  try {
    const allData = await getAllProcurements();
    const filteredData = allData.filter((item) => {
      if (activeMenu === "works") return item.type === "Travaux";
      if (activeMenu === "goods-services") return item.type === "Biens";
      if (activeMenu === "consultants") return item.type === "Consultance";
      return true;
    });

    const normalizeDateForInput = (value: unknown): string => {
      if (typeof value !== "string") return "";
      const s = value.trim();
      if (!s) return "";

      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})T/);
      if (isoMatch) return isoMatch[1];

      const dmyMatch = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
      if (dmyMatch) {
        const [, dd, mm, yyyy] = dmyMatch;
        return `${yyyy}-${mm}-${dd}`;
      }

      return s;
    };

    const dateKeysFromConfig = config.columns
      .filter((col) => col.type === "date")
      .flatMap((col) => (col.isSplit ? [col.key, `${col.key}_actual`] : [col.key]));

    const formattedRows: GridRow[] = filteredData.map((item: Procurement) => {
      const row: GridRow = { ...(item as unknown as GridRow), _id: String(item.id) };

      dateKeysFromConfig.forEach((key) => {
        row[key] = normalizeDateForInput(row[key]);
      });

      return row;
    });
    
    const rowsWithSwitch = formattedRows.map((row) => {
  const saved = localStorage.getItem(`pvact:${row._id}`);
  return {
    ...row,
    planned_vs_actual: saved === "actual" ? "actual" : "planned",
  };
});

  setRows(rowsWithSwitch);
  return rowsWithSwitch;

  } catch {
    setSaveMessage({ type: "error", message: "Erreur de chargement" });
    return [];
  } finally {
    setIsLoading(false);
  }
}, [activeMenu, config.columns]);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (getToken()) loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (passwordResolverRef.current) passwordResolverRef.current(null);
      if (saveMessageTimeoutRef.current) window.clearTimeout(saveMessageTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!saveMessage) return;
    if (saveMessageTimeoutRef.current) window.clearTimeout(saveMessageTimeoutRef.current);
    saveMessageTimeoutRef.current = window.setTimeout(() => setSaveMessage(null), 1800);
  }, [saveMessage]);

  const requestPasswordConfirmation = (options: { title: string; message: string; confirmLabel?: string; }): Promise<string | null> => {
    setPasswordModalTitle(options.title);
    setPasswordModalMessage(options.message);
    setPasswordModalConfirmLabel(options.confirmLabel || "Confirmer");
    setPasswordInput("");
    setShowPassword(false);
    setIsPasswordModalOpen(true);
    return new Promise((resolve) => { passwordResolverRef.current = resolve; });
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
    const typeMapping: Record<MenuItemType, "Travaux" | "Biens" | "Consultance"> = { works: "Travaux", "goods-services": "Biens", consultants: "Consultance" };
    const newRow: GridRow = { _id: newId, review_status: "post", type: typeMapping[activeMenu] };
    config.columns.forEach((col) => { newRow[col.key] = ""; });
    setRows((prev) => [...prev, newRow]);
  };

  const handleRowChange = (rowId: string, columnKey: string, value: unknown) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row._id === rowId ? { ...row, [columnKey]: value } : row)),
    );
  };

  const handleRowDelete = async (rowId: string) => {
    try {
      if (!rowId.startsWith("_new_")) {
        const numericId = Number(rowId);
        if (!Number.isFinite(numericId) || numericId <= 0) {
          setSaveMessage({ type: "error", message: "Id de ligne invalide." });
          return;
        }
        const password = await requestPasswordConfirmation({ title: "Supprimer la ligne", message: "Confirme l'action avec ton mot de passe.", confirmLabel: "Supprimer" });
        if (!password) { setSaveMessage({ type: "error", message: "Suppression annulÃ©e." }); return; }
        const typeMapping: Record<MenuItemType, "Travaux" | "Biens" | "Consultance"> = { works: "Travaux", "goods-services": "Biens", consultants: "Consultance" };
        const rowToDelete = rows.find((r) => r._id === rowId);
        await deleteProcurement(numericId, (rowToDelete?.type as "Travaux" | "Biens" | "Consultance") ?? typeMapping[activeMenu], password);
      }
      setRows((prev) => prev.filter((r) => r._id !== rowId));
      setSaveMessage({ type: "danger", message: "Ligne supprimée." });
    } catch (e: unknown) {
      setSaveMessage({ type: "error", message: e instanceof Error ? e.message : "Erreur suppression" });
    }
  };

  const handleRowStop = async (rowId: string) => {
    try {
      if (rowId.startsWith("_new_")) { setSaveMessage({ type: "error", message: "Enregistre d'abord la ligne." }); return; }
      const password = await requestPasswordConfirmation({ title: "Arrêter la ligne", message: "Confirme l'arrêt avec ton mot de passe.", confirmLabel: "Arrêter" });
      if (!password) { setSaveMessage({ type: "error", message: "Arrêt annulé." }); return; }
      const rowToStop = rows.find((r) => r._id === rowId);
      if (!rowToStop) return;
      const typeMapping: Record<MenuItemType, "Travaux" | "Biens" | "Consultance"> = { works: "Travaux", "goods-services": "Biens", consultants: "Consultance" };
      const result = await stopProcurement(Number(rowId), (rowToStop.type as "Travaux" | "Biens" | "Consultance") ?? typeMapping[activeMenu], password);
      setRows((prev) => prev.map((r) => r._id === rowId ? { ...r, status: result.statut || "Arrêté" } : r));
      setSaveMessage({ type: "warning", message: "Ligne arrêtée." });
    } catch (e: unknown) {
      setSaveMessage({ type: "error", message: e instanceof Error ? e.message : "Erreur arrêt" });
    }
  };


const handleRowSave = async (row: GridRow) => {
  setIsSaving(true);
  try {
    const typeMapping: Record<string, "Travaux" | "Biens" | "Consultance"> = {
      works: "Travaux",
      "goods-services": "Biens",
      consultants: "Consultance",
    };

    // Option 2 (architecture): on envoie le modÃ¨le UI et on laisse
    // `buildProcurementPayload` (services/api.ts) mapper vers le backend.
    const procurementData: Procurement = {
      ...row,
      type: typeMapping[activeMenu],
      title: String(row.title ?? " "),
      review_notes: String(
        (row as unknown as Record<string, unknown>).comments ?? row.review_notes ?? "",
      ),
    };

    const rowId = String(row._id ?? "");
    const isNewRow = rowId.startsWith("_new_");
    const numericId = Number.parseInt(rowId, 10);
    const canUpdate = !isNewRow && Number.isFinite(numericId);

    const result = canUpdate
      ? await updateProcurement(numericId, procurementData)
      : await createProcurement(procurementData);

    if (result) {
      setSaveMessage({ type: "success", message: "Enregistré avec succès" });
      const refreshedRows = await loadData();

      try {
        const savedId = String(result.id ?? "");
        const savedRow = refreshedRows.find((r) => String(r._id ?? "") === savedId);
        if (savedRow) {
          const newStatus = await getProcurementStatus(typeMapping[activeMenu], savedRow);
          setRows((prev) =>
            prev.map((r) =>
              String(r._id ?? "") === savedId ? { ...r, status: newStatus } : r,
            ),
          );
        }
      } catch (error) {
        console.error("Erreur calcul statut:", error);
      }
    }

  } catch (e: unknown) {
    console.error("Erreur complète:", e);
    setSaveMessage({
      type: "error",
      message: e instanceof Error ? e.message : "Erreur inconnue",
    });
  } finally {
    setIsSaving(false);
  }
};

  const handleRowUpdate = (updatedRow: GridRow) => {
    console.log("ðŸŸ¢ handleRowUpdate appelÃ© avec:", updatedRow); // DEBUG
    setRows((prevRows) => prevRows.map((row) => (row._id === updatedRow._id ? updatedRow : row)));
  };


  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#eceeef_0%,#e8eaed_100%)] text-[#17212e] font-sans">
      <TopHeader />
      <div className="page-enter grid grid-cols-[auto_minmax(0,1fr)] max-[1150px]:grid-cols-1 gap-2 p-2 overflow-hidden">
        <div className="page-enter-up" style={{ animationDelay: "0.08s" }}>
          <SidebarMenu activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
        </div>

        <main className="page-enter-up min-w-0 p-3 border border-[#d9dee3] rounded-[14px] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] overflow-hidden flex flex-col py-2" style={{ animationDelay: "0.14s", position: "relative", height: "calc(100vh - 15px)" }}>
          <header className="page-enter-up relative grid grid-cols-[minmax(0,1fr)_auto] max-[900px]:grid-cols-1 gap-4 pt-[0.95rem] px-4 pb-4 border border-[#d9dee3] rounded-[14px] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)]" style={{ animationDelay: "0.2s" }}>
            <div className="absolute top-0 inset-x-0 h-1 rounded-t-[14px] bg-gradient-to-r from-[#0ea85b] to-[#57d18d]" aria-hidden="true" />
            
            <div>
              <p className="m-0 text-[#627080] text-[0.7rem] tracking-[0.05em] uppercase">Passation de marchés</p>
              <h1 className="my-[0.32rem] font-bold text-[1.3rem] text-[#0c7340] tracking-[0.05em]">{config.label}</h1>
            </div>
            
            <div className="grid grid-cols-[auto_auto] max-[900px]:grid-cols-1 gap-[0.65rem] justify-end">
              <div className="border border-[#d9dee3] rounded-xl bg-[#f6f7f8] py-[5px] px-[0.7rem] w-[138px] max-[900px]:w-full">
                <span className="m-0 text-[#627080] text-[0.7rem] tracking-[0.05em] uppercase">Marchés</span>
                <strong className="block mt-[0.06rem] text-[#0c7340]">{rows.length}</strong>
              </div>
              <div className="border border-[#d9dee3] rounded-xl bg-[#f6f7f8] py-[5px] px-[0.7rem] w-[253px] max-[900px]:w-full">
                <span className="m-0 text-[#627080] text-[0.7rem] tracking-[0.05em] uppercase">Montant total estimatif (Ar)</span>
                <strong className="block mt-[0.06rem] text-[#0c7340]">{totalEstimatedAmountDisplay}</strong>
              </div>
            </div>
          </header>

          {/* SaveMessage en bas Ã  droite, animÃ© droite -> gauche */}
          {saveMessage && (
            <div
              className={`fixed z-[100] right-6 bottom-[20px] min-w-[220px] max-w-[340px] border rounded-[10px] py-[0.65rem] px-[0.8rem] font-semibold shadow-lg transition-opacity duration-200 animate-saveMessageSlide ${
                saveMessage.type === "success" || saveMessage.type === "warning"
                  ? "bg-[#e6f8ef] border-[#bce9cd] text-[#0c6f3d]"
                  : "bg-[#fde9e9] border-[#f6c8c8] text-[#8d2525]"
              }`}
              style={{ animationDuration: "0.5s" }}
            >
              {saveMessage.message}
            </div>
          )}

          <div className="page-enter-up mt-[0.9rem] overflow-hidden grid grid-rows-[minmax(0,1fr)_auto] min-h-0 border border-[#d9dee3] rounded-[14px] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] flex-1" style={{ animationDelay: "0.28s", display: "flex", flexDirection: "column" }}>
            <div className="min-h-0 max-h-[80vh] overflow-hidden flex-1">
              <GridTable
                columns={columnsForGrid}
                rows={rows}
                onRowChange={handleRowChange}
                onRowSave={handleRowSave}
                onRowUpdate={handleRowUpdate}
                onRowDelete={handleRowDelete}
                onRowStop={handleRowStop}
                isLoading={isLoading || isSaving}
              />
            </div>
            
            {/* Barre Ajouter une ligne Desktop */}
            <div className="relative z-50 min-h-[58px] flex items-center justify-start py-[10px] px-[14px] border-t border-[rgba(171,187,177,0.7)] bg-[linear-gradient(180deg,rgba(246,250,248,0.98),rgba(236,243,239,0.98))] max-[900px]:hidden">
              <button
                type="button"
                className="inline-flex items-center gap-[0.44rem] py-[0.52rem] px-4 rounded-full font-bold transition-all duration-200 border border-[#76cba0] bg-[linear-gradient(180deg,#15ba66,#078848)] text-white disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={handleAddRow}
                disabled={isLoading || isSaving || hasUnsavedRow}
              >
                <span className="text-[1rem] leading-none" aria-hidden="true">+</span>
                <span>Ajouter une ligne</span>
              </button>
            </div>
          </div>

          {/* Bouton Flottant Ajouter une ligne Mobile */}
          <div className="page-enter-up hidden max-[900px]:block fixed right-4 bottom-4 z-50" style={{ animationDelay: "0.34s" }} aria-hidden="false">
            <button
              type="button"
              className="inline-flex items-center gap-[0.44rem] py-[0.52rem] px-4 rounded-full font-bold transition-all duration-200 border border-[#76cba0] bg-[linear-gradient(180deg,#15ba66,#078848)] text-white shadow-lg disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={handleAddRow}
              disabled={isLoading || isSaving || hasUnsavedRow}
            >
              <span className="text-[1rem] leading-none" aria-hidden="true">+</span>
              <span>Ajouter une ligne</span>
            </button>
          </div>

          {/* Modal Mot de Passe */}
          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-[90] bg-[#12182073] backdrop-blur-[3px] grid place-items-center p-4" role="dialog" aria-modal="true">
              <div className="w-[min(460px,100%)] p-4 border border-[#d9dee3] rounded-[14px] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)]">
                <h2 id="password-modal-title" className="m-0 mb-[0.4rem] font-bold text-lg text-[#17212e]">
                  {passwordModalTitle}
                </h2>
                <p className="m-0 mb-[0.8rem] text-[#627080]">{passwordModalMessage}</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = passwordInput.trim();
                    if (!trimmed) return;
                    closePasswordModal(trimmed);
                  }}
                >
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="border border-[#d9dee3] rounded-[10px] min-h-[40px] py-2 px-3 text-[0.9rem] focus:outline-none focus:border-[#67bb91] focus:ring-[3px] focus:ring-[#0ea85b]/20"
                      placeholder="Mot de passe"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="w-[40px] flex items-center justify-center border border-[#d9dee3] rounded-[10px] bg-white text-[#2f3d4c] hover:bg-slate-50 transition-colors"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M10.6 10.6a2 2 0 102.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M9.3 5.1A11 11 0 0112 4c5.5 0 9.5 4 10 8a10.6 10.6 0 01-3.1 5.3M6.2 7.2A11.4 11.4 0 002 12c.2 1.9 1.4 3.8 3.2 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                          <path d="M2 12c.5-4 4.5-8 10-8s9.5 4 10 8c-.5 4-4.5 8-10 8s-9.5-4-10-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="mt-[0.8rem] flex justify-end gap-2">
                    <button
                      type="button"
                      className="py-2 px-[0.9rem] border border-[#bfc8d0] rounded-lg bg-white text-[#2f3d4c] font-bold transition-all hover:bg-slate-50"
                      onClick={() => closePasswordModal(null)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-[0.9rem] border border-[#76cba0] rounded-lg font-bold transition-all bg-[linear-gradient(180deg,#15ba66,#078848)] text-white disabled:opacity-50"
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


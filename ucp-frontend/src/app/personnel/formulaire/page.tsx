"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import SidebarMenu from "@/app/components/SidebarMenu";
import GridTable from "@/app/components/GridTable";
import TopHeader from "@/app/components/TopHeader";
import {
  getLandingRouteForUser,
  getToken,
  isAgentAchatUser,
  isValidatorUser,
  isAdminUser,
} from "@/services/auth";
import { getme } from "@/services/profile";
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
    if (!getToken()) {
      router.replace("/auth/login");
      return;
    }

    void getme().then((res) => {
      if (res.error) return;
      const user = res.data ?? null;
      if (!isAdminUser(user) && (isValidatorUser(user) || isAgentAchatUser(user))) {
        router.replace(getLandingRouteForUser(user));
      }
    });
  }, [router]);

  useEffect(() => {
    void getme().then((res) => {
      if (res.error) return;
      const user = res.data ?? null;
      if (
        getToken() &&
        (isAdminUser(user) ||
        (!isValidatorUser(user) &&
        !isAgentAchatUser(user)))
      ) {
        loadData();
      }
    });
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
    saveMessageTimeoutRef.current = window.setTimeout(() => setSaveMessage(null), 2500);
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
    const newRow: GridRow = { _id: newId, review_status: "post", type: typeMapping[activeMenu], financing_sources: [], reference_bailleur: "", project_code: "" };
    config.columns.forEach((col) => { newRow[col.key] = newRow[col.key] ?? ""; });
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
        if (!password) { setSaveMessage({ type: "error", message: "Suppression annulée." }); return; }
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
    setRows((prevRows) => prevRows.map((row) => (row._id === updatedRow._id ? updatedRow : row)));
  };


  return (
    <div className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#eceeef_0%,#e8eaed_100%)] text-[#17212e] font-sans min-[1151px]:h-screen min-[1151px]:overflow-hidden">
      <TopHeader />
      <div className="page-enter grid grid-cols-[auto_minmax(0,1fr)] gap-2 p-2 max-[1150px]:grid-cols-1 min-[1151px]:overflow-hidden">
        <div className="page-enter-up" style={{ animationDelay: "0.08s" }}>
          <SidebarMenu activeMenu={activeMenu} onMenuSelect={setActiveMenu} />
        </div>

        <main
          className="page-enter-up flex min-w-0 flex-col rounded-[14px] border border-[#d9dee3] bg-white p-3 py-2 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] min-[1151px]:h-[calc(100vh-15px)] min-[1151px]:overflow-hidden max-[1150px]:min-h-0"
          style={{ animationDelay: "0.14s", position: "relative" }}
        >
          {/* Header bar with title, stats, and add button */}
          <header
            className="page-enter-up relative flex items-center justify-between gap-4 rounded-[14px] border border-[#d9dee3] bg-white px-4 py-3 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] max-[900px]:flex-wrap max-[900px]:gap-2"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-[14px] bg-gradient-to-r from-[#0ea85b] to-[#57d18d]"
              aria-hidden="true"
            />

            {/* Left: title */}
            <div className="min-w-0">
              <p className="m-0 text-[0.7rem] uppercase tracking-[0.05em] text-[#627080]">
                Passation de marchés
              </p>
              <h1 className="my-[0.15rem] text-[1.3rem] font-bold tracking-[0.05em] text-[#0c7340] truncate">
                {config.label}
              </h1>
            </div>

            {/* Center: stat badges */}
            <div className="flex items-center gap-2 max-[900px]:w-full max-[900px]:justify-center">
              <div className="rounded-xl border border-[#d9dee3] bg-[#f6f7f8] px-3 py-1.5 text-center">
                <span className="m-0 text-[0.65rem] uppercase tracking-[0.04em] text-[#627080] block">
                  Marchés
                </span>
                <strong className="text-[#0c7340] text-sm">{rows.length}</strong>
              </div>
              <div className="rounded-xl border border-[#d9dee3] bg-[#f6f7f8] px-3 py-1.5 text-center">
                <span className="m-0 text-[0.65rem] uppercase tracking-[0.04em] text-[#627080] block">
                  Montant total (Ar)
                </span>
                <strong className="text-[#0c7340] text-sm">{totalEstimatedAmountDisplay}</strong>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 max-[900px]:w-full max-[900px]:justify-end">
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={isLoading || isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d9dee3] bg-white px-3 py-1.5 text-[0.8rem] font-semibold text-[#395569] transition-all hover:bg-[#f6f7f8] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Rafraîchir les données"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span className="max-[600px]:hidden">Rafraîchir</span>
              </button>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={isLoading || isSaving || hasUnsavedRow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#76cba0] bg-[linear-gradient(180deg,#15ba66,#078848)] px-4 py-1.5 text-[0.8rem] font-bold text-white shadow-[0_2px_8px_-2px_rgba(15,129,72,0.4)] transition-all hover:shadow-[0_4px_12px_-2px_rgba(15,129,72,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasUnsavedRow ? "Enregistre ou supprime la ligne en cours d'abord" : "Ajouter un nouveau marché"}
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
            </div>
          </header>

          {/* Save toast */}
          {saveMessage && (
            <div
              className={`fixed bottom-[20px] right-6 z-[100] min-w-[220px] max-w-[340px] rounded-[10px] border px-[0.8rem] py-[0.65rem] font-semibold shadow-lg transition-opacity duration-200 animate-saveMessageSlide ${
                saveMessage.type === "success" || saveMessage.type === "warning"
                  ? "bg-[#e6f8ef] border-[#bce9cd] text-[#0c6f3d]"
                  : "bg-[#fde9e9] border-[#f6c8c8] text-[#8d2525]"
              }`}
              style={{ animationDuration: "0.5s" }}
            >
              {saveMessage.message}
            </div>
          )}

          {/* Grid area — flex-1 fills remaining space, overflow handled by GridTable internally */}
          <div
            className="page-enter-up mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#d9dee3] bg-white shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)]"
            style={{ animationDelay: "0.28s" }}
          >
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

          {/* Password modal */}
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

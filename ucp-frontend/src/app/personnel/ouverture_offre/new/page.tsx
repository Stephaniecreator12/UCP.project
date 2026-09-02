"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import type { UserProfile } from "@/services/auth";
import { fetchCurrentUser, getToken, isAdminUser, isSecretaireUser } from "@/services/auth";
import {
  createSeance,
  getAvailableUsers,
} from "@/services/ouvertureOffre";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";
import { getChoiceLabel } from "@/services/choices";
import type {
  CommissionMemberPayload,
  SeanceStatut,
} from "@/types/ouvertureOffre";

const MIN_COMMISSION_MEMBERS = 3;

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300";
const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300";
const textareaClass =
  "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300 min-h-[80px] resize-y";
const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1";

export default function NouvelleSeancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: number; full_name?: string; first_name?: string; last_name?: string; username: string; email: string }[]>([]);
  const [screenState, setScreenState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const seanceStatusChoices = useReferenceChoices("STATUT_SEANCE", []);

  const [formData, setFormData] = useState({
    reference_dossier: "",
    objet_dossier: "",
    president: "",
    date_seance: "",
    heure_seance: "",
    lieu: "",
    observations: "",
    statut: "BROUILLON" as SeanceStatut,
  });
  const [commissionMembers, setCommissionMembers] = useState<CommissionMemberPayload[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberModalError, setMemberModalError] = useState("");
  const [pendingCreate, setPendingCreate] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        router.replace("/auth/login");
        return;
      }
      try {
        const user = await fetchCurrentUser();
        if (!isAdminUser(user) && !isSecretaireUser(user)) {
          setScreenState("forbidden");
          return;
        }
        const users = await getAvailableUsers();
        setCurrentUser(user);
        setAvailableUsers(users);
        setScreenState("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les données.");
        setScreenState("error");
      }
    };
    void bootstrap();
  }, [router]);

  const filteredUsers = availableUsers.filter((user) => {
    if (!memberSearch) return true;
    const search = memberSearch.toLowerCase();
    return (
      user.username.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.full_name || "").toLowerCase().includes(search)
    );
  });

  const addCommissionMember = (userId: number) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (!user) return;
    if (commissionMembers.some((m) => m.email === user.email)) return;
    if (formData.president && String(formData.president) === String(userId)) return;

    setCommissionMembers((prev) => [
      ...prev,
      {
        nomPrenom: user.full_name?.trim() || `${user.first_name} ${user.last_name}`.trim() || user.username,
        email: user.email.trim(),
        cin: "",
        poste: "",
        entite: "",
      },
    ]);
    setMemberSearch("");
  };

  const removeCommissionMember = (index: number) => {
    setCommissionMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCommissionMember = (index: number, field: keyof CommissionMemberPayload, value: string) => {
    setCommissionMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (pendingCreate) return;

    if (commissionMembers.length < MIN_COMMISSION_MEMBERS) {
      setMemberModalError(
        `La commission doit contenir au minimum ${MIN_COMMISSION_MEMBERS} membres.`,
      );
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setPendingCreate(true);

      const seance = await createSeance({
        reference_dossier: formData.reference_dossier.trim(),
        objet_dossier: formData.objet_dossier.trim(),
        statut: formData.statut,
        commission_members: commissionMembers,
        president: formData.president ? Number(formData.president) : null,
        date_seance: formData.date_seance || null,
        heure_seance: formData.heure_seance || null,
        lieu: formData.lieu.trim(),
        observations: formData.observations.trim(),
      } as any);

      setSuccessMessage("Séance créée avec succès.");
      setTimeout(() => {
        router.push(`/personnel/ouverture_offre/${seance.id}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la séance.");
    } finally {
      setPendingCreate(false);
    }
  };

  if (screenState === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Chargement...
          </div>
        </div>
      </main>
    );
  }

  if (screenState === "forbidden") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm max-w-md text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Accès Refusé</h2>
          <p className="mt-2 text-sm text-slate-600">
            Seul un administrateur ou le secrétaire peut créer une séance.
          </p>
          <button
            type="button"
            onClick={() => router.push("/personnel/ouverture_offre")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
        </div>
      </main>
    );
  }

  if (screenState === "error") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <TopHeader />
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Erreur</h1>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/personnel/ouverture_offre")}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
      <TopHeader />
      {error && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <span className="text-sm font-semibold text-rose-700">{error}</span>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="zoom-content h-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 gap-6 mt-8 pb-12 flex flex-col animate-in slide-in-from-bottom-6 duration-700">

          {/* En-tête principal */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3 group-hover:rotate-6 transition-all duration-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">NOUVELLE SÉANCE</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Créer une nouvelle séance d'ouverture</p>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => router.push("/personnel/ouverture_offre")} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 w-full">

            {/* Section 1: Informations de la séance */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%] animate-gradient"></div>
              <div className="p-6">
                <h2 className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  1. Informations de la séance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4">
                    <label className={labelClass}>Référence du dossier *</label>
                    <input
                      value={formData.reference_dossier}
                      onChange={(e) => setFormData((f) => ({ ...f, reference_dossier: e.target.value }))}
                      required
                      placeholder="Ex. DAO-2026-001"
                      className={fieldClass}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <label className={labelClass}>Objet du dossier *</label>
                    <input
                      value={formData.objet_dossier}
                      onChange={(e) => setFormData((f) => ({ ...f, objet_dossier: e.target.value }))}
                      required
                      placeholder="Objet du DAO"
                      className={fieldClass}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label className={labelClass}>Statut *</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData((f) => ({ ...f, statut: e.target.value as SeanceStatut }))}
                      className={selectClass}
                    >
                      {seanceStatusChoices.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-4">
                    <label className={labelClass}>Date de séance *</label>
                    <input
                      type="date"
                      value={formData.date_seance}
                      onChange={(e) => setFormData((f) => ({ ...f, date_seance: e.target.value }))}
                      min={new Date().toISOString().slice(0, 10)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={labelClass}>Heure *</label>
                    <input
                      type="time"
                      value={formData.heure_seance}
                      onChange={(e) => setFormData((f) => ({ ...f, heure_seance: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div className="lg:col-span-6">
                    <label className={labelClass}>Lieu *</label>
                    <input
                      value={formData.lieu}
                      onChange={(e) => setFormData((f) => ({ ...f, lieu: e.target.value }))}
                      placeholder="Ex. Salle 3, UCP"
                      className={fieldClass}
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <label className={labelClass}>Président</label>
                    <select
                      value={formData.president}
                      onChange={(e) => setFormData((f) => ({ ...f, president: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">Non désigné</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={String(user.id)}>
                          {user.full_name?.trim() || user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-12">
                    <label className={labelClass}>Observations</label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => setFormData((f) => ({ ...f, observations: e.target.value }))}
                      rows={2}
                      placeholder="Observations éventuelles..."
                      className={textareaClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Membres de la commission */}
            <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-500 bg-[length:200%_100%] animate-gradient"></div>
              <div className="p-6">
                <h2 className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-800">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    <Users className="h-5 w-5" />
                  </div>
                  2. Membres de la commission
                  <span className="text-[11px] font-normal text-slate-500">
                    (minimum {MIN_COMMISSION_MEMBERS} membres requis)
                  </span>
                </h2>

                {memberModalError && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
                    {memberModalError}
                  </div>
                )}

                <div className="space-y-3">
                  {commissionMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        type="text"
                        value={member.nomPrenom}
                        onChange={(e) => updateCommissionMember(index, "nomPrenom", e.target.value)}
                        placeholder="Nom & Prénom"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateCommissionMember(index, "email", e.target.value)}
                        placeholder="Email"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      <input
                        type="text"
                        value={member.cin}
                        onChange={(e) => updateCommissionMember(index, "cin", e.target.value)}
                        placeholder="CIN"
                        maxLength={12}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      <input
                        type="text"
                        value={member.poste}
                        onChange={(e) => updateCommissionMember(index, "poste", e.target.value)}
                        placeholder="Poste"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      <input
                        type="text"
                        value={member.entite}
                        onChange={(e) => updateCommissionMember(index, "entite", e.target.value)}
                        placeholder="Entité"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeCommissionMember(index)}
                        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-10 pr-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300"
                  />
                  {memberSearch && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-2 text-xs text-slate-500">Aucun utilisateur trouvé.</div>
                      ) : (
                        filteredUsers.map((user) => {
                          const alreadyAdded = commissionMembers.some((m) => m.email === user.email);
                          const isPresident = !!formData.president && String(formData.president) === String(user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => !alreadyAdded && !isPresident && addCommissionMember(user.id)}
                              disabled={alreadyAdded || isPresident}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-slate-50 ${
                                alreadyAdded || isPresident
                                  ? "cursor-not-allowed text-slate-400"
                                  : "text-slate-800"
                              }`}
                            >
                              <span>{user.full_name?.trim() || user.username}</span>
                              <span className="text-slate-400">{user.email}</span>
                              {alreadyAdded && <span className="text-xs">— déjà ajouté</span>}
                              {isPresident && <span className="text-xs">— président</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => router.push("/personnel/ouverture_offre")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" /> Annuler
              </button>
              <button
                type="submit"
                disabled={pendingCreate || commissionMembers.length < MIN_COMMISSION_MEMBERS}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.24)] transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingCreate ? (
                  <>Création...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Créer la séance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
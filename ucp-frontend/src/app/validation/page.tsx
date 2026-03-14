"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CurrentUserProfile,
  DemandeAchat,
  ValidationDemandeAchatItem,
} from "@/types/demandeAchat";
import {
  decideDemandeAchat,
  getCurrentUserProfile,
  getPendingDemandesAchat,
  transmitDemandeAchat,
} from "@/services/demandeAchat";
import { logout } from "@/services/auth";
import { useRouter } from "next/navigation";

const statusBadge = (statut: string) => {
  const palette: Record<string, string> = {
    Soumise: "bg-amber-50 text-amber-800 border-amber-200",
    "Validée Service": "bg-emerald-50 text-emerald-800 border-emerald-200",
    "Validée Budget": "bg-teal-50 text-teal-800 border-teal-200",
    "Validée Direction": "bg-blue-50 text-blue-800 border-blue-200",
  };
  return palette[statut] ?? "bg-slate-100 text-slate-700 border-slate-200";
};

export default function ValidationPage() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [pending, setPending] = useState<DemandeAchat[]>([]);
  const [selected, setSelected] = useState<DemandeAchat | null>(null);
  const [comment, setComment] = useState("");
  const [fonds, setFonds] = useState<"Fonds disponibles" | "Fonds insuffisants" | "">("");
  const [visa, setVisa] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getCurrentUserProfile();
        setProfile(me);
        const list = await getPendingDemandesAchat();
        setPending(list);
        setSelected(list[0] ?? null);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canApprove = useMemo(() => {
    if (!profile || !selected) return false;
    if (profile.role === "responsable_service" && selected.statut === "Soumise") return true;
    if (profile.role === "controle_budget" && selected.statut === "Validée Service") return true;
    if (profile.role === "directeur" && selected.statut === "Validée Budget") return true;
    return false;
  }, [profile, selected]);

  const canTransmit = useMemo(() => {
    if (!profile || !selected) return false;
    if ((profile.role === "directeur" || profile.role === "marches") && selected.statut === "Validée Direction")
      return true;
    return false;
  }, [profile, selected]);

  const refreshAfterAction = async () => {
    const list = await getPendingDemandesAchat();
    setPending(list);
    setSelected(list[0] ?? null);
    setComment("");
    setFonds("");
    setVisa("");
  };

  const handleDecision = async (decision: "Approuvé" | "Rejeté") => {
    if (!selected || !selected.id) return;
    try {
      await decideDemandeAchat(selected.id, {
        decision,
        commentaire: comment || undefined,
        fonds_statut:
          profile?.role === "controle_budget" ? (fonds || undefined) : undefined,
        visa:
          profile?.role === "controle_budget" || profile?.role === "directeur"
            ? visa || undefined
            : undefined,
      });
      setMessage(decision === "Approuvé" ? "Validation enregistrée" : "Demande rejetée");
      await refreshAfterAction();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur de validation");
    }
  };

  const handleTransmit = async () => {
    if (!selected || !selected.id) return;
    try {
      await transmitDemandeAchat(selected.id, comment);
      setMessage("Transmise aux Marchés");
      await refreshAfterAction();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur de transmission");
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <main className="min-h-screen overflow-y-auto bg-slate-50 px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              File de validation
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">Demandes à traiter</h1>
              {profile?.role && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  {profile.role.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{profile?.user.full_name}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute h-4 w-4 rounded-full bg-emerald-200/70 animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
            </span>
            {pending.length} en attente
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
                router.refresh();
              }}
              className="ml-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 shadow">
            {message}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.25)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                À valider
              </span>
              <span className="text-xs text-slate-500">{pending.length} éléments</span>
            </div>
            <div className="max-h-[56vh] overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-200">
              <table className="min-w-full text-[14px] text-slate-800">
                <thead className="sticky top-0 z-10 bg-slate-50/95 text-[11px] uppercase text-slate-500 shadow-[0_1px_0_rgba(148,163,184,0.35)] backdrop-blur">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left">Numéro</th>
                    <th className="px-3.5 py-2.5 text-left">Intitulé</th>
                    <th className="px-3.5 py-2.5 text-left">Statut</th>
                    <th className="px-3.5 py-2.5 text-left">Service</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((d) => (
                    <tr
                      key={d.id ?? d.numero_demande}
                      className={`cursor-pointer border-b border-slate-100 transition duration-150 hover:bg-emerald-50/70 ${
                        selected?.id === d.id ? "bg-emerald-50 shadow-inner shadow-emerald-100" : ""
                      }`}
                      onClick={() => setSelected(d)}
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">{d.numero_demande}</td>
                      <td className="px-3.5 py-2.5 line-clamp-1">{d.intitule_demande}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold ${statusBadge(d.statut)}`}>
                          {d.statut}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">{d.service_demandeur}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td className="px-3.5 py-4 text-slate-500" colSpan={4}>
                        Aucune demande à traiter pour votre rôle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.25)] backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Détail</h2>
              {selected && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    #{selected.numero_demande}
                  </span>
                  <span className={`rounded-full border px-3 py-1 ${statusBadge(selected.statut)}`}>
                    {selected.statut}
                  </span>
                  {selected.urgent && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 shadow-sm animate-[pulse_2s_ease-in-out_infinite]">
                      ⚡ Urgent
                    </span>
                  )}
                </div>
              )}
            </div>
            {selected ? (
              <div className="space-y-3 pt-3 text-[14px] text-slate-800">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {["intitule_demande", "service_demandeur", "budget_estime", "devise"].map((key) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {(() => {
                          const val = (selected as Record<string, unknown>)[key];
                          if (typeof val === "string" && val) return val;
                          if (typeof val === "number") return String(val);
                          return "-";
                        })()}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Période souhaitée
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selected.date_debut_souhaitee || "-"} → {selected.date_fin_souhaitee || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Lieu / Adresse
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {selected.region_district || "-"} {selected.adresse_precise && `• ${selected.adresse_precise}`}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3.5 py-2.5 shadow-inner shadow-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Description</p>
                  <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-800">{selected.description_detaillee}</p>
                  {selected.justification_urgence && selected.urgent && (
                    <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                      Justification urgence : {selected.justification_urgence}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-3.5 py-2.5 shadow-inner shadow-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Historique</p>
                  <div className="mt-2 space-y-2">
                    {selected.validations && selected.validations.length > 0 ? (
                      selected.validations.map((v: ValidationDemandeAchatItem) => (
                        <div key={v.id} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{v.validateur.full_name}</span>
                            <span>{v.date_validation?.slice(0, 10)}</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {v.role_validateur} • {v.etape}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-800">{v.decision}</p>
                          {v.fonds_statut && <p className="text-xs text-slate-500">Fonds: {v.fonds_statut}</p>}
                          {v.visa && <p className="text-xs text-slate-500">Visa: {v.visa}</p>}
                          {v.commentaire && (
                            <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{v.commentaire}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Aucune validation enregistrée.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50 px-3.5 py-3.5 shadow-inner shadow-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Action</p>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/12"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Commentaire (optionnel)"
                  />
                  {profile?.role === "controle_budget" && (
                    <div className="flex flex-wrap gap-2">
                      {(["Fonds disponibles", "Fonds insuffisants"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFonds(f)}
                          className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                            fonds === f
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                  {(profile?.role === "controle_budget" || profile?.role === "directeur") && (
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/12"
                      value={visa}
                      onChange={(e) => setVisa(e.target.value)}
                      placeholder="Visa numérique (optionnel)"
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {canApprove && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision("Approuvé")}
                          className="rounded-full bg-emerald-600 px-4.5 py-2.5 text-[14px] font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-emerald-700"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision("Rejeté")}
                          className="rounded-full border border-rose-300 bg-rose-50 px-4.5 py-2.5 text-[14px] font-semibold text-rose-800 transition hover:-translate-y-[1px] hover:border-rose-400"
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {canTransmit && (
                      <button
                        type="button"
                        onClick={handleTransmit}
                        className="rounded-full bg-indigo-600 px-4.5 py-2.5 text-[14px] font-semibold text-white shadow transition hover:-translate-y-[1px] hover:bg-indigo-700"
                      >
                        Transmettre aux Marchés
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="pt-3 text-sm text-slate-500">Aucune demande sélectionnée.</p>
            )}
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg lg:block"
        aria-hidden="true"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Guide rapide
        </p>
        <ul className="mt-2 space-y-1.5 text-slate-700">
          <li className="flex items-start gap-2">
            <span className="mt-[2px] h-2 w-2 rounded-full bg-emerald-500" />
            Ouvre une demande, lis le détail.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[2px] h-2 w-2 rounded-full bg-emerald-500" />
            Ajoute ton commentaire ou le visa.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[2px] h-2 w-2 rounded-full bg-emerald-500" />
            Clique Valider / Rejeter puis Transmettre.
          </li>
        </ul>
      </div>
    </main>
  );
}

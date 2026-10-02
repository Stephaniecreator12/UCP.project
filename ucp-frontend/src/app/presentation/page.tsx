"use client";
import { useState } from "react";

/* ======================================================================
   /presentation — exhaustive jury showcase, 100% mocked, self-contained.
   No import from services/*, no token, no role gate. Local useState only.
   ====================================================================== */

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300";
const textareaClass = `${fieldClass} min-h-[80px] resize-y`;
const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1";
const cardClass =
  "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] sm:p-8";
const sectionTitleClass =
  "text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700";

type Toast = { title: string; message: string } | null;
type Notify = (m: string) => void;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`h-9 w-9 rounded-xl border text-sm font-black transition ${
            value >= n
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-300 hover:border-slate-300"
          }`}
          aria-label={`note ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{sub}</p>
    </div>
  );
}

function DonutCSS({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const parts: string[] = [];
  segments.forEach((s) => {
    const from = (acc / total) * 360;
    acc += s.value;
    const to = (acc / total) * 360;
    parts.push(`${s.color} ${from}deg ${to}deg`);
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full border border-slate-100 shadow-inner"
        style={{ width: size, height: size, background: `conic-gradient(${parts.join(",")})`, position: "relative" }}
      >
        <div
          className="absolute flex items-center justify-center rounded-full bg-white"
          style={{ inset: size * 0.24 }}
        >
          <span className="text-lg font-black text-slate-800">{total}</span>
        </div>
      </div>
      <ul className="w-full space-y-1">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span>{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ data, color = "#059669" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all"
            style={{ height: `${Math.max(8, (d.value / max) * 110)}px`, background: `linear-gradient(180deg, ${color}, ${color}55)` }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[9px] font-bold text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Utility descriptions ---------------- */

export type Utility = {
  purpose: string;
  users: string;
  rules: string;
  script: string;
  presenter: string;
  file: string;
};

function UtilityBox({ u }: { u: Utility }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-100 px-5 py-3">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
          {u.presenter}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          {u.users}
        </span>
        <span className="ml-auto font-mono text-[10px] font-bold text-slate-400">{u.file}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">🎯 Utilité métier</p>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-700">{u.purpose}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-amber-700">📜 Règles & validations</p>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-700">{u.rules}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">🎤 Script jury — lire à voix haute</p>
          <p className="mt-1 text-[13px] font-medium italic leading-relaxed text-slate-700">“{u.script}”</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Coherent mock universe ---------------- */

const MOCK = {
  demandeurs: ["R. Randria (Logistique)", "S. Rabe (Suivi-Évaluation)", "T. Rakoto (Finance)"],
  fournisseurs: ["EURL MediDistrib", "Société Vakinankaratra SARL", "Bureau d'études Miaro Conseil"],
  marches: [
    { ref: "AOI-2026-03", title: "Fourniture de vaccins & chaîne de froid", montant: "1 240 000 000 Ar", deadline: "15 nov. 2026 12:00" },
    { ref: "AON-2026-07", title: "Travaux réhabilitation CSB II Antsirabe", montant: "860 500 000 Ar", deadline: "28 nov. 2026 10:00" },
    { ref: "DC-2026-11", title: "Formation logistique — 40 agents", montant: "68 250 000 Ar (15 000 USD)", deadline: "05 nov. 2026 16:00" },
  ],
};

/* ================= A. Authentification ================= */

function LoginForm({ onSuccess }: { onSuccess: Notify }) {
  const [email, setEmail] = useState("demo@ucp.mg");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-7 shadow sm:p-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Unité de Coordination des Projets</p>
      <h2 className="mt-3 text-center text-3xl font-bold text-slate-900">Connexion</h2>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            onSuccess(`Connexion simulée pour ${email} — routage par groupe (mock).`);
          }, 600);
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Saisir votre email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Mot de passe</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Saisir votre mot de passe" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" />
        </div>
        <button type="submit" className="inline-flex w-full items-center justify-center rounded-2xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#14532d]">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-center text-[11px] font-semibold text-slate-400">Email inconnu → redirection inscription publique (mock).</p>
      </form>
    </div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: Notify }) {
  const [f, setF] = useState({ full_name: "Jean Dupont", email: "jean@entreprise.mg", phone: "+261 34 00 000 00", type_entite: "ENTREPRISE", nif: "1234567", password: "demo1234", confirmPassword: "demo1234" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form
      className="mx-auto w-full max-w-md space-y-4 rounded-[30px] border border-slate-200/80 bg-white p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.password !== f.confirmPassword) return onSuccess("Échec simulé : les mots de passe ne correspondent pas.");
        onSuccess(`Compte fournisseur simulé créé pour ${f.email} — écran vérification e-mail (mock).`);
      }}
    >
      <Field label="Nom complet"><input required className={fieldClass} value={f.full_name} onChange={set("full_name")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email"><input required type="email" className={fieldClass} value={f.email} onChange={set("email")} /></Field>
        <Field label="Téléphone"><input required className={fieldClass} value={f.phone} onChange={set("phone")} /></Field>
      </div>
      <Field label="Type d'entité">
        <select className={fieldClass} value={f.type_entite} onChange={set("type_entite")}>
          {["ENTREPRISE", "BUREAU_ETUDES", "ONG", "PARTICULIER", "CONSULTANT"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="NIF (fiscal)"><input required className={fieldClass} value={f.nif} onChange={set("nif")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mot de passe"><input required type="password" className={fieldClass} value={f.password} onChange={set("password")} /></Field>
        <Field label="Confirmation"><input required type="password" className={fieldClass} value={f.confirmPassword} onChange={set("confirmPassword")} /></Field>
      </div>
      <button type="submit" className="btn-primary w-full">Créer mon compte UCP</button>
    </form>
  );
}

function VerifyEmailDemo({ notify }: { notify: Notify }) {
  const [token, setToken] = useState("eyJ0b2tlbi1tb2NrLTIwMjY");
  const [email, setEmail] = useState("jean@entreprise.mg");
  const [status, setStatus] = useState<"idle" | "ok" | "expired">("idle");
  return (
    <div className={`${cardClass} mx-auto max-w-md space-y-4 text-center`}>
      <p className={sectionTitleClass}>Activation du compte — replica de auth/verify-email</p>
      <Field label="Token (?token=…)"><input className={`${fieldClass} font-mono`} value={token} onChange={(e) => setToken(e.target.value)} /></Field>
      <div className="flex gap-2">
        <button type="button" className="btn-primary flex-1" onClick={() => { setStatus("ok"); notify("E-mail simulé vérifié — redirection connexion (mock)."); }}>Vérifier (mock)</button>
        <button type="button" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" onClick={() => setStatus("expired")}>Simuler expiré</button>
      </div>
      {status === "ok" && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">✓ Compte activé (mock) — redirection /auth/login?verified=true</p>}
      {status === "expired" && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Lien expiré (mock). Renvoyer le lien :</p>
          <div className="flex gap-2">
            <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="button" className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white" onClick={() => notify(`Lien simulé renvoyé à ${email} (mock).`)}>Renvoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EvalLoginDemo({ notify }: { notify: Notify }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Accès évaluateur DAO simulé — liste des offres affichée (mock)."); }} className={`${cardClass} mx-auto max-w-md space-y-4`}>
      <p className={sectionTitleClass}>Login évaluateur DAO — replica de evaluation/login</p>
      <Field label="Email"><input required type="email" defaultValue="evaluateur@ucp.mg" className={fieldClass} /></Field>
      <Field label="Code / mot de passe DAO"><input required type="password" defaultValue="DAO-2026" className={fieldClass} /></Field>
      <Field label="Séance (?seance=…)"><input defaultValue="Séance SE-2026-011 — AOI vaccins" className={fieldClass} /></Field>
      <button className="btn-primary w-full" type="submit">Accéder aux offres</button>
    </form>
  );
}

/* ================= B. Demande d'achat — création & correction ================= */

function DemandeAchatForm({ onSuccess }: { onSuccess: Notify }) {
  const [typeDemande, setTypeDemande] = useState<"MATERIELS" | "PETITS_SERVICES">("MATERIELS");
  const [f, setF] = useState({ uniteTechnique: "LOGISTIQUE", categorieBesoin: "NOUVEAU_BESOIN", priorite: "NORMAL", objet: "Achat ordinateurs de bureau", serviceBeneficiaire: "Service Informatique", lienPtba: "PTBA-2026-A1", justification: "Renouvellement du parc informatique (5 postes)." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [ligne, setLigne] = useState(
    typeDemande === "MATERIELS"
      ? { designation: "Ordinateur portable", marque: "HP ProBook 440", quantite: 5, unite: "Pièce", prix: 2500000, specs: "i5 / 16 Go / 512 Go SSD", lieu: "Antananarivo", destinataire: "S. Rabe" }
      : null
  );
  const [svc, setSvc] = useState({ type_service: "FORMATION", description: "Formation logistique 40 agents", debut: "2026-11-10", fin: "2026-11-14", beneficiaires: 40, cout: 15000, lieu: "Antsirabe", livrables: "Attestations + rapport" });
  const [routing, setRouting] = useState<string | null>(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (typeDemande === "PETITS_SERVICES" && !routing) return onSuccess("Choisissez le routage : validation directe ou préparer TDR/ST (mock)."); onSuccess(`Demande ÉTAT DE BESOINS simulée transmise (${typeDemande}${routing ? " → " + routing : ""}) (mock).`); }} className={`${cardClass} space-y-6`}>
      <p className={sectionTitleClass}>Section 1 — Qualification (replica demande-achat/new)</p>
      <div className="flex gap-2">
        {(["MATERIELS", "PETITS_SERVICES"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTypeDemande(t)} className={`rounded-xl px-4 py-2 text-[12px] font-black ${typeDemande === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Unité technique (Cellule)"><select className={fieldClass} value={f.uniteTechnique} onChange={set("uniteTechnique")}>{["PASSATION", "SUIVI_EVALUATION", "FINANCE", "LOGISTIQUE", "COORDINATION", "TECHNIQUE", "RH_ADMIN"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Catégorie de besoin"><select className={fieldClass} value={f.categorieBesoin} onChange={set("categorieBesoin")}>{["NOUVEAU_BESOIN", "REAPPROVISIONNEMENT", "REMPLACEMENT", "URGENCE"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Priorité"><select className={fieldClass} value={f.priorite} onChange={set("priorite")}><option value="NORMAL">Normal (5 jours)</option><option value="URGENT">Urgent (48h)</option></select></Field>
        <Field label="Objet"><input required className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Service bénéficiaire"><input required className={fieldClass} value={f.serviceBeneficiaire} onChange={set("serviceBeneficiaire")} /></Field>
        <Field label="Lien PTBA"><input required className={fieldClass} value={f.lienPtba} onChange={set("lienPtba")} /></Field>
      </div>
      <Field label="Justification"><textarea required className={textareaClass} value={f.justification} onChange={set("justification")} /></Field>
      <p className={sectionTitleClass}>Section 2 — Ligne de besoin ({typeDemande})</p>
      {typeDemande === "MATERIELS" && ligne && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Désignation *"><input required className={fieldClass} value={ligne.designation} onChange={(e) => setLigne({ ...ligne, designation: e.target.value })} /></Field>
          <Field label="Marque / modèle"><input className={fieldClass} value={ligne.marque} onChange={(e) => setLigne({ ...ligne, marque: e.target.value })} /></Field>
          <Field label="Quantité (≥1) *"><input required type="number" min={1} className={fieldClass} value={ligne.quantite} onChange={(e) => setLigne({ ...ligne, quantite: Number(e.target.value) })} /></Field>
          <Field label="Unité *"><input required className={fieldClass} value={ligne.unite} onChange={(e) => setLigne({ ...ligne, unite: e.target.value })} /></Field>
          <Field label="Prix unitaire estimé (Ar)"><input type="number" className={fieldClass} value={ligne.prix} onChange={(e) => setLigne({ ...ligne, prix: Number(e.target.value) })} /></Field>
          <Field label="Lieu de livraison *"><input required className={fieldClass} value={ligne.lieu} onChange={(e) => setLigne({ ...ligne, lieu: e.target.value })} /></Field>
          <Field label="Caractéristiques techniques *"><textarea required className={textareaClass} value={ligne.specs} onChange={(e) => setLigne({ ...ligne, specs: e.target.value })} /></Field>
          <Field label="Destinataire final *"><input required className={fieldClass} value={ligne.destinataire} onChange={(e) => setLigne({ ...ligne, destinataire: e.target.value })} /></Field>
        </div>
      )}
      {typeDemande === "PETITS_SERVICES" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type de service *"><select className={fieldClass} value={svc.type_service} onChange={(e) => setSvc({ ...svc, type_service: e.target.value })}>{["FORMATION", "MAINTENANCE", "REPARATION", "NETTOYAGE", "PRESTATION_PONCTUELLE"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Nombre bénéficiaires"><input type="number" min={0} className={fieldClass} value={svc.beneficiaires} onChange={(e) => setSvc({ ...svc, beneficiaires: Number(e.target.value) })} /></Field>
            <Field label="Début *"><input required type="date" className={fieldClass} value={svc.debut} onChange={(e) => setSvc({ ...svc, debut: e.target.value })} /></Field>
            <Field label="Fin (≥ début) *"><input required type="date" min={svc.debut} className={fieldClass} value={svc.fin} onChange={(e) => setSvc({ ...svc, fin: e.target.value })} /></Field>
            <Field label="Coût total estimé *"><input required type="number" className={fieldClass} value={svc.cout} onChange={(e) => setSvc({ ...svc, cout: Number(e.target.value) })} /></Field>
            <Field label="Lieu d'exécution *"><input required className={fieldClass} value={svc.lieu} onChange={(e) => setSvc({ ...svc, lieu: e.target.value })} /></Field>
          </div>
          <Field label="Description du service *"><textarea required className={textareaClass} value={svc.description} onChange={(e) => setSvc({ ...svc, description: e.target.value })} /></Field>
          <Field label="Livrables attendus *"><input required className={fieldClass} value={svc.livrables} onChange={(e) => setSvc({ ...svc, livrables: e.target.value })} /></Field>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-sky-700">Routage TDR/ST (services uniquement)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["DIRECT_VALIDATION", "PREPARE_TDR", "PREPARE_ST"].map((r) => (
                <button key={r} type="button" onClick={() => setRouting(r)} className={`rounded-xl px-4 py-2 text-[12px] font-black ${routing === r ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{r}</button>
              ))}
            </div>
          </div>
        </>
      )}
      <button type="submit" className="btn-primary">Soumettre la demande (mock)</button>
    </form>
  );
}

function CorrigerDemo({ notify }: { notify: Notify }) {
  const [objet, setObjet] = useState("Achat ordinateurs — corrections demandées");
  const [docs, setDocs] = useState([{ type: "DEVIS_ESTIMATIF", name: "devis-medi.pdf" }]);
  const [newType, setNewType] = useState("SPECIFICATIONS_TECHNIQUES");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Dossier simulé corrigé + resoumis au valideur (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Correction (A_COMPLETER) — replica corriger/[id]</p>
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-800">Motif du rejet (mock) : « Préciser les caractéristiques techniques + joindre un devis estimatif PDF. »</div>
      <Field label="Objet corrigé"><input required className={fieldClass} value={objet} onChange={(e) => setObjet(e.target.value)} /></Field>
      <div>
        <label className={labelClass}>Pièces jointes (PDF uniquement)</label>
        <ul className="space-y-2">
          {docs.map((d, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-black">{d.type}</span>
              <span className="flex-1 truncate">{d.name}</span>
              <button type="button" className="text-red-500" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <select className={fieldClass} value={newType} onChange={(e) => setNewType(e.target.value)}>
            {["SPECIFICATIONS_TECHNIQUES", "TDR_SIMPLIFIE", "DEVIS_ESTIMATIF", "BON_SORTIE_STOCK"].map((o) => <option key={o}>{o}</option>)}
          </select>
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setDocs([...docs, { type: newType, name: "nouveau-doc.pdf" }])}>+ Ajouter (mock)</button>
        </div>
      </div>
      <button className="btn-primary" type="submit">Corriger & resoumettre (mock)</button>
    </form>
  );
}

/* ================= C. Workflow : validation → clôture ================= */

function ValidationDemo({ notify }: { notify: Notify }) {
  const [etape, setEtape] = useState("TECHNIQUE");
  const [decision, setDecision] = useState("FAVORABLE");
  const [commentaire, setCommentaire] = useState("Dossier conforme, visa accordé.");
  const [conformite, setConformite] = useState("CONFORME_STANDARDS");
  const [stock, setStock] = useState("STOCK_INSUFFISANT");
  const [source, setSource] = useState("GAVI");
  const [ligneB, setLigneB] = useState("2.2.1 Matériel informatique");
  const [solde, setSolde] = useState(85000000);
  const cout = 12500000;
  const apres = solde - cout;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (apres < 0) return notify("Décision simulée forcée DEFAVORABLE : solde insuffisant (mock)."); if ((decision === "DEFAVORABLE" || decision === "A_COMPLETER") && !commentaire.trim()) return notify("Échec simulé : commentaire requis en cas de rejet (mock)."); notify(`Décision simulée [${etape}] : ${decision} (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation — replica de ValidationModal.tsx</p>
      <Field label="Étape de validation">
        <select className={fieldClass} value={etape} onChange={(e) => setEtape(e.target.value)}>
          {["HIERARCHIQUE", "TECHNIQUE", "BUDGETAIRE", "PROGRAMMATIQUE", "APPROBATION_FINALE"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      {etape === "TECHNIQUE" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Conformité technique *"><select className={fieldClass} value={conformite} onChange={(e) => setConformite(e.target.value)}>{["CONFORME_STANDARDS", "NON_CONFORME", "A_PRECISER"].map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Vérification stock *"><select className={fieldClass} value={stock} onChange={(e) => setStock(e.target.value)}>{["STOCK_DISPONIBLE", "STOCK_DISPONIBLE_PARTIELLEMENT", "STOCK_INSUFFISANT"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        </div>
      )}
      {etape === "BUDGETAIRE" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Source financement *"><select className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)}>{["SRPS_CS7_FM", "RSS3_GAVI", "FAE", "CDS", "VAR", "PARN2", "PPSB"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Ligne budgétaire *"><input className={fieldClass} value={ligneB} onChange={(e) => setLigneB(e.target.value)} /></Field>
            <Field label="Solde disponible"><input type="number" className={fieldClass} value={solde} onChange={(e) => setSolde(Number(e.target.value))} /></Field>
            <Field label="Solde après engagement (auto)"><input readOnly className={`${fieldClass} ${apres < 0 ? "border-red-400 bg-red-50" : ""}`} value={`${apres.toLocaleString("fr-FR")} Ar`} /></Field>
          </div>
          <p className="text-[12px] font-bold text-slate-500">N° engagement auto : ENG-2026-0417 (si FAVORABLE) — solde &lt; 0 force DEFAVORABLE.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Décision">
          <select className={fieldClass} value={decision} onChange={(e) => setDecision(e.target.value)}>
            {(etape === "PROGRAMMATIQUE" || etape === "APPROBATION_FINALE"
              ? ["APPROUVEE", "A_REVOIR", "REJETEE"]
              : ["FAVORABLE", "A_COMPLETER", "DEFAVORABLE"]
            ).map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Observations (requises si rejet)"><textarea className={textareaClass} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} /></Field>
      </div>
      <button className="btn-primary" type="submit">Valider l&apos;étape (mock)</button>
    </form>
  );
}

function BudgetDemo({ notify }: { notify: Notify }) {
  const [ligne, setLigne] = useState("2.2.1 Matériel informatique");
  const [source, setSource] = useState("RSS3_GAVI");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Imputation simulée : ${ligne} / ${source} (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Imputation budgétaire — replica de BudgetModal</p>
      <Field label="Ligne budgétaire *"><input required className={fieldClass} value={ligne} onChange={(e) => setLigne(e.target.value)} /></Field>
      <Field label="Source de financement *"><select className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)}>{["SRPS_CS7_FM", "RSS3_GAVI", "FAE_GAVI", "CDS_GAVI", "VAR_GAVI", "PARN2_BM", "PPSB_BM"].map((o) => <option key={o}>{o}</option>)}</select></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Subvention (auto)"><input readOnly className={fieldClass} value="MDG-S-MOH-4041" /></Field>
        <Field label="Coût estimé"><input readOnly className={fieldClass} value="12 500 000 Ar" /></Field>
        <Field label="Engagement"><input readOnly className={fieldClass} value="ENG-2026-0417" /></Field>
      </div>
      <button className="btn-primary" type="submit">Enregistrer le budget (mock)</button>
    </form>
  );
}

function PassationDemo({ notify }: { notify: Notify }) {
  const [fournisseur, setFournisseur] = useState("EURL MediDistrib");
  const [date, setDate] = useState("2026-10-20");
  const [montant, setMontant] = useState(12500000);
  const [delai, setDelai] = useState(21);
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Bon de commande simulé : ${fournisseur} — ${montant.toLocaleString("fr-FR")} Ar (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Passation — Bon de commande (replica PassationModal)</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type de procédure"><select className={fieldClass} defaultValue="DEMANDE_COTATION"><option>DEMANDE_COTATION</option><option>BON_COMMANDE_DIRECT</option><option>SELECTION_APRES_COTATION</option></select></Field>
        <Field label="Fournisseur retenu *"><select required className={fieldClass} value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}>{MOCK.fournisseurs.map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="N° bon de commande"><input readOnly className={fieldClass} value="BC-2026-014 (DA→BC auto)" /></Field>
        <Field label="Date du BC *"><input required type="date" min="2026-10-02" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Montant commande *"><input required type="number" className={fieldClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} /></Field>
        <Field label="Délai contractuel (jours) *"><input required type="number" min={0} className={fieldClass} value={delai} onChange={(e) => setDelai(Number(e.target.value))} /></Field>
      </div>
      <button className="btn-primary" type="submit">Émettre le BC (mock)</button>
    </form>
  );
}

function LivraisonDemo({ notify }: { notify: Notify }) {
  const [etat, setEtat] = useState("EN_TRANSIT");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Expédition simulée : ${etat} (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Suivi expédition 8.1 — replica LivraisonModal</p>
      <Field label="État expédition *"><select required className={fieldClass} value={etat} onChange={(e) => setEtat(e.target.value)}><option>EN_TRANSIT</option><option>ARRIVE</option><option>PARTIEL</option><option>RETARD</option></select></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Arrivée prévue"><input type="date" defaultValue="2026-11-05" className={fieldClass} /></Field>
        <Field label="Arrivée effective"><input type="date" defaultValue="2026-11-06" className={fieldClass} /></Field>
      </div>
      <button className="btn-primary" type="submit">Mettre à jour (mock)</button>
    </form>
  );
}

function ReceptionDemo({ notify }: { notify: Notify }) {
  const [qte, setQte] = useState(5);
  const [cqte, setCqte] = useState("CONFORME");
  const [cqual, setCqual] = useState("CONFORME");
  const problem = cqte !== "CONFORME" || cqual !== "CONFORME";
  const [ecart, setEcart] = useState({ type: "MANQUANT", action: "REMPLACEMENT", desc: "1 carton éventré." });
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(problem ? `Réception simulée AVEC ÉCART (${ecart.type} → ${ecart.action}) (mock).` : "Réception simulée définitive (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Réception + écarts + PJ — replica ReceptionModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Date réception *"><input required type="date" defaultValue="2026-11-06" className={fieldClass} /></Field>
        <Field label="Réceptionnaire"><input defaultValue="Service Logistique" className={fieldClass} /></Field>
        <Field label="Qté reçue / 5 *"><input required type="number" className={fieldClass} value={qte} onChange={(e) => setQte(Number(e.target.value))} /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className={labelClass}>Conformité quantité *</label><div className="flex gap-2">{["CONFORME", "PARTIELLE"].map((o) => <button key={o} type="button" onClick={() => setCqte(o)} className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-black ${cqte === o ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{o}</button>)}</div></div>
        <div><label className={labelClass}>Conformité qualité *</label><div className="flex gap-2">{["CONFORME", "NON_CONFORME"].map((o) => <button key={o} type="button" onClick={() => setCqual(o)} className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-black ${cqual === o ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{o}</button>)}</div></div>
      </div>
      {problem && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:grid-cols-2">
          <Field label="Type d'écart *"><select className={fieldClass} value={ecart.type} onChange={(e) => setEcart({ ...ecart, type: e.target.value })}><option>MANQUANT</option><option>DEFECTUEUX</option><option>NON_CONFORME</option><option>HORS_SPECIFICATIONS</option></select></Field>
          <Field label="Action corrective *"><select className={fieldClass} value={ecart.action} onChange={(e) => setEcart({ ...ecart, action: e.target.value })}><option>REMPLACEMENT</option><option>REPARATION</option><option>AVOIR</option><option>REJET</option></select></Field>
          <div className="sm:col-span-2"><Field label="Description écart *"><input required className={fieldClass} value={ecart.desc} onChange={(e) => setEcart({ ...ecart, desc: e.target.value })} /></Field></div>
        </div>
      )}
      <Field label="PJ : Bon de livraison (PDF)"><input type="file" accept=".pdf" className={fieldClass} onChange={() => {}} /></Field>
      <Field label="PJ : PV de réception (PDF)"><input type="file" accept=".pdf" className={fieldClass} onChange={() => {}} /></Field>
      <button className="btn-primary" type="submit">{problem ? "Valider avec écart (mock)" : "Valider définitivement (mock)"}</button>
    </form>
  );
}

function ResolveIssueDemo({ notify }: { notify: Notify }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Écart simulé résolu (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Résolution d&apos;écart — replica ResolveIssueModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de résolution *"><input required type="date" defaultValue="2026-11-10" className={fieldClass} /></Field>
        <Field label="Suivi / solution *"><textarea required defaultValue="Carton remplacé par le fournisseur le 10/11." className={textareaClass} /></Field>
      </div>
      <button className="btn-primary" type="submit">Clôturer l&apos;écart (mock)</button>
    </form>
  );
}

function ClotureDemo({ notify }: { notify: Notify }) {
  const [satis, setSatis] = useState(5);
  const [statut, setStatut] = useState("CLOTURE");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!satis) return notify("Échec simulé : satisfaction requise (mock)."); notify(`Clôture simulée : ${statut}, satisfaction ${satis}/5 (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Clôture finale — replica ClotureModal / ClosureModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de clôture *"><input required type="date" defaultValue="2026-11-12" className={fieldClass} /></Field>
        <Field label="Statut final *"><select className={fieldClass} value={statut} onChange={(e) => setStatut(e.target.value)}><option>CLOTURE</option><option>PARTIELLEMENT_EXECUTE</option><option>ANNULE</option></select></Field>
      </div>
      <div><label className={labelClass}>Satisfaction (1–5) *</label><Stars value={satis} onChange={setSatis} /></div>
      <Field label="Commentaires finaux"><textarea defaultValue="Prestation conforme, délai respecté." className={textareaClass} /></Field>
      <button className="btn-primary" type="submit">Clôturer le dossier (mock)</button>
    </form>
  );
}

/* ================= D. Marchés / DAO ================= */

function ProcurementCreateDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ title: "Fourniture de vaccins — AOI-2026-03", procedure: "AOI", category: "BIENS", deadline: "2026-11-15T12:00", publication: "2026-10-02T09:00", optionKey: "2.2.1 Matériel informatique", status: "PUBLISHED" });
  const [sources, setSources] = useState<string[]>(["GAVI"]);
  const [ateliers, setAteliers] = useState<string[]>(["2026-10-20T10:00"]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (s: string) => setSources((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!sources.length) return notify("Échec simulé : au moins 1 source de financement (mock)."); notify(`Marché simulé publié : ${f.title} (mock).`); }} className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>A — Marché (7 sections) — replica procurementForm + create</p>
      <Field label="Intitulé (Section A) *"><input required className={fieldClass} value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Procédure"><select className={fieldClass} value={f.procedure} onChange={set("procedure")}><option>AOI</option><option>AON</option><option>DC</option><option>GRE_A_GRE</option></select></Field>
        <Field label="Catégorie"><select className={fieldClass} value={f.category} onChange={(e) => { set("category")(e); if (e.target.value !== "SERVICES") setAteliers([]); }}><option>BIENS</option><option>SERVICES</option><option>TRAVAUX</option></select></Field>
        <Field label="Statut"><select className={fieldClass} value={f.status} onChange={set("status")}><option>PUBLISHED</option><option>CANCELLED</option><option>CLOSED</option></select></Field>
      </div>
      <div>
        <label className={labelClass}>Sources de financement (Section B) *</label>
        <div className="flex flex-wrap gap-2">{["FM", "GAVI", "BM"].map((s) => <button key={s} type="button" onClick={() => toggle(s)} className={`rounded-xl border px-4 py-2 text-[12px] font-black ${sources.includes(s) ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{s}</button>)}</div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Libellé budgétaire"><select className={fieldClass} value={f.optionKey} onChange={set("optionKey")}><option>2.1.1 Fournitures bureau</option><option>2.2.1 Matériel informatique</option><option>3.1.1 Services</option></select></Field>
        <Field label="Code projet (auto)"><input readOnly className={fieldClass} value="MDG-S-MOH-4041" /></Field>
        <Field label="Publication"><input type="datetime-local" className={fieldClass} value={f.publication} onChange={set("publication")} /></Field>
        <Field label="Date limite"><input type="datetime-local" className={fieldClass} value={f.deadline} onChange={set("deadline")} /></Field>
      </div>
      {f.category === "SERVICES" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className={labelClass}>Dates d&apos;atelier (SERVICES uniquement)</label>
          {ateliers.map((a, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input type="datetime-local" className={fieldClass} value={a} onChange={(e) => setAteliers(ateliers.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" className="rounded-xl border border-slate-200 px-3" onClick={() => setAteliers(ateliers.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold" onClick={() => setAteliers([...ateliers, "2026-10-25T10:00"])}>+ Ajouter une date</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Dossiers techniques (PDF ×n)"><input type="file" accept=".pdf" multiple className={fieldClass} onChange={() => {}} /></Field>
        <Field label="Annexes (max 5)"><input type="file" multiple className={fieldClass} onChange={() => {}} /></Field>
        <Field label="Modèle de soumission (.docx)"><input type="file" accept=".docx" className={fieldClass} onChange={() => {}} /></Field>
      </div>
      <button className="btn-primary" type="submit">Publier le marché (mock)</button>
    </form>
  );
}

function ProcurementUpdateDemo({ notify }: { notify: Notify }) {
  const [title, setTitle] = useState("Fourniture de vaccins — AOI-2026-03 (v2)");
  const [deleted, setDeleted] = useState<string[]>([]);
  const docs = ["DAO-complet.pdf", "annexe-prix.xlsx"];
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Marché simulé mis à jour (${deleted.length} PJ supprimée(s)) (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Édition marché — replica procurementUpdateForm + [id]/update</p>
      <Field label="Intitulé *"><input required className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div>
        <label className={labelClass}>Pièces actuelles (cocher = supprimer → deletedAnnexIds[])</label>
        {docs.map((d) => (
          <label key={d} className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
            <span>📎 {d} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px]">ACTUEL</span></span>
            <input type="checkbox" checked={deleted.includes(d)} onChange={() => setDeleted((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))} className="h-4 w-4 accent-red-500" />
          </label>
        ))}
      </div>
      <Field label="Nouveaux fichiers"><input type="file" multiple className={fieldClass} onChange={() => {}} /></Field>
      <button className="btn-primary" type="submit">Enregistrer les modifications (mock)</button>
    </form>
  );
}

function PpmpGridDemo({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState<"works" | "goods" | "consultants">("goods");
  const [rows, setRows] = useState([
    { title: "Ordinateurs de bureau (25)", method: "AON", amount: "62 500 000", status: "En cours dans le temps" },
    { title: "Réhabilitation CSB II", method: "AOI", amount: "860 500 000", status: "Non démarré dans le temps" },
  ]);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Planning passation PPMP — replica personnel/formulaire (GridTable)</p>
      <div className="flex flex-wrap items-center gap-2">
        {(["works", "goods", "consultants"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-[12px] font-black ${tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{t === "works" ? "Travaux" : t === "goods" ? "Biens" : "Consultance"}</button>
        ))}
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black">{rows.length} marchés — Total {(923000000).toLocaleString("fr-FR")} Ar</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
            <tr><th className="px-4 py-3">Intitulé</th><th className="px-4 py-3">Méthode</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-2"><input className={fieldClass} value={r.title} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></td>
                <td className="px-4 py-2"><select className={fieldClass} value={r.method} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}><option>AON</option><option>AOI</option><option>DC</option><option>ED</option></select></td>
                <td className="px-4 py-2 font-bold">{r.amount}</td>
                <td className="px-4 py-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{r.status}</span></td>
                <td className="px-4 py-2"><button type="button" className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600" onClick={() => setShowPwd(true)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPwd && (
        <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <input type="password" placeholder="Mot de passe requis (mock)" className={fieldClass} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <button type="button" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white" onClick={() => { setShowPwd(false); setPwd(""); notify("Suppression simulée autorisée par mot de passe (mock)."); }}>Confirmer</button>
        </div>
      )}
      <button type="button" className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold" onClick={() => { setRows([...rows, { title: "Nouvelle ligne _new_", method: "DC", amount: "0", status: "Brouillon" }]); notify("Ligne simulée ajoutée (mock)."); }}>+ Ajouter une ligne (mock)</button>
    </div>
  );
}

function PublicListDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = MOCK.marches.filter((m) => (m.ref + m.title).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>DAO publics — replica procurement (liste + détail [id])</p>
      <div className="flex gap-2">
        <input placeholder="Recherche titre / référence / code…" className={fieldClass} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setQ("")}>Effacer</button>
      </div>
      {list.map((m) => (
        <div key={m.ref} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] font-black text-white">{m.ref}</span>
            <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">Réponse sous 5 j</span>
            <span className="ml-auto text-[11px] font-bold text-red-600">⏳ Limite : {m.deadline}</span>
          </div>
          <p className="mt-2 font-black text-slate-900">{m.title}</p>
          <p className="text-[12px] font-semibold text-slate-500">{m.montant} — Bailleur GAVI (MDG-S-MOH-4041)</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify(`DAO complet simulé téléchargé (${m.ref}) (mock).`)}>Télécharger DAO complet</button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold" onClick={() => notify(`Fiche simulée ouverte : ${m.ref} — §§ Caractéristiques / Financement / Calendrier / PJ (mock).`)}>Voir la fiche [id]</button>
          </div>
        </div>
      ))}
      {list.length === 0 && <p className="text-sm font-semibold text-slate-400">Aucun DAO (mock).</p>}
      <div className="flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">← Précédent</button>
        <span className="text-[12px] font-black">Page {page} — 10 / page (mock)</span>
        <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Suivant →</button>
      </div>
    </div>
  );
}

/* ================= E. Séances d'ouverture ================= */

function SeanceNewDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ ref: "DAO-2026-011", objet: "Ouverture AOI vaccins", statut: "BROUILLON", date: "2026-10-10", heure: "10:00", lieu: "Salle UCP", president: "Mme Rabe (Présidente)", obs: "Séance publique." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [members, setMembers] = useState("A. Rakoto — a.rakoto@ucp.mg — CIN 101234567890\nB. Rabe — b.rabe@ucp.mg — CIN 101234567891\nC. Randria — c.randria@ucp.mg — CIN 101234567892");
  return (
    <form onSubmit={(e) => { e.preventDefault(); const n = members.split("\n").filter(Boolean).length; if (n < 3) return notify(`Échec simulé : commission incomplète (${n}/3 min) (mock).`); notify(`Séance simulée créée : ${f.ref} (${n} membres) (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Nouvelle séance — replica ouverture_offre/new</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Référence dossier *"><input required className={fieldClass} value={f.ref} onChange={set("ref")} /></Field>
        <Field label="Objet *"><input required className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Statut"><select className={fieldClass} value={f.statut} onChange={set("statut")}><option>BROUILLON</option><option>PRET</option><option>EN_VALIDATION</option></select></Field>
        <Field label="Date"><input type="date" min="2026-10-02" className={fieldClass} value={f.date} onChange={set("date")} /></Field>
        <Field label="Heure"><input type="time" className={fieldClass} value={f.heure} onChange={set("heure")} /></Field>
        <Field label="Lieu"><input className={fieldClass} value={f.lieu} onChange={set("lieu")} /></Field>
        <Field label="Président"><input className={fieldClass} value={f.president} onChange={set("president")} /></Field>
        <Field label="Observations"><textarea className={textareaClass} value={f.obs} onChange={set("obs")} /></Field>
      </div>
      <Field label="Membres de commission (≥ 3 requis)"><textarea required className={textareaClass} value={members} onChange={(e) => setMembers(e.target.value)} /></Field>
      <button className="btn-primary" type="submit">Créer la séance (mock)</button>
    </form>
  );
}

function MembresDemo({ notify }: { notify: Notify }) {
  const [rows, setRows] = useState([
    { nom: "A. Rakoto", email: "a.rakoto@ucp.mg", cin: "101234567890", poste: "Passation", entite: "UCP" },
    { nom: "B. Rabe", email: "b.rabe@ucp.mg", cin: "101234567891", poste: "Finance", entite: "UCP" },
    { nom: "C. Randria", email: "c.randria@ucp.mg", cin: "101234567892", poste: "Logistique", entite: "UCP" },
  ]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Composition simulée enregistrée FINALE (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Membres des commissions — replica ouverture_offre/membres</p>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-5">
          <input className={fieldClass} value={r.nom} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} placeholder="Nom *" />
          <input type="email" className={fieldClass} value={r.email} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} placeholder="Email *" />
          <input className={fieldClass} value={r.cin} maxLength={12} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, cin: e.target.value.replace(/\D/g, "") } : x)))} placeholder="CIN 12 chiffres *" />
          <input className={fieldClass} value={r.poste} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, poste: e.target.value } : x)))} placeholder="Poste *" />
          <input className={fieldClass} value={r.entite} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, entite: e.target.value } : x)))} placeholder="Entité *" />
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => { setRows([...rows, { nom: "", email: "", cin: "", poste: "", entite: "" }]); }}>+ Membre</button>
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => notify("Brouillon simulé sauvegardé (localStorage mock).")}>Sauver brouillon</button>
        <button type="submit" className="btn-primary">Enregistrer final (mock)</button>
      </div>
    </form>
  );
}

function ValidationPubliqueDemo({ notify }: { notify: Notify }) {
  const [role, setRole] = useState<"membre" | "president">("membre");
  const [decision, setDecision] = useState("VALIDER");
  const [comment, setComment] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (decision !== "VALIDER" && !comment.trim()) return notify("Échec simulé : commentaire requis pour REJETER/REPORTER (mock)."); notify(`Décision publique simulée : ${decision} (${role}) (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation publique — replica validation/[id] (lien e-mail, sans JWT)</p>
      <div className="flex gap-3">
        {(["membre", "president"] as const).map((r) => (
          <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${role === r ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"}`}>
            <input type="radio" checked={role === r} onChange={() => { setRole(r); setDecision(r === "president" ? "APPROUVER" : "VALIDER"); }} />{r}
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email *"><input required type="email" defaultValue="membre@commission.mg" className={fieldClass} /></Field>
        <Field label="Mot de passe reçu *"><input required type="password" defaultValue="demo1234" className={fieldClass} /></Field>
      </div>
      <Field label="Décision">
        <select className={fieldClass} value={decision} onChange={(e) => setDecision(e.target.value)}>
          {role === "membre" ? ["VALIDER", "REJETER"].map((o) => <option key={o}>{o}</option>) : ["APPROUVER", "REPORTER", "REJETER"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      {decision === "REPORTER" && <Field label="Date de report *"><input required type="date" min="2026-10-02" className={fieldClass} /></Field>}
      <Field label="Observation (requise si rejet/report)"><textarea className={textareaClass} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      <button className="btn-primary" type="submit">Signer & soumettre (mock)</button>
    </form>
  );
}

function ValidationCompositionDemo({ notify }: { notify: Notify }) {
  const [filter, setFilter] = useState("ACTION_REQUIRED");
  const [comment, setComment] = useState("");
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation composition — replica validation-membres (RPM/GP/CN)</p>
      <div className="flex gap-2">{["ALL", "ACTION_REQUIRED", "URGENT", "ARCHIVED"].map((f) => <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-xl px-3 py-1.5 text-[11px] font-black ${filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{f}</button>)}</div>
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="font-black">SE-2026-011 — AOI vaccins <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">À VALIDER</span></p>
        <p className="text-[12px] font-semibold text-slate-500">3 membres + présidente — CIN vérifiés (mock)</p>
        <Field label="Commentaire (min 5 caractères si rejet)"><textarea className={textareaClass} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
        <div className="mt-2 flex gap-2">
          <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white" onClick={() => notify("Composition simulée VALIDÉE (mock).")}>Valider la composition</button>
          <button type="button" className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600" onClick={() => { if (comment.trim().length < 5) return notify("Échec simulé : motif ≥ 5 caractères requis (mock)."); notify("Composition simulée RENVOYÉE pour modification (mock)."); }}>Demander modification</button>
        </div>
      </div>
    </div>
  );
}

/* ================= F. Évaluation ================= */

function EvalWizardDemo({ notify }: { notify: Notify }) {
  const [step, setStep] = useState(2);
  const [pre, setPre] = useState<Record<string, string>>({ offre_signee: "Oui", garantie_conforme: "Oui", dossier_admin_complet: "Oui", validite_conforme: "Oui", conditions_acceptees: "Oui" });
  const [notes, setNotes] = useState([4, 3.5, 4.5]);
  const [fin, setFin] = useState({ lu: 48500000, corrections: -600000, rabais: 0 });
  const [reco, setReco] = useState("ATTRIBUER");
  const final = fin.lu + fin.corrections - fin.rabais;
  const techScore = Math.round((notes.reduce((a, b) => a + b, 0) / (notes.length * 5)) * 100);
  const blocked = Object.values(pre).includes("Non");
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Wizard 6 étapes — replica EvaluationWizardForm (double aveugle)</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">N° AOI-2026-03 — Soumissionnaire : EURL MediDistrib — Lot 1 — NIF 5001234 — Évaluateurs : 3 — Date : 20/11/2026</div>
      <div className="flex flex-wrap gap-2">
        {["1. Ident.", "2. Préliminaire", "3. Technique", "4. Financière", "5. Score", "6. Conclusion"].map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i + 1)} className={`rounded-xl px-3 py-1.5 text-[11px] font-black ${step === i + 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>
        ))}
      </div>
      {step === 2 && (
        <div className="space-y-2">
          {Object.keys(pre).map((c) => (
            <div key={c} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
              <span>{c.replace(/_/g, " ")}</span>
              <div className="flex gap-2">{["Oui", "Non"].map((v) => <button key={v} type="button" onClick={() => setPre({ ...pre, [c]: v })} className={`rounded-lg px-3 py-1 text-[12px] font-black ${pre[c] === v ? (v === "Oui" ? "bg-emerald-600 text-white" : "bg-red-600 text-white") : "bg-slate-100"}`}>{v}</button>)}</div>
            </div>
          ))}
          {blocked && <p className="rounded-xl bg-red-50 px-4 py-2 text-[12px] font-black text-red-700">⛔ Un « Non » bloque la suite (mock) — offre non conforme.</p>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-40 text-[12px] font-bold">Critère C{i + 1} (pond. {i === 0 ? 40 : i === 1 ? 35 : 25}%)</span>
              <input type="number" min={0} max={5} step={0.5} value={n} onChange={(e) => setNotes(notes.map((x, j) => (j === i ? Number(e.target.value) : x)))} className={`${fieldClass} max-w-[120px]`} />
              <span className="text-[12px] font-bold text-slate-400">/ 5</span>
            </div>
          ))}
          <p className="text-sm font-black">Score technique : {techScore}/100 — seuil 70 {techScore >= 70 ? "✓ QUALIFIÉ" : "✗ ÉLIMINÉ"}</p>
        </div>
      )}
      {step === 4 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Montant lu *"><input type="number" className={fieldClass} value={fin.lu} onChange={(e) => setFin({ ...fin, lu: Number(e.target.value) })} /></Field>
          <Field label="Corrections"><input type="number" className={fieldClass} value={fin.corrections} onChange={(e) => setFin({ ...fin, corrections: Number(e.target.value) })} /></Field>
          <Field label="Rabais"><input type="number" className={fieldClass} value={fin.rabais} onChange={(e) => setFin({ ...fin, rabais: Number(e.target.value) })} /></Field>
          <p className="font-black sm:col-span-3">Montant final : {final.toLocaleString("fr-FR")} Ar — Score financier : 96/100 (moins-disant / final)</p>
        </div>
      )}
      {step === 5 && <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Score final = 60% technique + 40% financier</p><p className="mt-1 text-3xl font-black">{Math.round(techScore * 0.6 + 96 * 0.4)}/100</p></div>}
      {step === 6 && (
        <div className="space-y-3">
          <Field label="Recommandation"><select className={fieldClass} value={reco} onChange={(e) => setReco(e.target.value)}><option>ATTRIBUER</option><option>REJETER</option><option>RELANCER</option></select></Field>
          <Field label="Justification"><textarea defaultValue="Offre conforme, mieux-disante technique et financière." className={textareaClass} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" /> Déclaration d&apos;absence de conflit (OUI requis)</label>
          <Field label="Signature (mot de passe) *"><input required type="password" defaultValue="eval2026" className={fieldClass} /></Field>
        </div>
      )}
      <div className="flex gap-2">
        {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold">Précédent</button>}
        {step < 6
          ? <button type="button" onClick={() => { if (step === 2 && blocked) return notify("Passage simulé refusé : offre non conforme (mock)."); setStep(step + 1); }} className="btn-primary">Enregistrer & continuer (+ mot de passe mock)</button>
          : <button type="button" onClick={() => notify(`Évaluation simulée transmise : ${reco} (mock). Consensus requis : 3 évaluateurs, écart < 15 pts.`)} className="btn-primary">Transmettre ({reco})</button>}
      </div>
    </div>
  );
}

function EvalLegacyDemo({ notify }: { notify: Notify }) {
  const [justif, setJustif] = useState("Offre conforme sur tous les critères.");
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Évaluation 4 étapes — replica EvaluationForm (legacy accordéon)</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {["Offre signée", "Garantie conforme", "Dossier administratif", "Validité de l'offre"].map((c) => (
          <label key={c} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><span>{c}</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" /></label>
        ))}
      </div>
      <Field label="Justification (min 10 caractères) *"><textarea required minLength={10} className={textareaClass} value={justif} onChange={(e) => setJustif(e.target.value)} /></Field>
      <button type="button" className="btn-primary" onClick={() => { if (justif.trim().length < 10) return notify("Échec simulé : justification ≥ 10 caractères (mock)."); notify("Évaluation legacy simulée sauvegardée (mock)."); }}>Sauvegarder (mock)</button>
    </div>
  );
}

function AssignDemo({ notify }: { notify: Notify }) {
  const [evalList, setEvalList] = useState([
    { nom: "Dr H. Randria", cin: "101234567890", entite: "UCP", poste: "Expert", email: "h.randria@ucp.mg" },
    { nom: "M. T. Rakoto", cin: "201234567891", entite: "Santé", poste: "Pharmacien", email: "t.rakoto@sante.mg" },
    { nom: "Mme S. Rabe", cin: "301234567892", entite: "UCP", poste: "Financière", email: "s.rabe@ucp.mg" },
  ]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("3 évaluateurs simulés assignés + invitations envoyées (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Assignation 3 évaluateurs — replica [id]/assign</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">DAO AOI-2026-03 — 4 offres — Limite 15/11 — Budget : R. Randria</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date d'évaluation *"><input required type="date" defaultValue="2026-11-20" className={fieldClass} /></Field>
        <Field label="Heure *"><input required type="time" defaultValue="09:00" className={fieldClass} /></Field>
      </div>
      {evalList.map((ev, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-5">
          <input required className={fieldClass} value={ev.nom} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} placeholder="Nom *" />
          <input required className={fieldClass} value={ev.cin} maxLength={12} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, cin: e.target.value.replace(/\D/g, "") } : x)))} placeholder="CIN 12 *" />
          <input required className={fieldClass} value={ev.entite} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, entite: e.target.value } : x)))} placeholder="Entité *" />
          <input required className={fieldClass} value={ev.poste} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, poste: e.target.value } : x)))} placeholder="Poste *" />
          <input required type="email" className={fieldClass} value={ev.email} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} placeholder="Email *" />
        </div>
      ))}
      <button className="btn-primary" type="submit">Envoyer les accès (mock)</button>
    </form>
  );
}

function OffresClassementDemo({ notify }: { notify: Notify }) {
  const offres = [
    { soum: "EURL MediDistrib", montant: "47 900 000 Ar", total: 89, tech: 85, fin: 96, statut: "VALIDÉE" },
    { soum: "Vakinankaratra SARL", montant: "52 400 000 Ar", total: 81, tech: 78, fin: 87, statut: "VALIDÉE" },
    { soum: "Miaro Conseil", montant: "44 100 000 Ar", total: 64, tech: 58, fin: 100, statut: "ÉLIMINÉE (tech < 70)" },
  ];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Offres + Classement final — replica dao/[seanceId]/offres + classement</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Rang</th><th className="px-4 py-3">Soumissionnaire</th><th className="px-4 py-3">Total /100</th><th className="px-4 py-3">Tech.</th><th className="px-4 py-3">Fin.</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody>
            {offres.map((o, i) => (
              <tr key={o.soum} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black">{i + 1}</td>
                <td className="px-4 py-2 font-bold">{o.soum}<br /><span className="font-semibold text-slate-400">{o.montant}</span></td>
                <td className="px-4 py-2 font-black">{o.total}</td>
                <td className="px-4 py-2">{o.tech}</td>
                <td className="px-4 py-2">{o.fin}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${o.statut.includes("VALID") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{o.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-primary" onClick={() => notify("Contrat simulé créé depuis le rang 1 (mock → /contractualisation/new).")}>Créer le contrat (rang 1) — mock</button>
    </div>
  );
}

/* ================= G. TDR / ST ================= */

function TdrNewDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ unite: "SUIVI_EVALUATION", type: "TDR", categorie: "FORMATION", procedure: "DC", intitule: "TDR — Formation logistique 40 agents", ptba: "PTBA-2026-A1", debut: "2026-11-01", fin: "2026-12-15", duree: 6, uniteD: "JOURS", source: "GAVI", ligne: "3.1.1 Services", montant: 15000 });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`${f.type} simulé enregistré en brouillon (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Nouveau / Modifier TDR-ST — replica TdrSt/new (?demandeId&docType)</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Unité technique *"><input required className={fieldClass} value={f.unite} onChange={set("unite")} /></Field>
        <Field label="Type de document *"><select className={fieldClass} value={f.type} onChange={set("type")}><option>TDR</option><option>ST</option></select></Field>
        <Field label="Catégorie d'activité *"><select className={fieldClass} value={f.categorie} onChange={set("categorie")}><option>FORMATION</option><option>ATELIER</option><option>ETUDE</option><option>CONSULTANT</option><option>BIENS</option><option>TRAVAUX</option></select></Field>
        <Field label="Procédure envisagée *"><select className={fieldClass} value={f.procedure} onChange={set("procedure")}><option>DC</option><option>AOI</option><option>AON</option><option>GRE_A_GRE</option></select></Field>
      </div>
      <Field label="Intitulé *"><textarea required rows={2} className={textareaClass} value={f.intitule} onChange={set("intitule")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Réf. PTBA *"><input required className={fieldClass} value={f.ptba} onChange={set("ptba")} /></Field>
        <Field label="Début *"><input required type="date" className={fieldClass} value={f.debut} onChange={set("debut")} /></Field>
        <Field label="Fin *"><input required type="date" min={f.debut} className={fieldClass} value={f.fin} onChange={set("fin")} /></Field>
        <Field label="Durée *"><input required type="number" min={1} className={fieldClass} value={f.duree} onChange={(e) => setF({ ...f, duree: Number(e.target.value) })} /></Field>
        <Field label="Unité"><select className={fieldClass} value={f.uniteD} onChange={set("uniteD")}><option>JOURS</option><option>MOIS</option></select></Field>
        <Field label="Montant estimé (USD) *"><input required type="number" min={0} step="0.01" className={fieldClass} value={f.montant} onChange={(e) => setF({ ...f, montant: Number(e.target.value) })} /></Field>
        <Field label="Famille financement *"><select className={fieldClass} value={f.source} onChange={set("source")}><option>FM</option><option>GAVI</option><option>BM</option></select></Field>
        <Field label="Ligne budgétaire *"><input required className={fieldClass} value={f.ligne} onChange={set("ligne")} /></Field>
        <Field label="Subvention (auto)"><input readOnly className={fieldClass} value="MDG-S-MOH-4041" /></Field>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold">Créer brouillon (mock)</button>
        <button type="button" className="btn-primary" onClick={() => notify(`${f.type} simulé ENVOYÉ en validation (mock).`)}>Enregistrer & envoyer (mock)</button>
      </div>
    </form>
  );
}

function TdrSuiviDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const [obs, setObs] = useState("");
  const docs = [
    { num: "TDR-2026-07", title: "Formation logistique", statut: "SOUMIS", type: "TDR" },
    { num: "ST-2026-04", title: "Spécifications ordinateurs", statut: "EN_VALIDATION", type: "ST" },
    { num: "TDR-2026-02", title: "Étude CSB", statut: "VALIDE", type: "TDR" },
  ].filter((d) => (d.num + d.title).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Suivi TDR/ST — replica TdrSt/formulaire (rôles + décisions)</p>
      <input placeholder="Recherche n° / intitulé / PTBA… (auditeur/admin)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      {docs.map((d) => (
        <div key={d.num} className="rounded-2xl border border-slate-200 p-4">
          <p className="font-black">{d.num} — {d.title} <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{d.statut}</span></p>
          <Field label="Observations"><textarea className={textareaClass} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observations techniques / finales…" /></Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify(`Décision simulée FAVORABLE/APPROUVÉ pour ${d.num} (mock).`)}>Favorable / Approuver</button>
            <button type="button" className="rounded-xl border border-amber-300 px-4 py-2 text-[12px] font-bold text-amber-700" onClick={() => notify(`Document simulé renvoyé À REVOIR : ${d.num} (mock).`)}>À revoir / Rejeter</button>
          </div>
        </div>
      ))}
      {docs.length === 0 && <p className="text-sm text-slate-400">Aucun document (mock).</p>}
    </div>
  );
}

/* ================= H. Contractualisation ================= */

function ContratInitDemo({ notify }: { notify: Notify }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Contrat simulé auto-créé depuis le rang 1 (mock → /contractualisation/CTR-2026-09)."); }} className={`${cardClass} mx-auto max-w-md space-y-4 text-center`}>
      <p className={sectionTitleClass}>Init contrat NOTI5 — replica contractualisation/new</p>
      <Field label="Séance (?seance_id=…) *"><input required defaultValue="SE-2026-011" className={`${fieldClass} font-mono`} /></Field>
      <Field label="Offre (?offre_id=… — sinon rang 1 auto)"><input defaultValue="rang 1 : EURL MediDistrib (auto)" className={fieldClass} /></Field>
      <button className="btn-primary w-full" type="submit">Créer le contrat (mock)</button>
    </form>
  );
}

function ContratDossierDemo({ notify }: { notify: Notify }) {
  const [email, setEmail] = useState("prestataire@entreprise.mg");
  const [echeances, setEcheances] = useState([
    { etape: "Avance de démarrage (30%)", montant: 14370000, pct: 30, date: "2026-12-01" },
    { etape: "Livraison finale (70%)", montant: 33530000, pct: 70, date: "2027-02-15" },
  ]);
  const totalPct = echeances.reduce((s, e) => s + e.pct, 0);
  const [etape, setEtape] = useState("Réception provisoire (20%)");
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Dossier contractuel NOTI5 (5 sections) — replica contractualisation/[id]</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-semibold">S1 — N° CTR-2026-09 — AOI — « Fourniture de vaccins » (lecture seule mock)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prestataire (auto)"><input readOnly className={fieldClass} value="EURL MediDistrib — NIF 5001234" /></Field>
        <Field label="E-mail prestataire *"><input required type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Date de signature"><input type="date" defaultValue="2026-12-01" className={fieldClass} /></Field>
        <Field label="Durée d'exécution"><input defaultValue="90 jours" className={fieldClass} /></Field>
      </div>
      <Field label="Clauses particulières"><textarea defaultValue="Pénalités de retard 1/1000 par jour." className={textareaClass} /></Field>
      <div>
        <label className={labelClass}>S4 — Échéancier (total doit = 100% — actuel : {totalPct}%)</label>
        {echeances.map((ec, i) => (
          <div key={i} className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-bold">
            <span className="flex-1">{ec.etape}</span><span>{ec.montant.toLocaleString("fr-FR")} Ar</span><span>{ec.pct}%</span>
            <button type="button" className="text-red-500" onClick={() => setEcheances(echeances.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input className={fieldClass} value={etape} onChange={(e) => setEtape(e.target.value)} placeholder="Étape" />
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setEcheances([...echeances, { etape, montant: 5000000, pct: 10, date: "2027-01-15" }])}>+ Ajouter</button>
        </div>
      </div>
      <Field label="S5 — Document contractuel (PDF, max 50 Mo, ≥1 requis)"><input type="file" accept=".pdf" className={fieldClass} onChange={() => {}} /></Field>
      <div className="flex gap-2">
        <button type="button" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold" onClick={() => notify("Brouillon simulé sauvegardé (mock).")}>Sauver brouillon</button>
        <button type="button" className="btn-primary" onClick={() => { if (!email.includes("@")) return notify("Échec simulé : e-mail prestataire requis (mock)."); if (totalPct !== 100) return notify(`Échec simulé : échéancier = ${totalPct}% (100% requis) (mock).`); notify(`Contrat simulé ENVOYÉ à ${email} (mock).`); }}>Envoyer au prestataire (mock)</button>
      </div>
    </div>
  );
}

/* ================= I. Espaces métier & filtres ================= */

function EspacesDemo({ notify }: { notify: Notify }) {
  const [scope, setScope] = useState("mine");
  const [mode, setMode] = useState("status");
  const [q, setQ] = useState("");
  const [fin, setFin] = useState<string[]>(["GAVI"]);
  const rows = [
    { num: "DA-2026-014", objet: "Ordinateurs de bureau", espace: "validation", etape: "TECHNIQUE", montant: "12 500 000 Ar" },
    { num: "DA-2026-011", objet: "Formation 40 agents", espace: "passation", etape: "VALIDEE_BUDGETAIRE", montant: "68 250 000 Ar" },
    { num: "DA-2026-009", objet: "Vaccins chaîne de froid", espace: "logistique", etape: "EN_COMMANDE", montant: "1 240 000 000 Ar" },
  ].filter((r) => (r.num + r.objet + r.etape).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Espaces Validation / Passation / Logistique-Marché — filtres partagés</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{["mine", "all"].map((s) => <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${scope === s ? "bg-white shadow" : "text-slate-500"}`}>{s === "mine" ? "Mes dossiers" : "Tous"}</button>)}</div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{["status", "table"].map((s) => <button key={s} type="button" onClick={() => setMode(s)} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${mode === s ? "bg-white shadow" : "text-slate-500"}`}>{s === "status" ? "Vue statut" : "Vue tableau"}</button>)}</div>
        <div className="flex gap-1">{["FM", "GAVI", "BM"].map((s) => <button key={s} type="button" onClick={() => setFin((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))} className={`rounded-xl border px-3 py-1.5 text-[11px] font-black ${fin.includes(s) ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{s}</button>)}</div>
      </div>
      <input placeholder="Recherche n° / objet / étape / statut… (mock)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-[11px] font-bold text-slate-400">Scope={scope} — Mode={mode} — Financements=[{fin.join(", ") || "—"}] — {rows.length} résultat(s) (mock)</p>
      {rows.map((r) => (
        <div key={r.num} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <span className="font-mono text-[12px] font-black">{r.num}</span>
          <span className="text-sm font-bold">{r.objet}</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{r.etape}</span>
          <span className="ml-auto text-[12px] font-bold">{r.montant}</span>
          <button type="button" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Action simulée ouverte : ${r.num} (${r.espace}) (mock).`)}>Action</button>
        </div>
      ))}
    </div>
  );
}

/* ================= J. Dashboards analytiques ================= */

function DashGlobalDemo() {
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Dashboard global passations — replica personnel/dashboard (donuts)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Kpi label="Total Marchés" value="47" sub="tous types (mock)" accent="#10b981" />
        <Kpi label="Montant total" value="12,4 Mds MGA" sub="estimé cumulé (mock)" accent="#f59e0b" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { t: "Travaux", c: "#1f9d8b", m: [{ label: "AOI", value: 8, color: "#7ea9d4" }, { label: "AON", value: 5, color: "#5bd06a" }, { label: "DC", value: 3, color: "#acae6b" }] },
          { t: "Biens", c: "#ef8d32", m: [{ label: "AON", value: 10, color: "#5bd06a" }, { label: "DC", value: 7, color: "#acae6b" }, { label: "ED", value: 2, color: "#b16bcc" }] },
          { t: "Consultance", c: "#4b5563", m: [{ label: "SCI", value: 6, color: "#f472b6" }, { label: "SMC", value: 4, color: "#f59e0b" }, { label: "ED", value: 2, color: "#b16bcc" }] },
        ].map((g) => (
          <div key={g.t} className="rounded-2xl border border-slate-200 p-4">
            <p className="font-black uppercase" style={{ color: g.c }}>{g.t}</p>
            <DonutCSS segments={g.m} size={120} />
            <p className="mt-2 text-center text-[11px] font-bold text-slate-400">Méthode (g.) / Statut : 62% dans les temps (mock)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashDemandeRadarDemo({ notify }: { notify: Notify }) {
  const [page, setPage] = useState(1);
  const sections = [
    ["En préparation", 4], ["Valid. hiérarchique", 3], ["Valid. technique", 2], ["Valid. budgétaire", 3],
    ["Valid. programmatique", 1], ["Approbation finale", 1], ["À corriger", 2], ["En passation", 3],
    ["En livraison", 2], ["Réception", 2], ["À clôturer", 2], ["Archives", 9],
  ] as const;
  const rows = [
    ["DA-2026-014", "Ordinateurs de bureau", "TECHNIQUE"],
    ["DA-2026-011", "Formation 40 agents", "VALIDEE_BUDGETAIRE"],
    ["DA-2026-009", "Vaccins chaîne de froid", "EN_COMMANDE"],
    ["DA-2026-007", "Réhabilitation CSB II", "LIVREE"],
    ["DA-2026-003", "Audit financier", "CLOTUREE"],
  ];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Radar demande-achat — replica demande-achat/dashboard (12 sections)</p>
      <div className="flex flex-wrap gap-1.5">
        {sections.map(([s, n]) => <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{s} · {n}</span>)}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[600px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Numéro</th><th className="px-4 py-3">Intitulé</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Action</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-slate-100"><td className="px-4 py-2 font-mono font-black">{r[0]}</td><td className="px-4 py-2 font-bold">{r[1]}</td><td className="px-4 py-2"><span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{r[2]}</span></td><td className="px-4 py-2"><button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Détail simulé : ${r[0]} — timeline BROUILLON → CLOTUREE (mock).`)}>Détail</button></td></tr>)}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">←</button>
        <span className="text-[12px] font-black">Page {page} — 5 / page (mock)</span>
        <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">→</button>
      </div>
    </div>
  );
}

function DashTdrDemo() {
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Analytics TDR/ST — replica TdrSt/dashboard (KPI + bar/pie/radar)</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Docs ce mois" value="18" sub="▲ +12% (mock)" accent="#10b981" />
        <Kpi label="Délai moyen" value="6,2 j" sub="seuil 10 j (mock)" accent="#f59e0b" />
        <Kpi label="Validés" value="42" sub="▲ +8% (mock)" accent="#3b82f6" />
        <Kpi label="En attente" value="7" sub="▼ −3 (mock)" accent="#ef4444" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4"><p className="mb-2 text-[11px] font-black uppercase text-slate-500">Docs / mois (bar)</p><Bars data={[{ label: "J", value: 8 }, { label: "F", value: 12 }, { label: "M", value: 9 }, { label: "A", value: 14 }, { label: "M", value: 18 }, { label: "J", value: 11 }]} /></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="mb-2 text-[11px] font-black uppercase text-slate-500">Par type (donut)</p><DonutCSS size={120} segments={[{ label: "TDR", value: 34, color: "#10b981" }, { label: "ST", value: 22, color: "#3b82f6" }]} /></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="mb-2 text-[11px] font-black uppercase text-slate-500">Par source (radar→bar mock)</p><Bars color="#8b5cf6" data={[{ label: "FM", value: 20 }, { label: "GAVI", value: 26 }, { label: "BM", value: 10 }]} /></div>
      </div>
      <p className="text-[12px] font-semibold text-slate-400">Total année : 56 — Taux validation : 75% — 3 sources (mock). Bouton « Actualiser » (mock).</p>
    </div>
  );
}

function DashLogAdminDemo({ notify }: { notify: Notify }) {
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Admin DAO performance — replica log-dashboard (traçabilité)</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Consultations" value="1 284" sub="vues totales (mock)" accent="#3b82f6" />
        <Kpi label="Téléch. DAO" value="462" sub="dossiers complets (mock)" accent="#8b5cf6" />
        <Kpi label="Conversion" value="36,0%" sub="downloads/vues (mock)" accent="#ec4899" />
        <Kpi label="Clôture" value="68%" sub="dossiers finalisés (mock)" accent="#10b981" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4"><p className="mb-2 text-[11px] font-black uppercase text-slate-500">Consultations / DAO (ViewsChart mock)</p><Bars color="#3b82f6" data={[{ label: "AOI3", value: 320 }, { label: "AON7", value: 410 }, { label: "DC11", value: 180 }, { label: "AOI9", value: 240 }, { label: "AON2", value: 134 }]} /></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="mb-2 text-[11px] font-black uppercase text-slate-500">Téléchargements / DAO (donut mock)</p><DonutCSS size={120} segments={[{ label: "AOI-03", value: 190, color: "#8b5cf6" }, { label: "AON-07", value: 150, color: "#3b82f6" }, { label: "DC-11", value: 122, color: "#ec4899" }]} /></div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-2 text-[11px] font-black uppercase text-slate-500">Top annexes (AnnexesTable mock)</p>
          {[["DAO-complet.pdf", 210, 82], ["annexe-prix.xlsx", 140, 54], ["plan-csb.pdf", 88, 31]].map(([n, c, p], i) => (
            <div key={n as string} className="mb-2 flex items-center gap-2 text-[12px] font-bold"><span>{i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉"}</span><span className="flex-1 truncate">{n}</span><span>{c}</span><div className="h-2 w-20 overflow-hidden rounded bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${p}%` }} /></div></div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="mb-2 text-[11px] font-black uppercase text-amber-700">Alertes supervision (MonitoringPanel mock)</p>
          <p className="text-[12px] font-semibold">⚠️ Limite imminente : AON-2026-07 (J-3)</p>
          <p className="text-[12px] font-semibold">💤 Inactifs &gt; 7 j : DC-2026-05</p>
          <p className="text-[12px] font-semibold">Taux clôture global : 68%</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Entreprise</th><th className="px-4 py-3">Vues</th><th className="px-4 py-3">Téléch.</th><th className="px-4 py-3">Engagement</th></tr></thead>
          <tbody>
            {[["EURL MediDistrib", 210, 48, "Élevé"], ["Vakinankaratra SARL", 120, 22, "Moyen"], ["Miaro Conseil", 45, 3, "Faible"]].map((r) => (
              <tr key={r[0] as string} className="border-t border-slate-100"><td className="px-4 py-2 font-bold">{r[0]}</td><td className="px-4 py-2">{r[1]}</td><td className="px-4 py-2">{r[2]}</td><td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black">{r[3]}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => notify("Export simulé : traceability.csv (mock).")}>Exporter la traçabilité (mock)</button>
    </div>
  );
}

function DashContratDemo({ notify }: { notify: Notify }) {
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Contractualisation — replica contractualisation (3 stats + accordéons)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="À contractualiser" value="3" sub="BROUILLON (mock)" accent="#f59e0b" />
        <Kpi label="En attente signature" value="2" sub="ATTENTE (mock)" accent="#38bdf8" />
        <Kpi label="Signés" value="11" sub="EXECUTION/TERMINE (mock)" accent="#10b981" />
      </div>
      {[["À contractualiser (brouillons)", "CTR-2026-09 — EURL MediDistrib — 47 900 000 Ar"], ["En attente signature", "CTR-2026-08 — Vakinankaratra SARL — 86 000 000 Ar"], ["Signés — en exécution", "CTR-2026-05 — Miaro Conseil — 44 100 000 Ar"]].map(([t, r]) => (
        <div key={t} className="rounded-2xl border border-slate-200 p-4">
          <p className="font-black text-[13px]">{t}</p>
          <div className="mt-2 flex items-center gap-2 text-[12px] font-semibold"><span className="flex-1">{r}</span><button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Dossier simulé ouvert : ${r} (mock).`)}>Voir le contrat</button></div>
        </div>
      ))}
    </div>
  );
}

function DashEvalSecDemo({ notify }: { notify: Notify }) {
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Évaluation (secrétaire) — replica evaluation_offre (assign + classement)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="À assigner" value="2" sub="A_ASSIGNER (mock)" accent="#f59e0b" />
        <Kpi label="En évaluation" value="3" sub="EN_EVALUATION (mock)" accent="#38bdf8" />
        <Kpi label="Terminés" value="5" sub="TERMINE (mock)" accent="#10b981" />
      </div>
      <div className="rounded-2xl border border-slate-200 p-4 text-[12px] font-semibold">
        SE-2026-011 — 4 offres — 3/4 terminées — Classement : 1. MediDistrib (89) · 2. Vakinankaratra (81)
        <div className="mt-2 flex gap-2">
          <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-bold text-white" onClick={() => notify("Assignation simulée ouverte (mock).")}>Assigner</button>
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-bold" onClick={() => notify("Relances simulées envoyées aux évaluateurs (mock).")}>Relancer</button>
        </div>
      </div>
    </div>
  );
}

function DashOuvertureDemo({ notify }: { notify: Notify }) {
  const rows = [
    ["AOI-2026-03", "VALIDATED", "Limite 15/11 — 4 offres"],
    ["AON-2026-07", "ONGOING", "Limite 28/11 — PV en cours"],
    ["DC-2026-11", "VALIDATION_PRESIDENT", "En attente présidente"],
  ];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Ouverture des offres — replica ouverture_offre (dual secrétaire/validateur)</p>
      <div className="flex flex-wrap gap-1.5">{["DRAFT · 1", "READY · 2", "VALIDATION · 2", "ONGOING · 1", "VALIDATED · 5", "REJECTED · 0"].map((s) => <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black">{s} (mock)</span>)}</div>
      {rows.map((r) => (
        <div key={r[0]} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[13px]">
          <span className="font-mono font-black">{r[0]}</span>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{r[1]}</span>
          <span className="font-semibold text-slate-500">{r[2]}</span>
          <span className="ml-auto flex gap-2">
            <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Séance simulée ouverte : ${r[0]} (mock).`)}>Ouvrir</button>
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold" onClick={() => notify(`PV simulé téléchargé : PV-${r[0]}.pdf (mock).`)}>PV PDF</button>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================= Catalogue + page ================= */

type Item = { id: string; label: string; presenter: string; util: Utility };

const GROUPS: { group: string; items: Item[] }[] = [
  {
    group: "1 · Authentification",
    items: [
      { id: "login", label: "Connexion", presenter: "P1", util: { purpose: "Point d'entrée unique : authentifie e-mail + mot de passe puis route vers le bon espace selon le groupe (demandeur, valideur, finance, admin, évaluateur).", users: "Tout le personnel + évaluateurs (lien ?validation=evaluation)", rules: "E-mail requis + format valide ; mot de passe requis ; e-mail inconnu → redirection inscription publique.", script: "Je montre la porte d'entrée : même identifiant, le routage par groupe envoie chacun vers son tableau de bord.", presenter: "Présentateur P1", file: "auth/login/page.tsx" } },
      { id: "register", label: "Inscription fournisseur", presenter: "P1", util: { purpose: "Crée le compte public des soumissionnaires (entreprises, BE, ONG) pour consulter et télécharger les DAO.", users: "Public / fournisseurs", rules: "Nom, e-mail, téléphone, NIF requis ; type d'entité parmi 5 ; mots de passe identiques.", script: "Côté fournisseur : inscription libre en deux minutes, puis vérification par e-mail.", presenter: "Présentateur P1", file: "auth/public/register/page.tsx" } },
      { id: "verify", label: "Vérification e-mail", presenter: "P1", util: { purpose: "Active le compte via le token reçu par e-mail ; propose le renvoi si le lien a expiré.", users: "Public", rules: "Token ?token requis ; succès → connexion ; expiré → ResendEmailButton.", script: "Après inscription, le clic dans l'e-mail active le compte ; s'il expire, on renvoie le lien.", presenter: "Présentateur P1", file: "auth/verify-email/page.tsx" } },
      { id: "eval-login", label: "Login évaluateur DAO", presenter: "P2", util: { purpose: "Accès isolé des évaluateurs externes par code DAO, sans compte interne, limité à leur séance.", users: "Évaluateurs externes", rules: "E-mail + code DAO requis ; ?seance borne le périmètre.", script: "L'évaluateur n'a pas de compte interne : son code DAO lui ouvre uniquement ses offres à noter.", presenter: "Présentateur P2", file: "evaluation/login/page.tsx" } },
    ],
  },
  {
    group: "2 · Demande d'achat — création",
    items: [
      { id: "demande", label: "État de besoins", presenter: "P1", util: { purpose: "Crée l'état de besoins : qualification (cellule, type, priorité, PTBA) + lignes matériels ou services + routage TDR/ST.", users: "Demandeur (initiateur)", rules: "Objet, bénéficiaire, PTBA, justification requis ; ligne matériels : désignation, qté ≥1, specs, lieu, destinataire ; services : dates fin ≥ début, coût >0 ; routage obligatoire pour services.", script: "Tout part d'ici : je qualifie le besoin, j'ajoute mes lignes, et le système route vers TDR ou validation.", presenter: "Présentateur P1", file: "demande-achat/new/page.tsx" } },
      { id: "corriger", label: "Correction (A_COMPLETER)", presenter: "P1", util: { purpose: "Permet au demandeur de corriger un dossier rejeté et de joindre les justificatifs avant resoumission.", users: "Demandeur propriétaire", rules: "Mêmes champs qu'à la création ; PJ PDF uniquement ; type de document requis par fichier.", script: "Quand le valideur demande des compléments, le demandeur corrige ici et resoumet en un clic.", presenter: "Présentateur P1", file: "demande-achat/corriger/[id]/page.tsx" } },
    ],
  },
  {
    group: "3 · Workflow validation → clôture",
    items: [
      { id: "validation", label: "Validation multi-étapes", presenter: "P2", util: { purpose: "Visa hiérarchique, technique, budgétaire, programmatique puis approbation finale, avec traçabilité.", users: "Valideurs + Finance", rules: "Rejet → commentaire obligatoire ; budgétaire : solde<0 force DEFAVORABLE, engagement auto ENG-AAAA-####.", script: "La chaîne des visas : chaque étape donne FAVORABLE ou renvoie, et la finance verrouille le budget.", presenter: "Présentateur P2", file: "demande-achat/components/ValidationModal.tsx" } },
      { id: "budget", label: "Imputation budgétaire", presenter: "P2", util: { purpose: "Affecte la ligne budgétaire et la source avant toute commande.", users: "Finance / Admin", rules: "Ligne + source requises ; subvention et engagement auto.", script: "Avant de commander, la finance impute la dépense sur la bonne ligne et le bon bailleur.", presenter: "Présentateur P2", file: "demande-achat/components/BudgetModal.tsx" } },
      { id: "passation", label: "Bon de commande", presenter: "P2", util: { purpose: "Transforme le besoin validé en commande fournisseur.", users: "Agent achat / Admin", rules: "Fournisseur requis ; date ≥ aujourd'hui ; montant et délai requis.", script: "Le besoin validé devient un bon de commande daté, chiffré et adressé au fournisseur retenu.", presenter: "Présentateur P2", file: "demande-achat/components/PassationModal.tsx" } },
      { id: "livraison", label: "Suivi expédition", presenter: "P3", util: { purpose: "Suit le transit jusqu'à l'arrivée (section marché 8.1).", users: "Marché / Logistique", rules: "État requis : EN_TRANSIT, ARRIVE, PARTIEL, RETARD.", script: "Pendant le transport, on met à jour le statut pour alerter en cas de retard.", presenter: "Présentateur P3", file: "demande-achat/components/LivraisonModal.tsx" } },
      { id: "reception", label: "Réception + écarts", presenter: "P3", util: { purpose: "Contrôle quantitatif et qualitatif par ligne, gère écarts et pièces (BL + PV).", users: "Logistique / Marché", rules: "Qté reçue requise ; écarts → type + action + description requis ; PJ PDF.", script: "À la livraison on compte, on contrôle, et tout écart déclenche une action corrective tracée.", presenter: "Présentateur P3", file: "demande-achat/components/ReceptionModal.tsx" } },
      { id: "resolve", label: "Résolution d'écart", presenter: "P3", util: { purpose: "Clôture proprement un écart de réception.", users: "Logistique", rules: "Date + commentaire de solution requis.", script: "Chaque écart se résout ici avec une date et une preuve de solution.", presenter: "Présentateur P3", file: "demande-achat/components/ResolveIssueModal.tsx" } },
      { id: "cloture", label: "Clôture + satisfaction", presenter: "P3", util: { purpose: "Archive le dossier avec statut final et note de satisfaction.", users: "Demandeur / Logistique", rules: "Date requise ; satisfaction 1–5 obligatoire.", script: "On clôt avec une note de satisfaction : c'est ce qui alimente les archives et les stats.", presenter: "Présentateur P3", file: "demande-achat/components/ClotureModal.tsx" } },
    ],
  },
  {
    group: "4 · Marchés & DAO publics",
    items: [
      { id: "mp-create", label: "Publication marché (7 sections)", presenter: "P2", util: { purpose: "Publie l'appel d'offres : intitulé, procédure, financement, calendrier, pièces.", users: "Agent marché / Secrétaire", rules: "≥1 source requise ; annexes ≤5 ; dates d'atelier si SERVICES.", script: "Publier un marché, c'est sept sections : de l'intitulé aux pièces jointes.", presenter: "Présentateur P2", file: "personnel/procurement/components/procurementForm.tsx" } },
      { id: "mp-update", label: "Édition marché", presenter: "P2", util: { purpose: "Corrige un marché publié en traçant les pièces supprimées.", users: "Agent marché / Admin", rules: "Suppressions → deletedAnnexIds / deletedTechnicalDocumentIds.", script: "On peut rééditer un marché : les pièces retirées sont tracées.", presenter: "Présentateur P2", file: "procurement/components/procurementUpdateForm.tsx" } },
      { id: "ppmp", label: "Planning PPMP (grille)", presenter: "P4", util: { purpose: "Saisit le plan de passation Travaux/Biens/Consultance en grille éditable.", users: "Admin (passation)", rules: "Suppression/arrêt exigent le mot de passe ; statut auto recalculé.", script: "Le plan annuel se saisit comme un tableur, avec garde-fou par mot de passe.", presenter: "Présentateur P4", file: "personnel/formulaire/page.tsx" } },
      { id: "public-list", label: "DAO publics + fiche [id]", presenter: "P4", util: { purpose: "Vitrine publique : recherche, pagination, téléchargement DAO, fiche détaillée.", users: "Public + acheteurs", rules: "10/page ; filtres dates ; téléchargement tracé VIEW/DOWNLOAD.", script: "Côté public : on cherche, on ouvre la fiche, on télécharge le DAO.", presenter: "Présentateur P4", file: "procurement/page.tsx + [id]/page.tsx" } },
    ],
  },
  {
    group: "5 · Séances d'ouverture",
    items: [
      { id: "seance", label: "Nouvelle séance", presenter: "P3", util: { purpose: "Crée la séance d'ouverture et sa commission (≥3 membres).", users: "Admin / Secrétaire", rules: "Référence + objet requis ; commission ≥3 sinon blocage.", script: "Pas de séance sans commission : trois membres minimum, sinon création refusée.", presenter: "Présentateur P3", file: "ouverture_offre/new/page.tsx" } },
      { id: "membres", label: "Saisie membres", presenter: "P3", util: { purpose: "Saisie manuelle des membres avec brouillon local et contrôle CIN.", users: "Secrétaire / Admin", rules: "Final : CIN 12 chiffres, e-mails distincts, ≥3 complets.", script: "On peut préparer la commission en brouillon, le contrôle strict n'arrive qu'au final.", presenter: "Présentateur P3", file: "ouverture_offre/membres/page.tsx" } },
      { id: "val-pub", label: "Validation publique", presenter: "P3", util: { purpose: "Permet aux membres/président de valider via le lien e-mail, sans compte interne.", users: "Commission (sans JWT)", rules: "Rejet/report → commentaire requis ; report → date ; signature par mot de passe.", script: "Chaque membre signe depuis son e-mail : valider, rejeter ou reporter.", presenter: "Présentateur P3", file: "ouverture_offre/validation/[id]/page.tsx" } },
      { id: "val-comp", label: "Validation composition", presenter: "P4", util: { purpose: "Le contrôle (RPM/GP/CN) valide la composition de la commission.", users: "RPM / GP / CN + Admin", rules: "Rejet → motif ≥5 caractères ; filtres ALL/ACTION/URGENT/ARCHIVED.", script: "Dernier verrou qualité : la composition est validée ou renvoyée avec motif.", presenter: "Présentateur P4", file: "ouverture_offre/validation-membres/page.tsx" } },
    ],
  },
  {
    group: "6 · Évaluation des offres",
    items: [
      { id: "eval-wizard", label: "Wizard 6 étapes", presenter: "P2", util: { purpose: "Notation en double aveugle : préliminaire, technique /5, financière, score 60/40, conclusion signée.", users: "Évaluateur assigné", rules: "Un « Non » bloque ; seuil technique 70 ; montants >0 ; signature requise ; consensus 3 évaluateurs écart <15.", script: "L'évaluateur avance en six étapes, et le score final pondère technique et prix.", presenter: "Présentateur P2", file: "evaluation/components/EvaluationWizardForm.tsx" } },
      { id: "eval-legacy", label: "Évaluation 4 étapes", presenter: "P2", util: { purpose: "Version accordéon équivalente (examen/technique/financière/conclusion).", users: "Évaluateur", rules: "Justification ≥10 caractères ; conflit d'intérêt OUI requis.", script: "Même logique en quatre blocs pour les évaluateurs habitués à l'ancien écran.", presenter: "Présentateur P2", file: "evaluation_offre/components/EvaluationForm.tsx" } },
      { id: "assign", label: "Assignation évaluateurs", presenter: "P4", util: { purpose: "Désigne les 3 évaluateurs, planifie la session, renseigne lots et NIF.", users: "Secrétaire évaluation / Admin", rules: "Exactement 3 évaluateurs ; CIN 12 chiffres ; e-mails distincts ; lots requis.", script: "Le secrétaire planifie et invite nominativement trois évaluateurs.", presenter: "Présentateur P4", file: "evaluation_offre/[id]/assign/page.tsx" } },
      { id: "classement", label: "Offres + classement", presenter: "P4", util: { purpose: "Liste les offres et publie le classement officiel avec statuts.", users: "Évaluateur + Secrétaire", rules: "Classement disponible après 3 évaluations ; CTA contrat depuis le rang 1.", script: "Une fois notées, les offres sont classées et le rang 1 part en contrat.", presenter: "Présentateur P4", file: "evaluation/classement/[seanceId]/page.tsx" } },
    ],
  },
  {
    group: "7 · TDR / ST",
    items: [
      { id: "tdr-new", label: "Nouveau TDR/ST", presenter: "P1", util: { purpose: "Rédige le document technique lié au besoin : catégorie, période, budget USD.", users: "Demandeur / Initiateur", rules: "Fin ≥ début ; durée ≥1 ; montant requis ; ligne requise à l'envoi.", script: "Le besoin technique devient un TDR chiffré et daté, prêt pour validation.", presenter: "Présentateur P1", file: "TdrSt/new/page.tsx" } },
      { id: "tdr-suivi", label: "Suivi + décisions", presenter: "P1", util: { purpose: "Suit le cycle BROUILLON→VALIDE et porte les décisions techniques/finales.", users: "Demandeur, Point focal, Gestionnaire, Auditeur", rules: "Actions bornées par statut et rôle ; archive consultable.", script: "Chaque document avance par décisions tracées jusqu'à validation finale.", presenter: "Présentateur P1", file: "TdrSt/formulaire/page.tsx" } },
    ],
  },
  {
    group: "8 · Contractualisation",
    items: [
      { id: "contrat-init", label: "Init contrat", presenter: "P4", util: { purpose: "Crée automatiquement le contrat depuis la séance et l'offre rang 1.", users: "Secrétaire / Admin", rules: "?seance_id requis ; ?offre_id optionnel (rang 1 auto).", script: "Un clic depuis le classement et le dossier contractuel est créé.", presenter: "Présentateur P4", file: "contractualisation/new/page.tsx" } },
      { id: "contrat-dos", label: "Dossier NOTI5", presenter: "P4", util: { purpose: "Complète parties, clauses, échéancier et pièces puis envoie au prestataire.", users: "Secrétaire contractualisation", rules: "E-mail requis ; ≥1 PDF ; échéancier total =100% ; verrou après envoi.", script: "On complète, on équilibre l'échéancier à cent pour cent, puis on envoie.", presenter: "Présentateur P4", file: "contractualisation/[id]/page.tsx" } },
    ],
  },
  {
    group: "9 · Espaces métier",
    items: [
      { id: "espaces", label: "Validation / Passation / Logistique", presenter: "P3", util: { purpose: "Trois espaces avec les mêmes filtres : périmètre, vue statut/tableau, recherche, financement.", users: "Valideurs, Agents achat, Logistique (+Admin)", rules: "Filtrage client instantané ; CTA restreint au périmètre (?filtre, ?scope).", script: "Mêmes filtres partout : mes dossiers ou tous, vue statut ou tableau, recherche libre.", presenter: "Présentateur P3", file: "validation/page.tsx + passation/page.tsx + logistique/page.tsx" } },
    ],
  },
  {
    group: "10 · Dashboards analytiques",
    items: [
      { id: "dash-global", label: "Dashboard passations", presenter: "P4", util: { purpose: "Suit en temps réel les marchés par type (Travaux/Biens/Consultance), méthode et statut.", users: "Tout personnel connecté", rules: "Aucun filtre ; montants formatés MGA fr-FR ; légendes normalisées.", script: "La vue d'ensemble : combien de marchés, combien d'argent, où en est chacun.", presenter: "Présentateur P4", file: "personnel/dashboard/page.tsx + donut.tsx" } },
      { id: "dash-radar", label: "Radar demande-achat", presenter: "P1", util: { purpose: "Suit le cycle de vie BROUILLON→CLOTUREE en 12 sections avec tableau paginé.", users: "Tous (CTA si scope=mine)", rules: "Pagination 5/page ; recherche multi-champs ; filtres financement/type.", script: "Le radar des demandes : douze étapes, du brouillon aux archives.", presenter: "Présentateur P1", file: "demande-achat/dashboard/page.tsx" } },
      { id: "dash-tdr", label: "Analytics TDR/ST", presenter: "P1", util: { purpose: "Vision documentaire : volume, délai moyen, validation, répartition type/source.", users: "Demandeurs + pilotes (token)", rules: "Seuils couleur délai ; tendances vs mois précédent ; bouton Actualiser.", script: "Côté documents : combien, en combien de temps, et où sont les blocages.", presenter: "Présentateur P1", file: "TdrSt/dashboard/page.tsx" } },
      { id: "dash-log", label: "Admin DAO & traçabilité", presenter: "P4", util: { purpose: "Mesure l'attractivité des DAO : vues, téléchargements, conversion, clôture, alertes, engagement.", users: "Admin", rules: "5 endpoints parallèles ; top 10 annexes ; engagement ≥70/≥30.", script: "L'administration : qui regarde, qui télécharge, quels dossiers dorment.", presenter: "Présentateur P4", file: "personnel/log-dashboard/page.tsx" } },
      { id: "dash-contrat", label: "Suivi contractualisation", presenter: "P4", util: { purpose: "Suit les NOTI5 : brouillons, attentes signature, signés.", users: "Secrétaire / Admin", rules: "Mapping EXECUTION/TERMINE→SIGNÉ ; recherche multi-champs.", script: "Les contrats : à faire, en attente de signature, signés.", presenter: "Présentateur P4", file: "contractualisation/page.tsx" } },
      { id: "dash-eval", label: "Pilotage évaluation", presenter: "P2", util: { purpose: "Pilote assignation, avancement et classement par séance.", users: "Secrétaire évaluation", rules: "Progression offres terminées/total ; ?seance deep-link.", script: "Le pilotage des notations : qui est assigné, où en est chaque offre.", presenter: "Présentateur P2", file: "evaluation_offre/page.tsx" } },
      { id: "dash-ouv", label: "Pilotage ouvertures", presenter: "P3", util: { purpose: "Double vue secrétaire/validateur avec machine d'états et PV PDF.", users: "Secrétaire + Commission", rules: "États DRAFT→VALIDATED ; commission ≥3 sinon modale de blocage.", script: "Les ouvertures : état de chaque dossier et PV téléchargeable.", presenter: "Présentateur P3", file: "ouverture_offre/page.tsx" } },
    ],
  },
];

function DemoFor({ id, notify }: { id: string; notify: Notify }) {
  switch (id) {
    case "login": return <LoginForm onSuccess={notify} />;
    case "register": return <RegisterForm onSuccess={notify} />;
    case "verify": return <VerifyEmailDemo notify={notify} />;
    case "eval-login": return <EvalLoginDemo notify={notify} />;
    case "demande": return <DemandeAchatForm onSuccess={notify} />;
    case "corriger": return <CorrigerDemo notify={notify} />;
    case "validation": return <ValidationDemo notify={notify} />;
    case "budget": return <BudgetDemo notify={notify} />;
    case "passation": return <PassationDemo notify={notify} />;
    case "livraison": return <LivraisonDemo notify={notify} />;
    case "reception": return <ReceptionDemo notify={notify} />;
    case "resolve": return <ResolveIssueDemo notify={notify} />;
    case "cloture": return <ClotureDemo notify={notify} />;
    case "mp-create": return <ProcurementCreateDemo notify={notify} />;
    case "mp-update": return <ProcurementUpdateDemo notify={notify} />;
    case "ppmp": return <PpmpGridDemo notify={notify} />;
    case "public-list": return <PublicListDemo notify={notify} />;
    case "seance": return <SeanceNewDemo notify={notify} />;
    case "membres": return <MembresDemo notify={notify} />;
    case "val-pub": return <ValidationPubliqueDemo notify={notify} />;
    case "val-comp": return <ValidationCompositionDemo notify={notify} />;
    case "eval-wizard": return <EvalWizardDemo notify={notify} />;
    case "eval-legacy": return <EvalLegacyDemo notify={notify} />;
    case "assign": return <AssignDemo notify={notify} />;
    case "classement": return <OffresClassementDemo notify={notify} />;
    case "tdr-new": return <TdrNewDemo notify={notify} />;
    case "tdr-suivi": return <TdrSuiviDemo notify={notify} />;
    case "contrat-init": return <ContratInitDemo notify={notify} />;
    case "contrat-dos": return <ContratDossierDemo notify={notify} />;
    case "espaces": return <EspacesDemo notify={notify} />;
    case "dash-global": return <DashGlobalDemo />;
    case "dash-radar": return <DashDemandeRadarDemo notify={notify} />;
    case "dash-tdr": return <DashTdrDemo />;
    case "dash-log": return <DashLogAdminDemo notify={notify} />;
    case "dash-contrat": return <DashContratDemo notify={notify} />;
    case "dash-eval": return <DashEvalSecDemo notify={notify} />;
    case "dash-ouv": return <DashOuvertureDemo notify={notify} />;
    default: return null;
  }
}

export default function PresentationPage() {
  const [active, setActive] = useState("demande");
  const [toast, setToast] = useState<Toast>(null);
  const [q, setQ] = useState("");
  const [presFilter, setPresFilter] = useState("Tous");
  const [viewed, setViewed] = useState<string[]>(["demande"]);
  const notify: Notify = (message) => {
    setToast({ title: "Succès (simulation)", message });
    window.setTimeout(() => setToast(null), 3500);
  };
  const flat = GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));
  const meta = flat.find((i) => i.id === active);
  const filtered = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => (presFilter === "Tous" || i.presenter === presFilter || i.presenter === "Tous") && (i.label + i.id).toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.items.length > 0);
  const total = flat.length;
  const pct = Math.round((viewed.length / total) * 100);

  return (
    <main className="min-h-screen bg-[#eceeef] pb-16 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">UCP — Démo jury · 100% mocké · sans backend ni rôles</p>
            <h1 className="text-2xl font-black tracking-tight">Catalogue des formulaires & dashboards <span className="text-emerald-700">/presentation</span></h1>
            <p className="mt-1 text-sm font-medium text-slate-500">{total} éléments · P1–P4 + Tous · description d&apos;utilité + script de présentation par fiche.</p>
            <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-[11px] font-bold text-slate-400">{viewed.length}/{total} vus ({pct}%) — ordre suggéré : login → register → demande → validation → budget → mp-create → seance → val-pub → eval-wizard → tdr-new → contrat-dos → dash-global.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Mode présentation</span>
            <div className="flex gap-1">{["Tous", "P1", "P2", "P3", "P4"].map((p) => <button key={p} type="button" onClick={() => setPresFilter(p)} className={`rounded-full px-3 py-1 text-[11px] font-black ${presFilter === p ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{p}</button>)}</div>
          </div>
        </div>
        <div className="mx-auto max-w-[1480px] px-4 pb-3">
          <input placeholder="🔎 Rechercher un formulaire ou dashboard… (ex : réception, donut, NOTI5)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-4 pt-6 lg:grid-cols-[310px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 lg:sticky lg:top-6 lg:max-h-[82vh] lg:overflow-y-auto">
          {filtered.map((g) => (
            <div key={g.group} className="mb-4 last:mb-0">
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{g.group}</p>
              <div className="space-y-1">
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => { setActive(it.id); setViewed((p) => (p.includes(it.id) ? p : [...p, it.id])); }}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left transition ${active === it.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-bold">
                      {viewed.includes(it.id) ? "✓" : "○"} {it.label}
                    </span>
                    <span className={`mt-0.5 block text-[11px] font-bold ${active === it.id ? "text-emerald-100" : "text-slate-400"}`}>{it.presenter} · {it.util.users}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-4 text-sm font-semibold text-slate-400">Aucun élément (mock).</p>}
        </aside>

        <section className="space-y-4" key={active}>
          {meta && (
            <>
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <p className="text-sm font-black text-emerald-900">{meta.label} <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-white">{meta.presenter}</span></p>
                <p className="text-[13px] font-medium text-emerald-800">{meta.group} — rôle d&apos;origine contourné : {meta.util.users}.</p>
              </div>
              <UtilityBox u={meta.util} />
            </>
          )}
          <DemoFor id={active} notify={notify} />
          {meta && (
            <div className="flex flex-wrap justify-between gap-2">
              <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold" onClick={() => {
                const i = flat.findIndex((x) => x.id === active);
                const prev = flat[(i - 1 + flat.length) % flat.length];
                setActive(prev.id); setViewed((p) => (p.includes(prev.id) ? p : [...p, prev.id]));
              }}>← Précédent</button>
              <button type="button" className="btn-primary" onClick={() => {
                const i = flat.findIndex((x) => x.id === active);
                const next = flat[(i + 1) % flat.length];
                setActive(next.id); setViewed((p) => (p.includes(next.id) ? p : [...p, next.id]));
              }}>Suivant →</button>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="ucp-toast ucp-toast--success" role="status">
          <div className="ucp-toast__icon-shell">✓</div>
          <div>
            <p className="ucp-toast__title">{toast.title}</p>
            <p className="ucp-toast__message">{toast.message}</p>
          </div>
          <button className="ucp-toast__close" onClick={() => setToast(null)} aria-label="Fermer">✕</button>
        </div>
      )}
    </main>
  );
}




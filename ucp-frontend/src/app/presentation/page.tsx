"use client";
import { useEffect, useState } from "react";

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
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-7 shadow sm:p-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Unité de Coordination des Projets</p>
      <h2 className="mt-3 text-center text-3xl font-bold text-slate-900">Connexion</h2>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setMsg(null);
          setTimeout(() => {
            setLoading(false);
            setMsg({ ok: true, text: `Bienvenue ${email} — redirection vers votre tableau de bord (mock).` });
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
        <button type={loading ? "button" : "submit"} className="inline-flex w-full items-center justify-center rounded-2xl bg-[#166534] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#14532d]">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        {msg && (
          <p className={`rounded-2xl px-4 py-3 text-center text-[13px] font-bold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
        )}
        <p className="text-center text-[11px] font-semibold text-slate-400">Email inconnu → redirection inscription publique (mock).</p>
      </form>
    </div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: Notify }) {
  const [f, setF] = useState({ full_name: "Jean Dupont", email: "jean@entreprise.mg", phone: "+261 34 00 000 00", type_entite: "", nif: "1234567", password: "demo1234", confirmPassword: "demo1234" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cool, setCool] = useState(0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  if (done) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 rounded-[30px] border border-slate-200/80 bg-white p-6 text-center sm:p-8">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">✉</p>
        <h3 className="text-xl font-black">Vérifiez votre boîte mail</h3>
        <p className="text-sm font-medium text-slate-500">Un lien d&apos;activation a été envoyé à <span className="font-bold text-slate-800">{f.email}</span> — valable 24h. Pensez à vérifier vos spams.</p>
        <button
          type="button"
          disabled={cool > 0}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-50"
          onClick={() => {
            setCool(60);
            const t = setInterval(() => setCool((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
            onSuccess(`Lien simulé renvoyé à ${f.email} (mock).`);
          }}
        >
          {cool > 0 ? `Renvoyer (${cool}s)` : "Vous n'avez rien reçu ? Renvoyer le mail"}
        </button>
        <button type="button" className="w-full rounded-2xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50" onClick={() => { setDone(false); onSuccess("Retour simulé au formulaire d'inscription (mock)."); }}>← Retour</button>
        <button type="button" className="btn-primary w-full" onClick={() => onSuccess("Redirection simulée : /auth/login (mock).")}>Retour à la page de connexion</button>
      </div>
    );
  }
  return (
    <form
      className="mx-auto w-full max-w-md space-y-4 rounded-[30px] border border-slate-200/80 bg-white p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.password !== f.confirmPassword) return onSuccess("Échec simulé : le mot de passe ne correspond pas.");
        setLoading(true);
        setTimeout(() => { setLoading(false); setDone(true); onSuccess(`Compte fournisseur simulé créé pour ${f.email} — écran vérification e-mail (mock).`); }, 700);
      }}
    >
      <p className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">Inscription libre</p>
      <Field label="Nom complet"><input className={fieldClass} value={f.full_name} onChange={set("full_name")} placeholder="Ex : Jean Dupont" /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email"><input type="email" className={fieldClass} value={f.email} onChange={set("email")} placeholder="adresse@mail.com" /></Field>
        <Field label="Téléphone"><input className={fieldClass} value={f.phone} onChange={set("phone")} placeholder="+261 -- -- --- --" /></Field>
      </div>
      <Field label="Type d'entité">
        <select className={fieldClass} value={f.type_entite} onChange={set("type_entite")}>
          <option value="" disabled>Sélectionner…</option>
          <option value="ENTREPRISE">Entreprise</option>
          <option value="BUREAU_ETUDES">Bureau d&apos;études</option>
          <option value="ONG">ONG</option>
          <option value="PARTICULIER">Particulier</option>
          <option value="CONSULTANT">Consultant</option>
        </select>
      </Field>
      <Field label="Numéro d'Identification Fiscale (NIF)"><input className={fieldClass} value={f.nif} onChange={set("nif")} placeholder="Saisir votre NIF" /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mot de passe"><input type="password" className={fieldClass} value={f.password} onChange={set("password")} placeholder="••••••••" /></Field>
        <Field label="Confirmation"><input type="password" className={fieldClass} value={f.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" /></Field>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? "Traitement en cours..." : "Créer mon compte UCP"}</button>
      <button type="button" className="w-full rounded-2xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50" onClick={() => onSuccess("Retour simulé : /auth/login (mock).")}>← Retour</button>
    </form>
  );
}

function VerifyEmailDemo({ notify }: { notify: Notify }) {
  const [status, setStatus] = useState<"verifying" | "ok" | "expired">("verifying");
  const [cool, setCool] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStatus((s) => (s === "verifying" ? "ok" : s)), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`${cardClass} mx-auto max-w-md space-y-4 text-center`}>
      <p className={sectionTitleClass}>Activation du compte — replica de auth/verify-email (?token=… auto)</p>
      {status === "verifying" && (
        <div className="animate-pulse rounded-2xl bg-slate-50 px-4 py-6 text-sm font-bold text-slate-500">Vérification du lien en cours…</div>
      )}
      {status === "ok" && (
        <div className="space-y-2 rounded-2xl bg-emerald-50 px-4 py-5">
          <p className="text-sm font-black text-emerald-700">✓ Votre compte a été activé avec succès.</p>
          <p className="text-[12px] font-semibold text-emerald-600">Redirection : /auth/login?verified=true dans 3s (mock).</p>
          <button type="button" className="mt-1 text-[12px] font-bold text-slate-400 underline" onClick={() => setStatus("expired")}>Simuler un lien expiré</button>
        </div>
      )}
      {status === "expired" && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">Ce lien est expiré ou invalide.</p>
          <p className="text-[12px] font-semibold text-amber-700">Votre lien a expiré ? Demandez-en un nouveau :</p>
          <button
            type="button"
            disabled={cool > 0}
            className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => {
              setCool(60);
              const t = setInterval(() => setCool((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
              notify("Lien simulé renvoyé à jean@entreprise.mg (mock).");
            }}
          >
            {cool > 0 ? `Renvoyer (${cool}s)` : "Vous n'avez rien reçu ? Renvoyer le mail"}
          </button>
          <button type="button" className="text-[12px] font-bold text-slate-400 underline" onClick={() => setStatus("verifying")}>Rejouer la vérification</button>
        </div>
      )}
    </div>
  );
}

function EvalLoginDemo({ notify }: { notify: Notify }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          notify("Accès évaluateur DAO simulé — liste des offres affichée (mock).");
        }, 600);
      }}
      className={`${cardClass} mx-auto max-w-md space-y-4`}
    >
      <p className={sectionTitleClass}>Login évaluateur DAO — replica de evaluation/login</p>
      <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Séance liée : ?seance=11 — AOI vaccins (ID numérique via lien e-mail, mock).</p>
      <Field label="Email"><input required type="email" defaultValue="evaluateur@ucp.mg" disabled={loading} placeholder="Saisir l'email reçu dans le mail" className={fieldClass} /></Field>
      <div>
        <label className={labelClass}>Code / mot de passe DAO</label>
        <div className="relative">
          <input required type={show ? "text" : "password"} defaultValue="DAO-2026" disabled={loading} placeholder="Saisir le code ou mot de passe reçu" className={`${fieldClass} pr-12`} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? "🙈" : "👁"}</button>
        </div>
      </div>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">{error}</p>}
      <button className="btn-primary w-full disabled:opacity-60" type="submit" disabled={loading}>{loading ? "Vérification..." : "Accéder aux offres"}</button>
    </form>
  );
}

/* ================= B. Demande d'achat — création & correction ================= */

function DemandeAchatForm({ onSuccess }: { onSuccess: Notify }) {
  const today = new Date().toISOString().slice(0, 10);
  const [typeDemande, setTypeDemande] = useState<"MATERIELS" | "PETITS_SERVICES">("MATERIELS");
  const [f, setF] = useState({ uniteTechnique: "", categorieBesoin: "", priorite: "", objet: "Achat ordinateurs de bureau", serviceBeneficiaire: "Service Informatique", lienPtba: "PTBA-2026-A1", justification: "Renouvellement du parc informatique (5 postes)." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const blankLigne = () => ({ designation: "", marque: "", quantite: 1, unite: "Pièce", prix: 0, specs: "", lieu: "", destinataire: "" });
  const [lignes, setLignes] = useState([
    { designation: "Ordinateur portable", marque: "HP ProBook 440", quantite: 5, unite: "Pièce", prix: 2500000, specs: "i5 / 16 Go / 512 Go SSD", lieu: "Antananarivo", destinataire: "S. Rabe" },
  ]);
  const [svc, setSvc] = useState({ type_service: "FORMATION", description: "Formation logistique 40 agents", debut: "2026-11-10", fin: "2026-11-14", beneficiaires: 40, cout: 15000, lieu: "Antsirabe", livrables: "Attestations + rapport" });
  const [routing, setRouting] = useState<string | null>(null);
  const switchType = (t: "MATERIELS" | "PETITS_SERVICES") => { setTypeDemande(t); setLignes(t === "MATERIELS" ? [blankLigne()] : []); setRouting(null); };
  const submitLabel = typeDemande === "MATERIELS" ? "SOUMETTRE ET PRÉPARER LE TDR" : routing ? "SOUMETTRE LA DEMANDE" : "…CHOISIR LE PARCOURS";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.uniteTechnique || !f.categorieBesoin || !f.priorite) return onSuccess("Échec simulé : qualification incomplète (cellule, catégorie, priorité) (mock).");
        if (typeDemande === "MATERIELS") {
          if (lignes.length < 1) return onSuccess("Échec simulé : ajoutez au moins une ligne de besoin (mock).");
          return onSuccess("Demande simulée transmise → PREPARE_TDR : redirection /TdrSt/new?demandeId=DA-2026-014&docType=TDR (mock).");
        }
        if (svc.fin < svc.debut) return onSuccess("Échec simulé : la fin doit être postérieure au début (mock).");
        if (!(svc.cout > 0)) return onSuccess("Échec simulé : le coût total doit être > 0 (mock).");
        if (!routing) return onSuccess("Choisissez le parcours : validation directe ou préparer TDR/ST (mock).");
        if (routing === "DIRECT_VALIDATION") return onSuccess("Demande SERVICES simulée transmise en validation directe (mock).");
        return onSuccess(`Demande SERVICES simulée → ${routing} : redirection /TdrSt/new?demandeId=DA-2026-011 (mock).`);
      }}
      className={`${cardClass} space-y-6`}
    >
      <p className={sectionTitleClass}>Section 1 — Qualification (replica demande-achat/new)</p>
      <div className="flex gap-2">
        {(["MATERIELS", "PETITS_SERVICES"] as const).map((t) => (
          <button key={t} type="button" onClick={() => switchType(t)} className={`rounded-xl px-4 py-2 text-[12px] font-black ${typeDemande === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{t === "MATERIELS" ? "Matériels" : "Petits services"}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cellule *">
          <select className={fieldClass} value={f.uniteTechnique} onChange={set("uniteTechnique")}>
            <option value="">Sélectionner…</option>
            <option value="PASSATION">Passation des marchés</option><option value="SUIVI_EVALUATION">Suivi-Évaluation</option><option value="FINANCE">Finance</option><option value="LOGISTIQUE">Logistique</option><option value="COORDINATION">Coordination</option><option value="TECHNIQUE">Technique</option><option value="RH_ADMIN">RH & Admin</option>
          </select>
        </Field>
        <Field label="Catégorie de besoin *">
          <select className={fieldClass} value={f.categorieBesoin} onChange={set("categorieBesoin")}>
            <option value="">Sélectionner…</option>
            <option value="NOUVEAU_BESOIN">Nouveau besoin</option><option value="REAPPROVISIONNEMENT">Réapprovisionnement</option><option value="REMPLACEMENT">Remplacement</option><option value="URGENCE">Urgence</option>
          </select>
        </Field>
        <Field label="Priorité *"><select className={fieldClass} value={f.priorite} onChange={set("priorite")}><option value="">Sélectionner…</option><option value="NORMAL">Normal (5 jours)</option><option value="URGENT">Urgent (48h)</option></select></Field>
        <Field label="Objet *"><input required className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Service bénéficiaire *"><input required className={fieldClass} value={f.serviceBeneficiaire} onChange={set("serviceBeneficiaire")} /></Field>
        <Field label="Réf. PTBA *"><input required className={fieldClass} value={f.lienPtba} onChange={set("lienPtba")} /></Field>
      </div>
      <Field label="Justification *"><textarea required className={textareaClass} value={f.justification} onChange={set("justification")} /></Field>
      <p className={sectionTitleClass}>Section 2 — Lignes de besoin ({typeDemande === "MATERIELS" ? "Matériels" : "Petits services"}) — {lignes.length} ligne(s)</p>
      {typeDemande === "MATERIELS" && (
        <>
          {lignes.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">Aucune ligne — cliquez « Ajouter un besoin » (≥ 1 requise).</p>}
          {lignes.map((ligne, i) => (
            <div key={i} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-black text-slate-600">Besoin n°{i + 1}</p>
                <button type="button" className="rounded-lg border border-red-200 px-3 py-1 text-[11px] font-black text-red-600" onClick={() => setLignes(lignes.filter((_, j) => j !== i))}>Supprimer</button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Désignation *"><input required className={fieldClass} value={ligne.designation} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, designation: e.target.value } : x)))} /></Field>
                <Field label="Marque / modèle"><input className={fieldClass} value={ligne.marque} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, marque: e.target.value } : x)))} /></Field>
                <Field label="Quantité * (≥ 1)"><input required type="number" min={1} className={fieldClass} value={ligne.quantite} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, quantite: Number(e.target.value) } : x)))} /></Field>
                <Field label="Unité *"><input required className={fieldClass} value={ligne.unite} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, unite: e.target.value } : x)))} /></Field>
                <Field label="Prix unitaire estimé (Ar)"><input type="number" min={0} className={fieldClass} value={ligne.prix} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, prix: Number(e.target.value) } : x)))} /></Field>
                <Field label="Lieu de livraison *"><input required className={fieldClass} value={ligne.lieu} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, lieu: e.target.value } : x)))} /></Field>
                <Field label="Caractéristiques techniques *"><textarea required className={textareaClass} value={ligne.specs} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, specs: e.target.value } : x)))} /></Field>
                <div>
                  <label className={labelClass}>Destinataire final * (annuaire)</label>
                  <input required list="da-annuaire" className={fieldClass} value={ligne.destinataire} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, destinataire: e.target.value } : x)))} placeholder="Choisir ou saisir…" />
                  <datalist id="da-annuaire">{MOCK.demandeurs.map((d) => <option key={d} value={d} />)}</datalist>
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold" onClick={() => setLignes([...lignes, blankLigne()])}>+ Ajouter un besoin (mock)</button>
          <p className="text-[11px] font-bold text-slate-400">Matériels → toujours PREPARE_TDR : la demande prépare automatiquement le TDR (jamais de validation directe).</p>
        </>
      )}
      {typeDemande === "PETITS_SERVICES" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type de service *"><select className={fieldClass} value={svc.type_service} onChange={(e) => setSvc({ ...svc, type_service: e.target.value })}>{["FORMATION", "MAINTENANCE", "REPARATION", "NETTOYAGE", "PRESTATION_PONCTUELLE"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Nombre bénéficiaires"><input type="number" min={0} step={1} className={fieldClass} value={svc.beneficiaires} onChange={(e) => setSvc({ ...svc, beneficiaires: Number(e.target.value) })} /></Field>
            <Field label="Début *"><input required type="date" min={today} className={fieldClass} value={svc.debut} onChange={(e) => setSvc({ ...svc, debut: e.target.value })} /></Field>
            <Field label="Fin (≥ début) *"><input required type="date" min={svc.debut} className={fieldClass} value={svc.fin} onChange={(e) => setSvc({ ...svc, fin: e.target.value })} /></Field>
            <Field label="Coût total estimé (Ar) *"><input required type="number" min={0} className={fieldClass} value={svc.cout} onChange={(e) => setSvc({ ...svc, cout: Number(e.target.value) })} /></Field>
            <Field label="Lieu d'exécution *"><input required className={fieldClass} value={svc.lieu} onChange={(e) => setSvc({ ...svc, lieu: e.target.value })} /></Field>
          </div>
          <Field label="Description du service *"><textarea required className={textareaClass} value={svc.description} onChange={(e) => setSvc({ ...svc, description: e.target.value })} /></Field>
          <Field label="Livrables attendus *"><input required className={fieldClass} value={svc.livrables} onChange={(e) => setSvc({ ...svc, livrables: e.target.value })} /></Field>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-sky-700">Parcours (services uniquement) — où va la demande ?</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[["DIRECT_VALIDATION", "Validation directe", "Petit montant, envoi immédiat au valideur."], ["PREPARE_TDR", "Préparer le TDR", "Prestation intellectuelle, TDR requis."], ["PREPARE_ST", "Préparer la ST", "Spécifications techniques requises."]].map(([v, t, d]) => (
                <button key={v} type="button" onClick={() => setRouting(v)} className={`rounded-2xl border p-3 text-left ${routing === v ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white"}`}>
                  <span className="block text-[12px] font-black">{t}</span>
                  <span className={`block text-[11px] font-medium ${routing === v ? "text-sky-100" : "text-slate-500"}`}>{d}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <button type="submit" className="btn-primary">{submitLabel} (mock)</button>
    </form>
  );
}

function CorrigerDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ unite: "LOGISTIQUE", categorie: "NOUVEAU_BESOIN", priorite: "NORMAL", objet: "Achat ordinateurs — corrections demandées", service: "Service Informatique", ptba: "PTBA-2026-A1", justif: "Renouvellement du parc + précisions techniques ajoutées." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [docs, setDocs] = useState([{ type: "DEVIS_ESTIMATIF", name: "devis-medi.pdf" }]);
  const [newType, setNewType] = useState("SPECIFICATIONS_TECHNIQUES");
  const typeLabels: Record<string, string> = { SPECIFICATIONS_TECHNIQUES: "Spécifications techniques détaillées (PDF)", TDR_SIMPLIFIE: "TDR simplifié (PDF)", DEVIS_ESTIMATIF: "Devis estimatif (PDF)", BON_SORTIE_STOCK: "Bon de sortie de stock (PDF)" };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        for (const d of docs) {
          if (!d.type) return notify("Échec simulé : type de document requis pour chaque pièce (mock).");
        }
        notify("Dossier simulé corrigé + resoumis → /demande-achat/dashboard?filter=toutes (mock).");
      }}
      className={`${cardClass} space-y-4`}
    >
      <p className={sectionTitleClass}>Correction (A_COMPLETER) — replica corriger/[id]</p>
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-800">Motif du rejet — validation technique (A_COMPLETER) : « Préciser les caractéristiques techniques + joindre un devis estimatif PDF. » (mock)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Cellule *"><select className={fieldClass} value={f.unite} onChange={set("unite")}>{["PASSATION", "SUIVI_EVALUATION", "FINANCE", "LOGISTIQUE", "COORDINATION", "TECHNIQUE", "RH_ADMIN"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Catégorie *"><select className={fieldClass} value={f.categorie} onChange={set("categorie")}>{["NOUVEAU_BESOIN", "REAPPROVISIONNEMENT", "REMPLACEMENT", "URGENCE"].map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Priorité *"><select className={fieldClass} value={f.priorite} onChange={set("priorite")}><option value="NORMAL">Normal (5 jours)</option><option value="URGENT">Urgent (48h)</option></select></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Objet *"><input required className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Service bénéficiaire *"><input required className={fieldClass} value={f.service} onChange={set("service")} /></Field>
        <Field label="Réf. PTBA *"><input required className={fieldClass} value={f.ptba} onChange={set("ptba")} /></Field>
        <Field label="Justification *"><textarea required className={textareaClass} value={f.justif} onChange={set("justif")} /></Field>
      </div>
      <div>
        <label className={labelClass}>Pièces jointes — PDF uniquement, type requis par document</label>
        <ul className="space-y-2">
          {docs.map((d, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-black">{typeLabels[d.type] ?? d.type}</span>
              <span className="flex-1 truncate">📄 {d.name}</span>
              <select className="rounded-lg border border-slate-200 px-2 py-1 text-[12px]" value={d.type} onChange={(e) => setDocs(docs.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                <option value="">Type requis…</option>
                {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button type="button" className="text-red-500" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-500 hover:border-emerald-400">
            + Joindre un PDF (mock)
            <input
              type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return notify("Échec simulé : seuls les fichiers PDF sont acceptés (mock).");
                setDocs([...docs, { type: newType, name: file.name }]);
                e.target.value = "";
              }}
            />
          </label>
          <select className={fieldClass} value={newType} onChange={(e) => setNewType(e.target.value)}>
            {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
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
  const [source, setSource] = useState("RSS3_GAVI");
  const [ligneB, setLigneB] = useState("2.2.1 Materiel informatique");
  const [solde, setSolde] = useState(85000000);
  const [confFin, setConfFin] = useState("CONFORME_MANUEL");
  const [seuils, setSeuils] = useState("SEUIL_RESPECTE");
  const cout = 12500000;
  const apres = solde - cout;
  const dispoAuto = apres >= 0 ? "DISPONIBLE" : "NON_DISPONIBLE";
  const locked = etape === "BUDGETAIRE" && apres < 0;
  const decOptions = (etape === "PROGRAMMATIQUE" || etape === "APPROBATION_FINALE")
    ? ["APPROUVEE", "A_REVOIR", "REJETEE"]
    : ["FAVORABLE", "A_COMPLETER", "DEFAVORABLE"];
  return (
    <form onSubmit={(e) => { e.preventDefault(); const dec = locked ? "DEFAVORABLE" : decision; if ((dec === "DEFAVORABLE" || dec === "A_COMPLETER" || dec === "A_REVOIR" || dec === "REJETEE") && !commentaire.trim()) return notify("Échec simulé : observations obligatoires pour un refus / précisez les corrections (mock)."); if (etape === "TECHNIQUE" && stock === "STOCK_DISPONIBLE" && dec === "FAVORABLE" && !commentaire.trim()) return notify("Échec simulé : stock disponible — justification requise même si favorable (mock)."); notify(`Décision simulée [${etape}] : ${dec}${locked ? " (forcée : solde insuffisant)" : ""} (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation — replica de ValidationModal.tsx</p>
      <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Étape en cours (auto) : dossier DA-2026-014 — phase {etape} (mock).</p>
      <Field label="Étape de validation (auto en prod)">
        <select className={fieldClass} value={etape} onChange={(e) => { setEtape(e.target.value); setDecision("FAVORABLE"); }}>
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
            <Field label="Source financement *"><select className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)}>{["SRPS_CS7_FM", "RSS3_GAVI", "FAE_GAVI", "CDS_GAVI", "VAR_GAVI", "PARN2_BM", "PPSB_BM"].map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field label="Ligne budgétaire *">
              <select className={fieldClass} value={ligneB} onChange={(e) => setLigneB(e.target.value)}>
                <option>2.1.1 Fournitures bureau</option>
                <option>2.2.1 Materiel informatique</option>
                <option>3.1.1 Services</option>
              </select>
            </Field>
            <Field label="N° subvention (auto)"><input readOnly className={fieldClass} value="MDG-S-MOH-4041" /></Field>
            <Field label="Coût estimé (auto)"><input readOnly className={fieldClass} value={`${cout.toLocaleString("fr-FR")} Ar`} /></Field>
            <Field label="Solde disponible"><input type="number" className={fieldClass} value={solde} onChange={(e) => setSolde(Number(e.target.value))} /></Field>
            <Field label="Solde après engagement (auto)"><input readOnly className={`${fieldClass} font-black ${apres < 0 ? "border-red-400 bg-red-50 text-red-700" : ""}`} value={`${apres.toLocaleString("fr-FR")} Ar`} /></Field>
            <Field label="Disponibilité (auto)"><input readOnly disabled className={fieldClass} value={dispoAuto} /></Field>
            <Field label="Conformité financière *"><select className={fieldClass} value={confFin} onChange={(e) => setConfFin(e.target.value)}><option>CONFORME_MANUEL</option><option>NON_CONFORME</option></select></Field>
            <Field label="Respect des seuils *"><select className={fieldClass} value={seuils} onChange={(e) => setSeuils(e.target.value)}><option>SEUIL_RESPECTE</option><option>PROCEDURE_ADAPTEE</option></select></Field>
            <Field label="N° engagement (auto si FAVORABLE)"><input readOnly className={fieldClass} value="ENG-2026-0417" /></Field>
          </div>
          {locked && <p className="rounded-xl bg-red-50 px-4 py-2 text-[12px] font-black text-red-700">⛔ Solde insuffisant : DEFAVORABLE forcé, autres décisions verrouillées (mock).</p>}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Décision">
          <div className="flex gap-2">
            {decOptions.map((o) => (
              <button key={o} type="button" disabled={locked && o !== "DEFAVORABLE"} onClick={() => setDecision(o)} className={`flex-1 rounded-xl border px-3 py-2.5 text-[12px] font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${(locked ? o === "DEFAVORABLE" : decision === o) ? (o.includes("FAVOR") || o === "APPROUVEE" ? "border-emerald-500 bg-emerald-600 text-white" : o.includes("COMPLETER") || o === "A_REVOIR" ? "border-amber-500 bg-amber-500 text-white" : "border-red-500 bg-red-600 text-white") : "border-slate-200 bg-white text-slate-600"}`}>{o}</button>
            ))}
          </div>
        </Field>
        <Field label="Observations (requises si refus / à compléter)"><textarea className={textareaClass} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} /></Field>
      </div>
      <button className="btn-primary" type="submit">Valider l&apos;étape (mock)</button>
    </form>
  );
}

function BudgetDemo({ notify }: { notify: Notify }) {
  const [ligne, setLigne] = useState("2.2.1 Materiel informatique");
  const [source, setSource] = useState("RSS3_GAVI");
  const subventions: Record<string, string> = { SRPS_CS7_FM: "MDG-S-MOH-4041", RSS3_GAVI: "MDG-HSS-3", FAE_GAVI: "MDG-FAE", CDS_GAVI: "MDG-CDS", VAR_GAVI: "MDG-VAR", PARN2_BM: "PARN2-BM-P175110", PPSB_BM: "PPSB-BM-P174903" };
  const soldes: Record<string, number> = { "2.1.1 Fournitures bureau": 45000000, "2.2.1 Materiel informatique": 85000000, "3.1.1 Services": 120000000 };
  const cout = 12500000;
  const dispo = soldes[ligne] ?? 0;
  const apres = dispo - cout;
  const ok = apres >= 0;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!ligne || !source) return notify("Échec simulé : ligne et source requises (mock)."); notify(`Budget simulé validé : ${ligne} / ${source} — ENG-2026-0417 (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Imputation budgétaire — replica de BudgetModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ligne budgétaire *">
          <select required className={fieldClass} value={ligne} onChange={(e) => setLigne(e.target.value)}>
            <option value="">Sélectionner…</option>
            <option>2.1.1 Fournitures bureau</option>
            <option>2.2.1 Materiel informatique</option>
            <option>3.1.1 Services</option>
          </select>
        </Field>
        <Field label="Source de financement *">
          <select required className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Sélectionner…</option>
            <option value="SRPS_CS7_FM">SRPS / CS7 / Fonds Mondial</option>
            <option value="RSS3_GAVI">RSS3 / GAVI</option>
            <option value="FAE_GAVI">FAE / GAVI</option>
            <option value="CDS_GAVI">CDS / GAVI</option>
            <option value="VAR_GAVI">VAR / GAVI</option>
            <option value="PARN2_BM">PARN2 / Banque Mondiale</option>
            <option value="PPSB_BM">PPSB / Banque Mondiale</option>
          </select>
        </Field>
        <Field label="N° subvention (auto)"><input readOnly className={fieldClass} value={subventions[source] ?? "—"} /></Field>
        <Field label="Coût estimé (auto)"><input readOnly className={fieldClass} value={`${cout.toLocaleString("fr-FR")} Ar`} /></Field>
        <Field label="Solde disponible (auto)"><input readOnly className={fieldClass} value={`${dispo.toLocaleString("fr-FR")} Ar`} /></Field>
        <Field label="N° engagement"><input readOnly className={fieldClass} value="Généré après validation" /></Field>
      </div>
      <Field label="Solde après engagement (auto)"><input readOnly className={`${fieldClass} font-black ${ok ? "" : "border-red-400 bg-red-50 text-red-700"}`} value={`${apres.toLocaleString("fr-FR")} Ar`} /></Field>
      <p className={`rounded-2xl px-4 py-3 text-[13px] font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
        {ok ? "✓ Vérification automatique : solde suffisant." : "✕ Vérification automatique : solde insuffisant — imputation impossible."} Rappel : l&apos;engagement est généré après validation.
      </p>
      <button className="btn-primary" type="submit">Valider le budget (mock)</button>
    </form>
  );
}

function PassationDemo({ notify }: { notify: Notify }) {
  const [fournisseur, setFournisseur] = useState("EURL MediDistrib");
  const [date, setDate] = useState("2026-10-20");
  const [montant, setMontant] = useState(12500000);
  const [delai, setDelai] = useState(21);
  const emails: Record<string, string> = { "EURL MediDistrib": "contact@medidistrib.mg", "Société Vakinankaratra SARL": "contact@vakinankaratra.mg", "Bureau d'études Miaro Conseil": "contact@miaro-conseil.mg" };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!fournisseur || !date || delai < 0) return notify("Échec simulé : fournisseur, date et délai requis (mock)."); notify(`Bon de commande simulé créé : ${fournisseur} — ${montant.toLocaleString("fr-FR")} Ar (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Passation — Bon de commande (replica PassationModal)</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type de procédure">
          <select className={fieldClass} defaultValue="">
            <option value="">Choisir…</option>
            <option value="DEMANDE_COTATION">Demande de cotation</option>
            <option value="BON_COMMANDE_DIRECT">Bon de commande direct</option>
            <option value="SELECTION_APRES_COTATION">Sélection après cotation</option>
          </select>
        </Field>
        <Field label="Fournisseur retenu *">
          <select required className={fieldClass} value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}>
            <option value="">Choisir…</option>
            {MOCK.fournisseurs.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="E-mail fournisseur (auto)"><input readOnly className={fieldClass} value={emails[fournisseur] ?? "—"} /></Field>
        <Field label="N° bon de commande (auto)"><input readOnly className={fieldClass} value="BC-2026-014 — généré automatiquement" /></Field>
        <Field label="Date du BC *"><input required type="date" min={today} className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Montant commande *"><input required type="number" className={fieldClass} value={montant} onChange={(e) => setMontant(Number(e.target.value))} /></Field>
        <Field label="Délai contractuel (jours) *"><input required type="number" min={0} className={fieldClass} value={delai} onChange={(e) => setDelai(Number(e.target.value))} /></Field>
        <Field label="Conditions de livraison"><input placeholder="Ex : livraison franco Antananarivo" className={fieldClass} defaultValue="" /></Field>
        <Field label="Garantie"><input placeholder="Ex : 12 mois pièces et main-d'œuvre" className={fieldClass} defaultValue="" /></Field>
      </div>
      <button className="btn-primary" type="submit">Créer le bon de commande (mock)</button>
    </form>
  );
}

function LivraisonDemo({ notify }: { notify: Notify }) {
  const [etat, setEtat] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!etat) return notify("Échec simulé : veuillez sélectionner l'état d'expédition (mock)."); notify(`Expédition simulée : ${etat} (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Suivi expédition 8.1 — replica LivraisonModal</p>
      <Field label="État expédition *">
        <select required className={fieldClass} value={etat} onChange={(e) => setEtat(e.target.value)}>
          <option value="">Sélectionner…</option>
          <option value="EN_TRANSIT">En transit</option>
          <option value="ARRIVE">Arrivé sur site</option>
          <option value="PARTIEL">Arrivée partielle</option>
          <option value="RETARD">En retard</option>
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Arrivée prévue"><input type="date" min={today} defaultValue="2026-11-05" className={fieldClass} /></Field>
        <Field label="Arrivée effective"><input type="date" min={today} defaultValue="2026-11-06" className={fieldClass} /></Field>
      </div>
      <button className="btn-primary" type="submit">Enregistrer le suivi (mock)</button>
    </form>
  );
}

function ReceptionDemo({ notify }: { notify: Notify }) {
  const today = new Date().toISOString().slice(0, 10);
  const [lignes, setLignes] = useState([
    { designation: "Ordinateur portable HP ProBook", prevu: 5, recu: 5 },
    { designation: "Clavier sans fil", prevu: 5, recu: 4 },
  ]);
  const [cqte, setCqte] = useState("PARTIELLE");
  const [cqual, setCqual] = useState("CONFORME");
  const qtyGap = lignes.some((l) => l.recu !== l.prevu);
  const problem = cqte !== "CONFORME" || cqual !== "CONFORME" || qtyGap;
  const [ecart, setEcart] = useState({ type: "MANQUANT", action: "REMPLACEMENT", desc: "1 clavier manquant.", dateRes: "", suiviRes: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (lignes.some((l) => l.recu === null || Number.isNaN(l.recu))) return notify("Échec simulé : renseignez la quantité reçue de chaque ligne (mock)."); notify(problem ? `Réception simulée AVEC ÉCART (${ecart.type} → ${ecart.action}) (mock).` : "Réception simulée définitive (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Réception + écarts + PJ — replica ReceptionModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date réception *"><input required type="date" min={today} defaultValue="2026-11-06" className={fieldClass} /></Field>
        <Field label="Réceptionnaire"><input defaultValue="Service Logistique" className={fieldClass} /></Field>
      </div>
      <Field label="Observations (constats finaux)"><input placeholder="Constats finaux de la réception…" className={fieldClass} defaultValue="" /></Field>
      <div>
        <label className={labelClass}>Lignes — prévu / reçu * (écart auto si ≠)</label>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[480px] text-left text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-2">Désignation</th><th className="px-4 py-2 text-center">Prévu</th><th className="px-4 py-2 text-center">Reçu *</th><th className="px-4 py-2 text-center">Écart</th></tr></thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{l.designation}</td>
                  <td className="px-4 py-2 text-center">{l.prevu}</td>
                  <td className="px-4 py-2"><input required type="number" min={0} className={`${fieldClass} mx-auto max-w-[100px] text-center ${l.recu !== l.prevu ? "border-amber-400 bg-amber-50" : ""}`} value={l.recu} onChange={(e) => setLignes(lignes.map((x, j) => (j === i ? { ...x, recu: Number(e.target.value) } : x)))} /></td>
                  <td className="px-4 py-2 text-center font-black">{l.recu !== l.prevu ? <span className="text-amber-600">⚠ {l.prevu - l.recu}</span> : <span className="text-emerald-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className={labelClass}>Conformité quantité *</label><div className="flex gap-2">{[["CONFORME", "Totalité"], ["PARTIELLE", "Partielle"]].map(([v, l]) => <button key={v} type="button" onClick={() => setCqte(v)} className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-black ${cqte === v ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{l}</button>)}</div></div>
        <div><label className={labelClass}>Conformité qualité *</label><div className="flex gap-2">{[["CONFORME", "Conforme"], ["NON_CONFORME", "Non conforme"]].map(([v, l]) => <button key={v} type="button" onClick={() => setCqual(v)} className={`flex-1 rounded-xl border px-3 py-2 text-[12px] font-black ${cqual === v ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200"}`}>{l}</button>)}</div></div>
      </div>
      {problem && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:grid-cols-2">
          <Field label="Type d'écart *"><select className={fieldClass} value={ecart.type} onChange={(e) => setEcart({ ...ecart, type: e.target.value })}><option>MANQUANT</option><option>DEFECTUEUX</option><option>NON_CONFORME</option><option>HORS_SPECIFICATIONS</option></select></Field>
          <Field label="Action corrective *"><select className={fieldClass} value={ecart.action} onChange={(e) => setEcart({ ...ecart, action: e.target.value })}><option>REMPLACEMENT</option><option>REPARATION</option><option>AVOIR</option><option>REJET</option></select></Field>
          <div className="sm:col-span-2"><Field label="Description écart *"><input required className={fieldClass} value={ecart.desc} onChange={(e) => setEcart({ ...ecart, desc: e.target.value })} /></Field></div>
          <Field label="Date de résolution"><input type="date" min={today} className={fieldClass} value={ecart.dateRes} onChange={(e) => setEcart({ ...ecart, dateRes: e.target.value })} /></Field>
          <Field label="Suivi de résolution"><input placeholder="Suivi…" className={fieldClass} value={ecart.suiviRes} onChange={(e) => setEcart({ ...ecart, suiviRes: e.target.value })} /></Field>
        </div>
      )}
      <Field label="PJ : Bon de livraison (PDF)"><input type="file" accept=".pdf,application/pdf" className={fieldClass} onChange={() => {}} /></Field>
      <Field label="PJ : PV de réception (PDF)"><input type="file" accept=".pdf,application/pdf" className={fieldClass} onChange={() => {}} /></Field>
      <button className="btn-primary" type="submit">{problem ? "Valider avec écart (mock)" : "Valider définitivement (mock)"}</button>
    </form>
  );
}

function ResolveIssueDemo({ notify }: { notify: Notify }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Écart simulé résolu (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Résolution d&apos;écart — replica ResolveIssueModal</p>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">Écart constaté — DA n° DA-2026-014 : « 1 carton éventré » (type MANQUANT) (mock).</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de résolution *"><input required type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} className={fieldClass} /></Field>
        <Field label="Commentaire / Solution apportée *"><textarea required placeholder="Expliquez comment l'écart a été résolu…" className={textareaClass} defaultValue="" /></Field>
      </div>
      <button className="btn-primary" type="submit">Confirmer la résolution (mock)</button>
    </form>
  );
}

function ClotureDemo({ notify }: { notify: Notify }) {
  const [satis, setSatis] = useState(0);
  const [statut, setStatut] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!statut) return notify("Échec simulé : sélectionnez le statut final (mock)."); if (!satis) return notify("Échec simulé : veuillez donner une note de satisfaction (mock)."); notify(`Clôture simulée : ${statut}, satisfaction ${satis}/5 (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Clôture finale — replica ClotureModal / ClosureModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de clôture *"><input required type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} className={fieldClass} /></Field>
        <Field label="Statut final *">
          <select required className={fieldClass} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Sélectionnez le statut…</option>
            <option value="CLOTURE">Clôturé avec succès</option>
            <option value="PARTIELLEMENT_EXECUTE">Partiellement exécuté</option>
          </select>
        </Field>
      </div>
      <div><label className={labelClass}>Satisfaction (1–5) *</label><Stars value={satis} onChange={setSatis} /></div>
      <Field label="Commentaires finaux"><textarea defaultValue="Prestation conforme, délai respecté." className={textareaClass} /></Field>
      <button className="btn-primary" type="submit">Valider la clôture (mock)</button>
    </form>
  );
}

/* ================= D. Marchés / DAO ================= */

function ProcurementCreateDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ title: "Fourniture de vaccins — AOI-2026-03", procedure: "", category: "", deadline: "2026-11-15T12:00", publication: "2026-10-02T09:00", optionKey: "", status: "PUBLISHED" });
  const [sources, setSources] = useState<string[]>(["GAVI"]);
  const [refBailleur, setRefBailleur] = useState("GAVI");
  const [ateliers, setAteliers] = useState<string[]>(["2026-10-20T10:00"]);
  const [annexCount, setAnnexCount] = useState(2);
  const catalog: Record<string, { ligne: string; subvention: string }> = {
    SRPS_CS7_FM: { ligne: "SRPS CS7 — Fonds Mondial", subvention: "MDG-S MOH 4041" },
    RSS3_GAVI: { ligne: "RSS3 — GAVI", subvention: "MDG-HSS-3" },
    FAE_GAVI: { ligne: "FAE — GAVI", subvention: "MDG-FAE" },
    CDS_GAVI: { ligne: "CDS — GAVI", subvention: "MDG-CDS" },
    VAR_GAVI: { ligne: "VAR — GAVI", subvention: "MDG-VAR" },
    PARN2_BM_P175110: { ligne: "PARN2 — BM P175110", subvention: "P175110" },
    PARN2_BM_PAD4924: { ligne: "PARN2 — BM PAD4924", subvention: "PAD4924" },
    PPSB_BM_P174903: { ligne: "PPSB — BM P174903", subvention: "P174903" },
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (s: string) => setSources((p) => {
    const next = p.includes(s) ? p.filter((x) => x !== s) : [...p, s];
    if (next.length === 1) setRefBailleur(next[0]);
    return next;
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!sources.length) return notify("Échec simulé : au moins 1 source de financement (mock)."); notify(`Marché simulé publié sur le portail : ${f.title} (mock).`); }} className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>A — Marché (7 sections) — replica procurementForm + create</p>
      <Field label="Intitulé (Section A) *"><input required placeholder="Saisir l'intitulé…" className={fieldClass} value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Procédure">
          <select className={fieldClass} value={f.procedure} onChange={set("procedure")}>
            <option value="">Aucun</option><option value="AOI">AOI</option><option value="AON">AON</option><option value="DC">DC</option><option value="GRE_A_GRE">Gré à gré</option>
          </select>
        </Field>
        <Field label="Catégorie">
          <select className={fieldClass} value={f.category} onChange={(e) => { set("category")(e); if (e.target.value !== "SERVICES") setAteliers([]); }}>
            <option value="">Aucun</option><option>BIENS</option><option>SERVICES</option><option>TRAVAUX</option>
          </select>
        </Field>
        <Field label="Statut"><select className={fieldClass} value={f.status} onChange={set("status")}><option value="PUBLISHED">Publié</option><option value="CANCELLED">Annulé</option><option value="CLOSED">Clôturé</option></select></Field>
      </div>
      <div>
        <label className={labelClass}>Sources de financement (Section B) *</label>
        <div className="flex flex-wrap gap-3">
          {[["FM", "Fonds Mondial"], ["GAVI", "Alliance Gavi"], ["BM", "Banque Mondiale"]].map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold">
              <input type="checkbox" checked={sources.includes(v)} onChange={() => toggle(v)} className="h-4 w-4 accent-emerald-600" />{l}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Référence bailleur">
          {sources.length > 1 ? (
            <select className={fieldClass} value={refBailleur} onChange={(e) => setRefBailleur(e.target.value)}>{sources.map((s) => <option key={s}>{s}</option>)}</select>
          ) : sources.length === 1 ? (
            <input readOnly className={`${fieldClass} bg-slate-50`} value={`${refBailleur} (auto)`} />
          ) : (
            <input readOnly className={`${fieldClass} bg-slate-50`} value="Aucun" />
          )}
        </Field>
        <Field label="Libellé budgétaire (catalogue)">
          {sources.length === 0 ? (
            <input readOnly className={`${fieldClass} bg-slate-50`} value="Aucun — sélectionnez un bailleur" />
          ) : (
            <select className={fieldClass} value={f.optionKey} onChange={set("optionKey")}>
              <option value="">Sélectionner…</option>
              {Object.entries(catalog).map(([k, v]) => <option key={k} value={k}>{k} — {v.ligne}</option>)}
            </select>
          )}
        </Field>
        <Field label="Code projet (auto)"><input readOnly className={fieldClass} value={f.optionKey ? catalog[f.optionKey].subvention : "—"} /></Field>
        <Field label="Date de publication"><input type="datetime-local" className={fieldClass} value={f.publication} onChange={set("publication")} /></Field>
        <Field label="Date limite"><input type="datetime-local" className={fieldClass} value={f.deadline} onChange={set("deadline")} /></Field>
      </div>
      {f.category === "SERVICES" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className={labelClass}>Dates d&apos;atelier (SERVICES uniquement) — chips supprimables</label>
          <div className="flex flex-wrap gap-2">
            {ateliers.map((a, i) => (
              <span key={i} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold shadow-sm">
                {a.replace("T", " ")}
                <button type="button" className="text-red-500" onClick={() => setAteliers(ateliers.filter((_, j) => j !== i))}>✕</button>
              </span>
            ))}
          </div>
          <button type="button" className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold" onClick={() => setAteliers([...ateliers, "2026-10-25T10:00"])}>+ Ajouter une date</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Dossiers techniques (PDF ×n)"><input type="file" accept=".pdf" multiple className={fieldClass} onChange={() => {}} /></Field>
        <div>
          <label className={labelClass}>Annexes (tous types, max 5 — {annexCount}/5)</label>
          <input type="file" multiple disabled={annexCount >= 5} className={`${fieldClass} disabled:opacity-40`} onChange={() => { if (annexCount >= 5) return notify("Échec simulé : 5 annexes maximum (mock)."); setAnnexCount(annexCount + 1); }} />
        </div>
        <Field label="Modèle de soumission (.docx, unique)"><input type="file" accept=".docx" className={fieldClass} onChange={() => {}} /></Field>
      </div>
      <button className="btn-primary" type="submit">Publier sur le portail (mock)</button>
    </form>
  );
}

function ProcurementUpdateDemo({ notify }: { notify: Notify }) {
  const [f, setF] = useState({ title: "Fourniture de vaccins — AOI-2026-03 (v2)", procedure: "AOI", category: "BIENS", publication: "2026-10-02T09:00", deadline: "2026-11-15T12:00", status: "PUBLISHED" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [delTech, setDelTech] = useState<number[]>([]);
  const [delAnnex, setDelAnnex] = useState<number[]>([]);
  const techDocs = [{ id: 101, name: "DAO-complet.pdf" }, { id: 102, name: "CCAG.pdf" }];
  const annexDocs = [{ id: 201, name: "annexe-prix.xlsx" }, { id: 202, name: "plan-livraison.pdf" }];
  const [replaceModel, setReplaceModel] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Marché simulé mis à jour : ${delTech.length} doc(s) technique(s) + ${delAnnex.length} annexe(s) supprimé(s)${replaceModel ? " + modèle remplacé" : ""} → /procurement (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Édition marché — replica procurementUpdateForm + [id]/update (pré-rempli getMarketById)</p>
      <Field label="Intitulé *"><input required className={fieldClass} value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Procédure"><select className={fieldClass} value={f.procedure} onChange={set("procedure")}><option>AOI</option><option>AON</option><option>DC</option><option>GRE_A_GRE</option></select></Field>
        <Field label="Catégorie"><select className={fieldClass} value={f.category} onChange={set("category")}><option>BIENS</option><option>SERVICES</option><option>TRAVAUX</option></select></Field>
        <Field label="Statut"><select className={fieldClass} value={f.status} onChange={set("status")}><option value="PUBLISHED">Publié</option><option value="CANCELLED">Annulé</option><option value="CLOSED">Clôturé</option></select></Field>
        <Field label="Financement"><input readOnly className={`${fieldClass} bg-slate-50`} value="GAVI — RSS3_GAVI / MDG-HSS-3" /></Field>
        <Field label="Publication"><input type="datetime-local" className={fieldClass} value={f.publication} onChange={set("publication")} /></Field>
        <Field label="Date limite"><input type="datetime-local" className={fieldClass} value={f.deadline} onChange={set("deadline")} /></Field>
      </div>
      <div>
        <label className={labelClass}>Documents techniques actuels (cocher = deletedTechnicalDocumentIds[])</label>
        {techDocs.map((d) => (
          <label key={d.id} className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
            <span>📎 {d.name} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px]">ACTUEL</span></span>
            <input type="checkbox" checked={delTech.includes(d.id)} onChange={() => setDelTech((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))} className="h-4 w-4 accent-red-500" />
          </label>
        ))}
        <Field label="Nouveaux documents techniques (PDF)"><input type="file" accept=".pdf" multiple className={fieldClass} onChange={() => {}} /></Field>
      </div>
      <div>
        <label className={labelClass}>Annexes actuelles (cocher = deletedAnnexIds[])</label>
        {annexDocs.map((d) => (
          <label key={d.id} className="mb-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">
            <span>📎 {d.name} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px]">ACTUEL</span></span>
            <input type="checkbox" checked={delAnnex.includes(d.id)} onChange={() => setDelAnnex((p) => (p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id]))} className="h-4 w-4 accent-red-500" />
          </label>
        ))}
        <Field label="Nouvelles annexes (max 5)"><input type="file" multiple className={fieldClass} onChange={() => {}} /></Field>
      </div>
      <div>
        <label className={labelClass}>Modèle de soumission actuel</label>
        <p className="mb-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold">📎 modele-soumission.docx <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px]">ACTUEL</span></p>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold"><input type="checkbox" checked={replaceModel} onChange={() => setReplaceModel(!replaceModel)} className="h-4 w-4 accent-emerald-600" /> Remplacer le modèle (.docx)</label>
        {replaceModel && <input type="file" accept=".docx" className={`${fieldClass} mt-2`} onChange={() => {}} />}
      </div>
      <button className="btn-primary" type="submit">Publier sur le portail (mock)</button>
    </form>
  );
}

function PpmpGridDemo({ notify }: { notify: Notify }) {
  const [tab, setTab] = useState<"works" | "goods-services" | "consultants">("goods-services");
  const methods = tab === "consultants" ? ["sfq", "sfqc", "smc", "sqc", "sci", "sed"] : ["aon", "aoi", "dc", "ed"];
  const [rows, setRows] = useState([
    { ref: "PPM-2026-014", title: "Ordinateurs de bureau (25)", agmo: "UCP / Coordination", fin: "GAVI", bailleur: "RSS3_GAVI", code: "MDG-HSS-3", method: "aon", amount: "62 500 000", status: "En cours (dans les temps)" },
    { ref: "PPM-2026-007", title: "Réhabilitation CSB II", agmo: "DRSP Vakinankaratra", fin: "Fonds Mondial", bailleur: "SRPS_CS7_FM", code: "MDG-S-MOH-4041", method: "aoi", amount: "860 500 000", status: "Non démarré (dans les temps)" },
  ]);
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMode, setPwdMode] = useState<"delete" | "stop">("delete");
  const [eye, setEye] = useState(false);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Planning passation PPMP — replica personnel/formulaire (GridTable)</p>
      <div className="flex flex-wrap items-center gap-2">
        {(["works", "goods-services", "consultants"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-[12px] font-black ${tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{t === "works" ? "Travaux" : t === "goods-services" ? "Biens & Services" : "Consultants"}</button>
        ))}
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black">{rows.length} marchés — Montant total (Ar) {(923000000).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span>
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold" onClick={() => notify("Rafraîchissement simulé du planning (mock).")}>Rafraîchir</button>
      </div>
      <p className="text-[11px] font-bold text-slate-400">Méthode : {tab === "works" ? "Méthode P.M" : tab === "goods-services" ? "Méthode E.P.M" : "Sélection consultants"} — statuts auto recalculés (mock).</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[980px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
            <tr><th className="px-4 py-3">Réf suivi</th><th className="px-4 py-3">Intitulé</th><th className="px-4 py-3">AGMO</th><th className="px-4 py-3">Financement</th><th className="px-4 py-3">Réf bailleur</th><th className="px-4 py-3">Méthode</th><th className="px-4 py-3">Montant (Ar)</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono font-black">{r.ref}</td>
                <td className="px-4 py-2"><input className={fieldClass} value={r.title} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></td>
                <td className="px-4 py-2">{r.agmo}</td>
                <td className="px-4 py-2">{r.fin}</td>
                <td className="px-4 py-2 font-mono text-[11px]">{r.bailleur}</td>
                <td className="px-4 py-2"><select className={fieldClass} value={r.method} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}>{methods.map((m) => <option key={m}>{m}</option>)}</select></td>
                <td className="px-4 py-2 font-bold tabular-nums">{r.amount}</td>
                <td className="px-4 py-2"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{r.status}</span></td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button type="button" className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-black" onClick={() => notify(`Ligne simulée sauvegardée : ${r.ref} (mock).`)}>Sauver</button>
                    <button type="button" className="rounded-lg border border-amber-300 px-2 py-1.5 text-[11px] font-black text-amber-700" onClick={() => { setPwdMode("stop"); setShowPwd(true); }}>Arrêter</button>
                    <button type="button" className="rounded-lg border border-red-200 px-2 py-1.5 text-[11px] font-black text-red-600" onClick={() => { setPwdMode("delete"); setShowPwd(true); }}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPwd && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-800">{pwdMode === "delete" ? "Supprimer la ligne" : "Arrêter la ligne"} — mot de passe requis (mock).</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type={eye ? "text" : "password"} placeholder="Mot de passe" className={`${fieldClass} pr-12`} value={pwd} onChange={(e) => setPwd(e.target.value)} />
              <button type="button" onClick={() => setEye(!eye)} aria-label="Afficher/masquer" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">👁</button>
            </div>
            <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${pwdMode === "delete" ? "bg-red-600" : "bg-amber-600"}`} onClick={() => { if (!pwd.trim()) return notify("Échec simulé : mot de passe vide — action annulée (mock)."); setShowPwd(false); setPwd(""); notify(pwdMode === "delete" ? "Suppression simulée autorisée (mock)." : "Arrêt simulé enregistré (mock)."); }}>Confirmer</button>
            <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold" onClick={() => { setShowPwd(false); setPwd(""); notify("Action annulée (mock)."); }}>Annuler</button>
          </div>
        </div>
      )}
      <button type="button" className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold" onClick={() => { if (rows.some((r) => r.ref.includes("_new_"))) return notify("Échec simulé : sauvegardez la ligne _new_ avant d'en ajouter une (mock)."); setRows([...rows, { ref: "PPM-2026-_new_", title: "", agmo: "—", fin: "—", bailleur: "—", code: "—", method: methods[0], amount: "0", status: "Brouillon" }]); }}>+ Ajouter une ligne (mock)</button>
    </div>
  );
}

function PublicListDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const [adv, setAdv] = useState(false);
  const [dates, setDates] = useState({ pubAfter: "", pubBefore: "", deadAfter: "", deadBefore: "" });
  const [page, setPage] = useState(1);
  const [fiche, setFiche] = useState<string | null>(null);
  const setD = (k: keyof typeof dates) => (e: React.ChangeEvent<HTMLInputElement>) => setDates((p) => ({ ...p, [k]: e.target.value }));
  const list = [
    { ref: "AOI-2026-03", title: "Fourniture de vaccins & chaîne de froid", proc: "AOI", cat: "BIENS", montant: "1 240 000 000 Ar", online: "02/10/2026", deadline: "15/11/2026 12:00", countdown: "J-44", bailleur: "GAVI", refB: "MDG-S-MOH-4041", code: "MDG-S-MOH-4041", ateliers: [] as string[], annexes: ["DAO-complet.pdf", "annexe-prix.xlsx"] },
    { ref: "DC-2026-11", title: "Formation logistique — 40 agents", proc: "DC", cat: "SERVICES", montant: "68 250 000 Ar", online: "08/10/2026", deadline: "05/11/2026 16:00", countdown: "J-34", bailleur: "GAVI", refB: "RSS3_GAVI", code: "MDG-HSS-3", ateliers: ["20/10/2026 10:00", "25/10/2026 10:00"], annexes: ["TDR-formation.pdf"] },
    { ref: "AON-2026-07", title: "Travaux réhabilitation CSB II Antsirabe", proc: "AON", cat: "TRAVAUX", montant: "860 500 000 Ar", online: "05/10/2026", deadline: "28/11/2026 10:00", countdown: "J-57", bailleur: "Fonds Mondial", refB: "SRPS_CS7_FM", code: "MDG-S-MOH-4041", ateliers: [] as string[], annexes: ["plans-csb.pdf", "devis-quantitatif.xlsx"] },
  ].filter((m) => (m.ref + m.title + m.code).toLowerCase().includes(q.toLowerCase()));
  const f = list.find((m) => m.ref === fiche);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>DAO publics — replica procurement (liste + détail [id])</p>
      <div className="flex gap-2">
        <input placeholder="Recherche titre / référence / code…" className={fieldClass} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setAdv(!adv)}>Filtres avancés {adv ? "▾" : "▸"}</button>
      </div>
      {adv && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Publié après"><input type="date" className={fieldClass} value={dates.pubAfter} onChange={setD("pubAfter")} /></Field>
          <Field label="Publié avant"><input type="date" className={fieldClass} value={dates.pubBefore} onChange={setD("pubBefore")} /></Field>
          <Field label="Limite après"><input type="date" className={fieldClass} value={dates.deadAfter} onChange={setD("deadAfter")} /></Field>
          <Field label="Limite avant"><input type="date" className={fieldClass} value={dates.deadBefore} onChange={setD("deadBefore")} /></Field>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify(`Recherche simulée : ${list.length} DAO (mock).`)}>Rechercher</button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold" onClick={() => { setQ(""); setDates({ pubAfter: "", pubBefore: "", deadAfter: "", deadBefore: "" }); }}>Effacer tous les filtres</button>
          </div>
        </div>
      )}
      {list.map((m) => (
        <div key={m.ref} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setFiche(m.ref)} className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] font-black text-white hover:bg-slate-700">{m.ref}</button>
            {m.proc === "DC" && <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">DC – Réponse sous 5 jours</span>}
            <span className="ml-auto text-[11px] font-bold text-red-600">⏳ {m.countdown} — Limite : {m.deadline}</span>
          </div>
          <p className="mt-2 font-black text-slate-900">{m.title}</p>
          <p className="text-[12px] font-semibold text-slate-500">En ligne le {m.online} — {m.montant}</p>
          <p className="text-[12px] font-semibold text-slate-500">Financement : {m.bailleur} — Réf. Bailleur : {m.refB}</p>
          {m.ateliers.length > 0 && <p className="text-[12px] font-semibold text-slate-500">Ateliers : {m.ateliers.join(" · ")}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {m.annexes.map((a) => (
              <button key={a} type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600" onClick={() => notify(`Annexe simulée téléchargée : ${a} (tracking DOWNLOAD_ANNEXE mock).`)}>📎 {a}</button>
            ))}
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify(`DAO complet simulé téléchargé (${m.ref}) — connecté (mock).`)}>Télécharger DAO complet</button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold" onClick={() => setFiche(fiche === m.ref ? null : m.ref)}>{fiche === m.ref ? "Fermer la fiche" : "Voir la fiche [id]"}</button>
          </div>
          {fiche === m.ref && f && (
            <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-4 text-[12px] font-medium text-slate-600">
              <p><span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">PUBLISHED</span></p>
              <p><span className="font-black">1. Caractéristiques :</span> {f.proc} — {f.cat} — Code projet {f.code} — Modèle : modele-soumission.docx</p>
              <p><span className="font-black">2. Financement :</span> {f.bailleur} — Réf. Bailleur {f.refB}</p>
              <p><span className="font-black">3. Calendrier :</span> publié le {f.online} — limite {f.deadline}{f.ateliers.length > 0 && <> — ateliers {f.ateliers.join(" · ")}</>}</p>
              <p><span className="font-black">4. Pièces jointes :</span> {f.annexes.join(", ")}</p>
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <p className="text-sm font-semibold text-slate-400">Aucun DAO (mock).</p>}
      <div className="flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">← Précédent</button>
        <span className="text-[12px] font-black">Page {page} sur 3 — 10 / page (mock)</span>
        <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Suivant →</button>
      </div>
    </div>
  );
}

/* ================= E. Séances d'ouverture ================= */

function SeanceNewDemo({ notify }: { notify: Notify }) {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ ref: "DAO-2026-011", objet: "Ouverture AOI vaccins", statut: "BROUILLON", date: "2026-10-10", heure: "10:00", lieu: "Salle UCP", president: "", obs: "Séance publique." });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const users = ["Mme Rabe (Présidente)", "A. Rakoto", "B. Rabe", "C. Randria", "D. Rivo"];
  const [members, setMembers] = useState([
    { nom: "A. Rakoto", email: "a.rakoto@ucp.mg", cin: "101234567890", poste: "Passation", entite: "UCP" },
    { nom: "B. Rabe", email: "b.rabe@ucp.mg", cin: "101234567891", poste: "Finance", entite: "UCP" },
    { nom: "C. Randria", email: "c.randria@ucp.mg", cin: "101234567892", poste: "Logistique", entite: "UCP" },
  ]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (members.length < 3) return notify(`Échec simulé : commission incomplète (${members.length}/3 min) — membres complets actuellement : ${members.length} / 3 (mock).`); notify(`Séance simulée créée : ${f.ref} (${members.length} membres) → /ouverture_offre/SE-2026-011 (mock).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Nouvelle séance — replica ouverture_offre/new</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Référence dossier *"><input required placeholder="Ex. DAO-2026-001" className={fieldClass} value={f.ref} onChange={set("ref")} /></Field>
        <Field label="Objet *"><input required className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Statut *">
          <select className={fieldClass} value={f.statut} onChange={set("statut")}>
            <option>BROUILLON</option><option>EN_SAISIE</option><option>A_VALIDER</option><option>EN_VALIDATION_MEMBRES</option><option>EN_VALIDATION_PRESIDENT</option><option>VALIDEE</option><option>REJETEE</option>
          </select>
        </Field>
        <Field label="Date de séance *"><input required type="date" min={today} className={fieldClass} value={f.date} onChange={set("date")} /></Field>
        <Field label="Heure *"><input required type="time" className={fieldClass} value={f.heure} onChange={set("heure")} /></Field>
        <Field label="Lieu *"><input required className={fieldClass} value={f.lieu} onChange={set("lieu")} /></Field>
        <Field label="Président de séance">
          <select className={fieldClass} value={f.president} onChange={set("president")}>
            <option value="">Non désigné</option>
            {users.filter((u) => !members.some((m) => m.nom === u)).map((u) => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Observations"><textarea className={textareaClass} value={f.obs} onChange={set("obs")} /></Field>
      </div>
      <div>
        <label className={labelClass}>Membres de commission (≥ 3 requis) — président exclu</label>
        {members.map((m, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-6">
            <input required className={fieldClass} value={m.nom} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} placeholder="Nom et prénoms *" />
            <input required type="email" className={fieldClass} value={m.email} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} placeholder="Email *" />
            <input required className={fieldClass} value={m.cin} maxLength={12} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, cin: e.target.value.replace(/\D/g, "") } : x)))} placeholder="CIN (12 chiffres) *" />
            <input className={fieldClass} value={m.poste} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, poste: e.target.value } : x)))} placeholder="Poste" />
            <input className={fieldClass} value={m.entite} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, entite: e.target.value } : x)))} placeholder="Entité" />
            <button type="button" className="rounded-xl border border-red-200 px-2 text-red-500" onClick={() => setMembers(members.filter((_, j) => j !== i))} aria-label="Supprimer">✕</button>
          </div>
        ))}
        <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold" onClick={() => setMembers([...members, { nom: "", email: "", cin: "", poste: "", entite: "" }])}>+ Ajouter un membre (recherche annuaire mock)</button>
      </div>
      <div className="flex gap-2">
        <button type="button" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold" onClick={() => notify("Création simulée annulée (mock).")}>Annuler</button>
        <button className="btn-primary" type="submit">Créer la séance (mock)</button>
      </div>
    </form>
  );
}

function MembresDemo({ notify }: { notify: Notify }) {
  const [rows, setRows] = useState([
    { nom: "A. Rakoto", email: "a.rakoto@ucp.mg", cin: "101234567890", poste: "Passation", entite: "UCP" },
    { nom: "B. Rabe", email: "b.rabe@ucp.mg", cin: "101234567891", poste: "Finance", entite: "UCP" },
    { nom: "C. Randria", email: "c.randria@ucp.mg", cin: "101234567892", poste: "Logistique", entite: "UCP" },
  ]);
  const [saved, setSaved] = useState<"draft" | "final" | null>(null);
  const validateFinal = () => {
    if (rows.length < 3) return `Commission incomplète : ${rows.length}/3 membres minimum (mock).`;
    for (const r of rows) {
      if (!r.nom.trim() || !r.email.trim() || !r.poste.trim() || !r.entite.trim()) return "Échec simulé : tous les champs sont requis en final (mock).";
      if (!/^\d{12}$/.test(r.cin)) return `Échec simulé : CIN invalide pour ${r.nom || "?"} — 12 chiffres requis (mock).`;
    }
    const mails = rows.map((r) => r.email.toLowerCase());
    if (new Set(mails).size !== mails.length) return "Échec simulé : e-mails en double détectés (mock).";
    return null;
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); const err = validateFinal(); if (err) return notify(`Échec simulé : ${err}`); setSaved("final"); notify("Composition simulée enregistrée FINALE (mock)."); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Membres des commissions — replica ouverture_offre/membres</p>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black">DAO-2026-011 — badge : BROUILLON (mock)</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black">Total : {rows.length} (mock)</span>
        {saved && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800">Dernier enregistrement : {saved === "draft" ? "brouillon" : "final"} (mock)</span>}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-6">
          <input className={fieldClass} value={r.nom} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} placeholder="Nom *" />
          <input type="email" className={fieldClass} value={r.email} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} placeholder="Email *" />
          <input className={fieldClass} value={r.cin} maxLength={12} inputMode="numeric" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, cin: e.target.value.replace(/\D/g, "") } : x)))} placeholder="CIN 12 chiffres *" />
          <input className={fieldClass} value={r.poste} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, poste: e.target.value } : x)))} placeholder="Poste *" />
          <input className={fieldClass} value={r.entite} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, entite: e.target.value } : x)))} placeholder="Entité *" />
          <button type="button" className="rounded-xl border border-red-200 px-2 text-red-500" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Supprimer la ligne">✕</button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setRows([...rows, { nom: "", email: "", cin: "", poste: "", entite: "" }])}>+ Ajouter une ligne</button>
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => { setSaved("draft"); notify("Brouillon simulé sauvegardé — contrôle libre (localStorage mock)."); }}>Sauver brouillon</button>
        <button type="submit" className="btn-primary">Enregistrer final (mock)</button>
      </div>
    </form>
  );
}

function ValidationPubliqueDemo({ notify }: { notify: Notify }) {
  const [phase, setPhase] = useState<"acces" | "decision">("acces");
  const [role, setRole] = useState<"membre" | "president">("membre");
  const [show, setShow] = useState(false);
  const [decision, setDecision] = useState("VALIDER");
  const [comment, setComment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation publique — replica validation/[id] (lien e-mail, sans JWT)</p>
      {phase === "acces" ? (
        <form
          onSubmit={(e) => { e.preventDefault(); setPhase("decision"); notify(`Session publique simulée ouverte (${role}) (mock).`); }}
          className="space-y-4"
        >
          <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Phase 1 — Accès via le lien reçu (?role={role} verrouillé, mock).</p>
          <div className="flex gap-3">
            {(["membre", "president"] as const).map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${role === r ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"}`}>
                <input type="radio" checked={role === r} onChange={() => { setRole(r); setDecision(r === "president" ? "APPROUVER" : "VALIDER"); }} />{r === "membre" ? "Membre" : "Président"}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email *"><input required type="email" defaultValue="membre@commission.mg" className={fieldClass} /></Field>
            <div>
              <label className={labelClass}>Mot de passe reçu par mail *</label>
              <div className="relative">
                <input required type={show ? "text" : "password"} defaultValue="demo1234" className={`${fieldClass} pr-12`} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">👁</button>
              </div>
            </div>
          </div>
          <button className="btn-primary" type="submit">Ouvrir la séance (mock)</button>
        </form>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (decision === "REJETER" && !comment.trim()) return notify("Échec simulé : commentaire requis pour REJETER (mock)."); if (decision === "REPORTER" && !comment.trim()) return notify("Échec simulé : commentaire + date requis pour REPORTER (mock)."); setConfirmOpen(true); }}
          className="space-y-4"
        >
          <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Phase 2 — Décision ({role}).</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[13px] font-medium text-slate-600">
            <p className="font-black text-slate-900">SE-2026-011 — Ouverture AOI vaccins</p>
            <p>Réf bailleur MDG-S-MOH-4041 — Limite 15/11/2026 12:00 — 4 plis reçus — Commission : 3 membres + présidente (mock).</p>
          </div>
          <Field label="Décision">
            <select className={fieldClass} value={decision} onChange={(e) => setDecision(e.target.value)}>
              {role === "membre" ? ["VALIDER", "REJETER"].map((o) => <option key={o}>{o}</option>) : ["APPROUVER", "REPORTER", "REJETER"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          {decision === "REPORTER" && <Field label="Date de report * (président)"><input required type="date" min={new Date().toISOString().slice(0, 10)} className={fieldClass} /></Field>}
          <Field label="Observation (requise si rejet / report)"><textarea className={textareaClass} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
          <div className="flex gap-2">
            <button type="button" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold" onClick={() => setPhase("acces")}>← Retour accès</button>
            <button className="btn-primary" type="submit">Signer & soumettre (mock)</button>
          </div>
        </form>
      )}
      {confirmOpen && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-900">Confirmer la signature — ressaisissez le mot de passe reçu :</p>
          <div className="mt-2 flex gap-2">
            <input required type="password" placeholder="Mot de passe de validation" className={fieldClass} defaultValue="" />
            <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white" onClick={() => { setConfirmOpen(false); notify(`Décision publique simulée signée : ${decision} (${role}) (mock).`); }}>Confirmer</button>
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setConfirmOpen(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationCompositionDemo({ notify }: { notify: Notify }) {
  const [filter, setFilter] = useState("ACTION_REQUIRED");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("SE-2026-011");
  const [comment, setComment] = useState("");
  const dossiers = [
    { ref: "SE-2026-011", objet: "Ouverture AOI vaccins", membres: 4, urgent: true, etat: "À voter", title: "Fourniture de vaccins & chaîne de froid", fin: "GAVI — MDG-S-MOH-4041", deadline: "15/11/2026 12:00", code: "MDG-S-MOH-4041", proc: "AOI", cat: "BIENS", pub: "02/10/2026" },
    { ref: "SE-2026-009", objet: "Ouverture AON réhabilitation", membres: 3, urgent: false, etat: "À voter", title: "Travaux réhabilitation CSB II Antsirabe", fin: "Fonds Mondial — MDG-S-MOH-4041", deadline: "28/11/2026 10:00", code: "MDG-S-MOH-4041", proc: "AON", cat: "TRAVAUX", pub: "05/10/2026" },
  ].filter((d) => (d.ref + d.objet).toLowerCase().includes(q.toLowerCase()));
  const d = dossiers.find((x) => x.ref === sel) ?? dossiers[0];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation composition — replica validation-membres (RPM/GP/CN)</p>
      <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Connecté : Rôle RPM — vote requis si « ma décision = EN_ATTENTE » (mock).</p>
      <div className="flex flex-wrap gap-2">
        {[["ALL", 2], ["ACTION_REQUIRED", 2], ["URGENT", 1], ["ARCHIVED", 5]].map(([f, n]) => <button key={f as string} type="button" onClick={() => setFilter(f as string)} className={`rounded-xl px-3 py-1.5 text-[11px] font-black ${filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>{f} · {n}</button>)}
      </div>
      <input placeholder="Rechercher un DAO… (réf / objet)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Compositions à valider</p>
          {dossiers.map((x) => (
            <button key={x.ref} type="button" onClick={() => setSel(x.ref)} className={`w-full rounded-2xl border px-4 py-3 text-left ${sel === x.ref ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <span className="font-mono text-[12px] font-black">{x.ref}</span>
              {x.urgent && <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">URGENT</span>}
              <span className="block text-[12px] font-bold text-slate-600">{x.objet} — {x.membres} membres — {x.etat}</span>
            </button>
          ))}
          {dossiers.length === 0 && <p className="text-[12px] font-semibold text-slate-400">Aucun DAO ne correspond à cette recherche.</p>}
        </div>
        {d && (
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="font-black">{d.ref} — {d.title}</p>
            <p className="text-[12px] font-semibold text-slate-500">{d.fin} — Limite {d.deadline} — Projet {d.code} — {d.proc}/{d.cat} — Publié le {d.pub}</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-black">
              {["RPM", "GP", "CN"].map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  <span className={`rounded-full px-3 py-1 ${i === 0 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>{s}{i === 0 ? " ✓" : ""}</span>
                  {i < 2 && <span className="text-slate-300">→</span>}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[["A. Rakoto", "Passation", "UCP", "101234567890", "a.rakoto@ucp.mg"], ["B. Rabe", "Finance", "UCP", "101234567891", "b.rabe@ucp.mg"], ["C. Randria", "Logistique", "UCP", "101234567892", "c.randria@ucp.mg"], ["Mme Rabe", "Présidente", "UCP", "101234567893", "p.rabe@ucp.mg"]].map((m) => (
                <div key={m[4]} className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"><span className="font-black">{m[0]}</span> — {m[1]} — {m[2]}<span className="block font-mono text-[11px] text-slate-400">CIN {m[3]} — {m[4]}</span></div>
              ))}
            </div>
            <Field label="Commentaire (≥ 5 caractères si rejet)"><textarea className={textareaClass} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white" onClick={() => notify(`Composition simulée VALIDÉE : ${d.ref} (mock).`)}>Valider la composition</button>
              <button type="button" className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600" onClick={() => { if (comment.trim().length < 5) return notify("Échec simulé : motif ≥ 5 caractères requis (mock)."); notify(`Composition simulée RENVOYÉE : ${d.ref} (mock).`); }}>Demander modification</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= F. Évaluation ================= */

function EvalWizardDemo({ notify }: { notify: Notify }) {
  const [step, setStep] = useState(2);
  const [pre, setPre] = useState<Record<string, string>>({ offre_signee: "Oui", garantie_conforme: "Oui", dossier_admin_complet: "Oui", validite_conforme: "Oui", conditions_acceptees: "Oui" });
  const [notes, setNotes] = useState([4, 3.5, 4.5]);
  const [preComment, setPreComment] = useState("");
  const [fin, setFin] = useState({ lu: 48500000, corrections: 600000, rabais: 0, moinsDisant: 47900000 });
  const [reco, setReco] = useState("ATTRIBUER");
  const final = fin.lu - fin.corrections - fin.rabais;
  const finScore = final > 0 ? Math.round((fin.moinsDisant / final) * 100) : 0;
  const pond = [40, 35, 25];
  const techScore = Math.round(notes.reduce((a, b, i) => a + (b / 5) * pond[i], 0));
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
          {!blocked && <p className="rounded-xl bg-emerald-50 px-4 py-2 text-[12px] font-black text-emerald-700">✓ Examen préliminaire : Conforme (mock).</p>}
          <Field label="Commentaire préliminaire"><textarea className={textareaClass} value={preComment} onChange={(e) => setPreComment(e.target.value)} placeholder="Précisions sur l'examen préliminaire…" /></Field>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          {notes.map((n, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              <span className="w-44 text-[12px] font-bold">Critère C{i + 1} (pond. {pond[i]}%)</span>
              <input type="number" min={0} max={5} step={0.5} value={n} onChange={(e) => setNotes(notes.map((x, j) => (j === i ? Number(e.target.value) : x)))} className={`${fieldClass} max-w-[110px]`} />
              <span className="text-[12px] font-bold text-slate-400">/ 5 → {Math.round((n / 5) * 100)}/100 → pondérée {((n / 5) * pond[i]).toFixed(1)}</span>
            </div>
          ))}
          <p className="text-sm font-black">Score technique : {techScore}/100 — seuil 70 {techScore >= 70 ? "✓ QUALIFIÉ" : "✗ ÉLIMINÉ"}</p>
        </div>
      )}
      {step === 4 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Montant lu *"><input type="number" className={fieldClass} value={fin.lu} onChange={(e) => setFin({ ...fin, lu: Number(e.target.value) })} /></Field>
          <Field label="Corrections arithmétiques"><input type="number" className={fieldClass} value={fin.corrections} onChange={(e) => setFin({ ...fin, corrections: Number(e.target.value) })} /></Field>
          <Field label="Rabais accordés"><input type="number" className={fieldClass} value={fin.rabais} onChange={(e) => setFin({ ...fin, rabais: Number(e.target.value) })} /></Field>
          <Field label="Offre moins-disante (auto)"><input type="number" className={fieldClass} value={fin.moinsDisant} onChange={(e) => setFin({ ...fin, moinsDisant: Number(e.target.value) })} /></Field>
          <p className="font-black sm:col-span-2">Final = lu − corrections − rabais = {final.toLocaleString("fr-FR")} Ar — Score financier = moins-disant / final × 100 = {finScore}/100</p>
        </div>
      )}
      {step === 5 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Technique (60%)</p><p className="text-2xl font-black">{techScore}</p></div>
          <div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Financier (40%)</p><p className="text-2xl font-black">{finScore}</p></div>
          <div className="rounded-2xl bg-emerald-600 p-4 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Score final /100</p><p className="text-2xl font-black">{Math.round(techScore * 0.6 + finScore * 0.4)}</p></div>
        </div>
      )}
      {step === 6 && (
        <div className="space-y-3">
          <Field label="Recommandation"><select className={fieldClass} value={reco} onChange={(e) => setReco(e.target.value)}><option>ATTRIBUER</option><option>REJETER</option><option>RELANCER</option></select></Field>
          <Field label="Justification"><textarea defaultValue="Offre conforme, mieux-disante technique et financière." className={textareaClass} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" /> Déclaration d&apos;absence de conflit (OUI requis)</label>
          <Field label="Mot de passe DAO (reçu par mail) — signature *"><input required type="password" defaultValue="eval2026" className={fieldClass} /></Field>
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
  const [open, setOpen] = useState(1);
  const [exam, setExam] = useState<Record<string, string>>({ offre_signee: "O", garantie: "O", dossier_admin: "O", validite: "O", conditions_acceptees: "O" });
  const [examComs, setExamComs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState([4, 3.5]);
  const [fin, setFin] = useState({ lu: 48500000, corrections: 600000, rabais: 0, moinsDisante: 47900000 });
  const [reco, setReco] = useState("ATTRIBUER");
  const [justif, setJustif] = useState("Offre conforme sur tous les critères.");
  const [conflit, setConflit] = useState(true);
  const conforme = Object.values(exam).every((v) => v === "O");
  const tech = Math.round(((notes[0] / 5) * 60 + (notes[1] / 5) * 40));
  const final = fin.lu - fin.corrections - fin.rabais;
  const finS = final > 0 ? Math.round((fin.moinsDisante / final) * 100) : 0;
  const crits = [["offre_signee", "Offre signée"], ["garantie", "Garantie conforme"], ["dossier_admin", "Dossier administratif"], ["validite", "Validité de l'offre"], ["conditions_acceptees", "Conditions acceptées"]];
  const head = (n: number, t: string) => (
    <button type="button" onClick={() => setOpen(open === n ? 0 : n)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black ${open === n ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>
      <span>{n}. {t}</span><span>{open === n ? "▾" : "▸"}</span>
    </button>
  );
  return (
    <div className={`${cardClass} space-y-3`}>
      <p className={sectionTitleClass}>Évaluation 4 étapes — replica EvaluationForm (legacy accordéon)</p>
      {head(1, "Examen préliminaire")}
      {open === 1 && (
        <div className="space-y-2 rounded-2xl border border-slate-100 p-3">
          {crits.map(([k, l]) => (
            <div key={k} className="rounded-xl border border-slate-200 px-3 py-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{l}</span>
                <div className="flex gap-1">{["O", "N"].map((v) => <button key={v} type="button" onClick={() => setExam({ ...exam, [k]: v })} className={`rounded-lg px-3 py-1 text-[12px] font-black ${exam[k] === v ? (v === "O" ? "bg-emerald-600 text-white" : "bg-red-600 text-white") : "bg-slate-100"}`}>{v === "O" ? "Oui" : "Non"}</button>)}</div>
              </div>
              <input placeholder={`Commentaire ${l.toLowerCase()} (optionnel)`} className={`${fieldClass} mt-2`} value={examComs[k] ?? ""} onChange={(e) => setExamComs({ ...examComs, [k]: e.target.value })} />
            </div>
          ))}
          <p className={`rounded-xl px-3 py-2 text-[12px] font-black ${conforme ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{conforme ? "✓ Conforme — accès à la notation technique." : "⛔ Non conforme — notation technique bloquée (mock)."}</p>
        </div>
      )}
      {head(2, "Notation technique (/5, seuil 70)")}
      {open === 2 && (
        <div className="space-y-2 rounded-2xl border border-slate-100 p-3">
          {notes.map((n, i) => (
            <div key={i} className="flex items-center gap-3 text-[12px] font-bold">
              <span className="w-36">Critère T{i + 1}</span>
              <input type="number" min={0} max={5} step={0.5} value={n} disabled={!conforme} onChange={(e) => setNotes(notes.map((x, j) => (j === i ? Number(e.target.value) : x)))} className={`${fieldClass} max-w-[110px]`} />
              <span className="text-slate-400">/ 5</span>
            </div>
          ))}
          <p className="text-sm font-black">Score : {tech}/100 {tech >= 70 ? "✓" : "✗ seuil 70 — financière bloquée (mock)"}</p>
        </div>
      )}
      {head(3, "Offre financière")}
      {open === 3 && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 p-3 sm:grid-cols-2">
          <Field label="Montant lu *"><input type="number" className={fieldClass} value={fin.lu} onChange={(e) => setFin({ ...fin, lu: Number(e.target.value) })} /></Field>
          <Field label="Corrections"><input type="number" className={fieldClass} value={fin.corrections} onChange={(e) => setFin({ ...fin, corrections: Number(e.target.value) })} /></Field>
          <Field label="Rabais"><input type="number" className={fieldClass} value={fin.rabais} onChange={(e) => setFin({ ...fin, rabais: Number(e.target.value) })} /></Field>
          <Field label="Offre moins-disante"><input type="number" className={fieldClass} value={fin.moinsDisante} onChange={(e) => setFin({ ...fin, moinsDisante: Number(e.target.value) })} /></Field>
          <p className="text-sm font-black sm:col-span-2">Final {final.toLocaleString("fr-FR")} Ar — score {finS}/100</p>
        </div>
      )}
      {head(4, "Conclusion & signature")}
      {open === 4 && (
        <div className="space-y-3 rounded-2xl border border-slate-100 p-3">
          <p className="text-[12px] font-bold text-slate-500">Résumé : technique {tech} (60%) + financier {finS} (40%) = {Math.round(tech * 0.6 + finS * 0.4)}/100</p>
          <Field label="Recommandation"><select className={fieldClass} value={reco} onChange={(e) => setReco(e.target.value)}><option>ATTRIBUER</option><option>REJETER</option><option>RELANCER</option></select></Field>
          <Field label={`Justification (min 10 — ${justif.trim().length}/10) *`}><textarea required minLength={10} className={textareaClass} value={justif} onChange={(e) => setJustif(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={conflit} onChange={(e) => setConflit(e.target.checked)} className="h-4 w-4 accent-emerald-600" /> Déclaration d&apos;absence de conflit (OUI requis)</label>
          <Field label="Mot de passe (si session sans token, min 6)"><input type="password" defaultValue="eval2026" className={fieldClass} /></Field>
          <button type="button" className="btn-primary" onClick={() => { if (!conforme) return notify("Échec simulé : examen non conforme (mock)."); if (justif.trim().length < 10) return notify("Échec simulé : justification ≥ 10 caractères (mock)."); if (!conflit) return notify("Échec simulé : déclaration de conflit requise (mock)."); notify(`Évaluation legacy simulée transmise : ${reco} (mock).`); }}>Transmettre ({reco})</button>
        </div>
      )}
    </div>
  );
}

function AssignDemo({ notify }: { notify: Notify }) {
  const [evalList, setEvalList] = useState([
    { nom: "Dr H. Randria", cin: "101234567890", entite: "UCP", poste: "Expert", email: "h.randria@ucp.mg" },
    { nom: "M. T. Rakoto", cin: "201234567891", entite: "Santé", poste: "Pharmacien", email: "t.rakoto@sante.mg" },
    { nom: "Mme S. Rabe", cin: "301234567892", entite: "UCP", poste: "Financière", email: "s.rabe@ucp.mg" },
  ]);
  const [offres, setOffres] = useState([
    { nom: "EURL MediDistrib — pli n°1", lot: "Lot 1", nif: "5001234" },
    { nom: "Vakinankaratra SARL — pli n°2", lot: "Lot 1", nif: "5005678" },
    { nom: "Miaro Conseil — pli n°3", lot: "Lot 2", nif: "5009012" },
    { nom: "Société Antsirabe — pli n°4", lot: "Lot 2", nif: "5013456" },
  ]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        for (const o of offres) {
          if (!o.lot.trim() || !o.nif.trim()) return notify("Échec simulé : lot et NIF/STAT requis pour chaque offre (mock).");
        }
        for (const v of evalList) {
          if (!v.nom.trim() || !v.entite.trim() || !v.poste.trim() || !v.email.trim()) return notify("Échec simulé : tous les champs évaluateurs sont requis (mock).");
          if (v.cin.length !== 12) return notify(`Échec simulé : CIN invalide (${v.nom || "?"}) — 12 chiffres requis (mock).`);
        }
        const mails = evalList.map((v) => v.email.toLowerCase());
        if (new Set(mails).size !== mails.length) return notify("Échec simulé : les 3 e-mails doivent être distincts (mock).");
        notify("3 évaluateurs simulés assignés + invitations envoyées (mock).");
      }}
      className={`${cardClass} space-y-4`}
    >
      <p className={sectionTitleClass}>Assignation 3 évaluateurs — replica [id]/assign</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-semibold text-slate-600">DAO AOI-2026-03 — Fourniture de vaccins — Biens — Limite 15/11 — Représentant Budget : Paul Budget — 4 offres (mock)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date d'évaluation *"><input required type="date" defaultValue="2026-11-20" className={fieldClass} /></Field>
        <Field label="Heure *"><input required type="time" defaultValue="09:00" className={fieldClass} /></Field>
      </div>
      <div>
        <label className={labelClass}>Offres — lot + NIF/STAT * (par soumissionnaire)</label>
        {offres.map((o, i) => (
          <div key={i} className="mb-2 grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
            <input readOnly className={`${fieldClass} bg-slate-50`} value={o.nom} />
            <input required placeholder="N° lot *" className={fieldClass} value={o.lot} onChange={(e) => setOffres(offres.map((x, j) => (j === i ? { ...x, lot: e.target.value } : x)))} />
            <input required placeholder="NIF/STAT *" className={fieldClass} value={o.nif} onChange={(e) => setOffres(offres.map((x, j) => (j === i ? { ...x, nif: e.target.value } : x)))} />
          </div>
        ))}
      </div>
      {evalList.map((ev, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-5">
          <input required className={fieldClass} value={ev.nom} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} placeholder="Nom *" />
          <input required className={fieldClass} value={ev.cin} maxLength={12} inputMode="numeric" onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, cin: e.target.value.replace(/\D/g, "") } : x)))} placeholder="CIN 12 *" />
          <input required className={fieldClass} value={ev.entite} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, entite: e.target.value } : x)))} placeholder="Entité *" />
          <input required className={fieldClass} value={ev.poste} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, poste: e.target.value } : x)))} placeholder="Poste *" />
          <input required type="email" className={fieldClass} value={ev.email} onChange={(e) => setEvalList(evalList.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} placeholder="Email *" />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" type="submit">Envoyer les accès (mock)</button>
        <button type="button" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold" onClick={() => notify("Invitations simulées renvoyées (nouveaux mots de passe) (mock).")}>Renvoyer les invitations</button>
      </div>
    </form>
  );
}

function OffresClassementDemo({ notify }: { notify: Notify }) {
  const offres = [
    { ordre: 1, soum: "EURL MediDistrib", lot: "Lot 1", montant: "47 900 000 Ar", prog: "Terminée", total: 89.4, tech: 85.0, fin: 96.0, statut: "VALIDÉE", badge: "✓ qualifiée & conforme" },
    { ordre: 2, soum: "Vakinankaratra SARL", lot: "Lot 1", montant: "52 400 000 Ar", prog: "Terminée", total: 81.6, tech: 78.0, fin: 87.0, statut: "VALIDÉE", badge: "✓ qualifiée & conforme" },
    { ordre: 3, soum: "Miaro Conseil", lot: "Lot 2", montant: "44 100 000 Ar", prog: "En cours (2/3)", total: 74.8, tech: 58.0, fin: 100.0, statut: "ÉLIMINÉE", badge: "✗ technique < 70 · ⚠ consensus (écart 18 pts)" },
    { ordre: 4, soum: "Société Antsirabe", lot: "Lot 2", montant: "—", prog: "Pas commencé", total: 0, tech: 0, fin: 0, statut: "EN ATTENTE", badge: "Financière verrouillée (double aveugle)" },
  ];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Offres + Classement final — replica dao/[seanceId]/offres + classement</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {offres.map((o) => (
          <div key={o.ordre} className="rounded-2xl border border-slate-200 p-3">
            <p className="text-[13px] font-black">Offre n°{o.ordre} — {o.soum}</p>
            <p className="text-[12px] font-semibold text-slate-500">{o.montant} — {o.lot} — {o.prog}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{o.badge}</p>
            <button type="button" className="mt-2 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Grille simulée ouverte : offre n°${o.ordre} → /evaluation/offres/OFF-${o.ordre}?seance=11 (mock).`)}>{o.prog === "Terminée" ? "Voir" : o.prog.startsWith("En cours") ? "Continuer" : "Évaluer"}</button>
          </div>
        ))}
      </div>
      <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-[12px] font-bold text-amber-800">Classement officiel quand les 3 évaluateurs auront terminé — progression 2/4 (mock).</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Rang</th><th className="px-4 py-3">Soumissionnaire</th><th className="px-4 py-3">Total /100</th><th className="px-4 py-3">Tech.</th><th className="px-4 py-3">Fin.</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody>
            {offres.slice(0, 3).map((o, i) => (
              <tr key={o.soum} className="border-t border-slate-100">
                <td className="px-4 py-2 font-black">{o.statut === "EN ATTENTE" ? "—" : i + 1}</td>
                <td className="px-4 py-2 font-bold">{o.soum}<br /><span className="font-semibold text-slate-400">{o.montant}</span></td>
                <td className="px-4 py-2 font-black tabular-nums">{o.total.toFixed(1)}</td>
                <td className="px-4 py-2 tabular-nums">{o.tech.toFixed(1)}</td>
                <td className="px-4 py-2 tabular-nums">{o.fin.toFixed(1)}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${o.statut === "VALIDÉE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{o.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-primary" onClick={() => notify("Contrat simulé créé : /contractualisation/new?seance_id=11&offre_id=OFF-1 (rang 1, mock).")}>Créer le contrat (rang 1) — mock</button>
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
        <Field label="Catégorie d'activité *"><select className={fieldClass} value={f.categorie} onChange={set("categorie")}><option>FORMATION</option><option>ATELIER</option><option>REUNION</option><option>REVUE</option><option>SUPERVISION</option><option>ETUDE</option><option>CONSULTANT</option><option>CABINET</option><option>BUREAU_ETUDES</option><option>ENTREPRISE</option><option>BIENS</option><option>TRAVAUX</option></select></Field>
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
  const [fSource, setFSource] = useState("");
  const [fStatut, setFStatut] = useState("");
  const [fType, setFType] = useState("");
  const [obs, setObs] = useState<Record<string, string>>({});
  const allDocs = [
    { num: "TDR-2026-09", title: "TDR supervision formative", statut: "BROUILLON", type: "TDR", source: "GAVI" },
    { num: "TDR-2026-07", title: "Formation logistique", statut: "SOUMIS", type: "TDR", source: "GAVI" },
    { num: "ST-2026-04", title: "Spécifications ordinateurs", statut: "EN_VALIDATION", type: "ST", source: "Fonds Mondial" },
    { num: "TDR-2026-02", title: "Étude CSB", statut: "VALIDE", type: "TDR", source: "Banque Mondiale" },
  ];
  const docs = allDocs.filter((d) =>
    (d.num + d.title + d.type).toLowerCase().includes(q.toLowerCase()) &&
    (!fSource || d.source === fSource) && (!fStatut || d.statut === fStatut) && (!fType || d.type === fType)
  );
  const hasFilter = !!(q || fSource || fStatut || fType);
  const sectionOf = (s: string) => s === "BROUILLON" ? "Brouillons" : s === "VALIDE" || s === "REJETE" ? "Archive" : s === "A_REVOIR" ? "À revoir" : s === "EN_VALIDATION" ? "À valider" : "En attente de décision";
  const sections = ["Brouillons", "En attente de décision", "À revoir", "À valider", "Archive"];
  const decide = (num: string, dec: string) => {
    notify(`Décision simulée ${dec} — ${num}${obs[num]?.trim() ? ` — « ${obs[num].trim()} »` : ""} (mock).`);
  };
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Suivi TDR/ST — replica TdrSt/formulaire (rôles + décisions)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input placeholder="Recherche n° / intitulé / PTBA… (auditeur/admin)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={fieldClass} value={fSource} onChange={(e) => setFSource(e.target.value)}>
          <option value="">Source : toutes</option><option>GAVI</option><option>Fonds Mondial</option><option>Banque Mondiale</option>
        </select>
        <select className={fieldClass} value={fStatut} onChange={(e) => setFStatut(e.target.value)}>
          <option value="">Statut : tous</option><option>BROUILLON</option><option>SOUMIS</option><option>A_REVOIR</option><option>EN_VALIDATION</option><option>VALIDE</option><option>REJETE</option><option>SUSPENDU</option>
        </select>
        <select className={fieldClass} value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">Type : tous</option><option>TDR</option><option>ST</option>
        </select>
      </div>
      {hasFilter && <button type="button" className="rounded-xl border border-slate-200 px-4 py-1.5 text-[12px] font-bold" onClick={() => { setQ(""); setFSource(""); setFStatut(""); setFType(""); }}>Tout effacer (mock)</button>}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-sky-700">États de besoins à documenter</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
          <span className="font-mono font-black">DA-2026-014</span><span>Ordinateurs — TDR requis, non créé</span>
          <button type="button" className="rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify("Redirection simulée : /TdrSt/new?demandeId=DA-2026-014 (mock).")}>Créer le document</button>
        </div>
      </div>
      {sections.map((sec) => {
        const list = docs.filter((d) => sectionOf(d.statut) === sec);
        if (list.length === 0) return null;
        return (
          <div key={sec}>
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">{sec} · {list.length}</p>
            <div className="space-y-3">
              {list.map((d) => (
                <div key={d.num} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-black">{d.num} — {d.title} <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{d.statut}</span> <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{d.type} — {d.source}</span></p>
                  <Field label="Observations"><textarea className={textareaClass} value={obs[d.num] ?? ""} onChange={(e) => setObs({ ...obs, [d.num]: e.target.value })} placeholder="Observations techniques / finales…" /></Field>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {d.statut === "BROUILLON" && <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white" onClick={() => decide(d.num, "ENVOYÉ EN VALIDATION")}>Envoyer en validation</button>}
                    {d.statut === "SOUMIS" && (<>
                      <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => decide(d.num, "FAVORABLE (technique)")}>Favorable</button>
                      <button type="button" className="rounded-xl border border-amber-300 px-4 py-2 text-[12px] font-bold text-amber-700" onClick={() => decide(d.num, "À REVOIR (technique)")}>À revoir</button>
                    </>)}
                    {d.statut === "EN_VALIDATION" && (<>
                      <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => decide(d.num, "APPROUVÉ (final)")}>Approuver</button>
                      <button type="button" className="rounded-xl border border-red-300 px-4 py-2 text-[12px] font-bold text-red-600" onClick={() => decide(d.num, "REJETÉ (final)")}>Rejeter</button>
                    </>)}
                    {(d.statut === "VALIDE" || d.statut === "REJETE") && <span className="text-[12px] font-bold text-slate-400">Décision finale enregistrée — archivé (mock).</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {docs.length === 0 && <p className="text-sm font-semibold text-slate-400">Aucun document ne correspond aux filtres (mock).</p>}
    </div>
  );
}

/* ================= H. Contractualisation ================= */

function ContratInitDemo({ notify }: { notify: Notify }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className={`${cardClass} mx-auto max-w-md space-y-4 text-center`}>
      <p className={sectionTitleClass}>Init contrat NOTI5 — replica contractualisation/new (page auto, sans formulaire)</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-left font-mono text-[12px] font-bold text-slate-600">
        ?seance_id=11 (requis)<br />?offre_id= — absent → rang 1 auto (EURL MediDistrib)
      </div>
      <button
        className="btn-primary w-full disabled:opacity-60" type="button" disabled={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => { setLoading(false); notify("Contrat simulé auto-créé depuis le rang 1 → /contractualisation/CTR-2026-09 (mock)."); }, 900);
        }}
      >
        {loading ? "Initialisation NOTI5…" : "Créer le contrat (mock)"}
      </button>
      <p className="text-[11px] font-semibold text-slate-400">Sans séance éligible ni rang 1 : erreur « aucun lauréat » (mock).</p>
    </div>
  );
}

function ContratDossierDemo({ notify }: { notify: Notify }) {
  const [email, setEmail] = useState("prestataire@entreprise.mg");
  const [tel, setTel] = useState("+261 34 11 222 33");
  const [rep, setRep] = useState("M. R. Andria — Gérant");
  const [echeances, setEcheances] = useState([
    { etape: "Avance de démarrage (30%)", montant: 14370000, pct: 30, date: "2026-12-01", statut: "À venir" },
    { etape: "Livraison finale (70%)", montant: 33530000, pct: 70, date: "2027-02-15", statut: "À venir" },
  ]);
  const [frm, setFrm] = useState({ etape: "", montant: 5000000, pct: 10, date: "2027-01-15" });
  const [docs, setDocs] = useState([{ name: "NOTI5-CTR-2026-09.pdf", type: "Initial", sha: "a3f9…c41d", date: "01/12/2026" }]);
  const totalPct = echeances.reduce((s, e) => s + e.pct, 0);
  const totalMnt = echeances.reduce((s, e) => s + e.montant, 0);
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Dossier contractuel NOTI5 (5 sections) — replica contractualisation/[id]</p>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-semibold">S1 — N° CTR-2026-09 — AOI — « Fourniture de vaccins » — statut BROUILLON (modifiable, mock)</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prestataire (verrouillé)"><input readOnly className={`${fieldClass} bg-slate-50`} value="EURL MediDistrib — NIF 5001234 / STAT 789456" /></Field>
        <Field label="E-mail prestataire *"><input required type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Téléphone prestataire"><input className={fieldClass} value={tel} onChange={(e) => setTel(e.target.value)} /></Field>
        <Field label="Représentant signataire"><input className={fieldClass} value={rep} onChange={(e) => setRep(e.target.value)} /></Field>
        <Field label="Date de signature"><input type="date" defaultValue="2026-12-01" className={fieldClass} /></Field>
        <Field label="Durée d'exécution"><input defaultValue="90 jours" className={fieldClass} /></Field>
      </div>
      <Field label="Montant TTC (verrouillé, MGA)"><input readOnly className={`${fieldClass} bg-slate-50`} value="47 900 000" /></Field>
      <Field label="Clauses particulières"><textarea defaultValue="Pénalités de retard 1/1000 par jour." className={textareaClass} /></Field>
      <div>
        <label className={labelClass}>S4 — Échéancier (Σ = 100% — actuel : {totalPct}% — Σ {totalMnt.toLocaleString("fr-FR")} Ar)</label>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-2">Étape</th><th className="px-4 py-2 text-right">Montant</th><th className="px-4 py-2 text-center">%</th><th className="px-4 py-2">Échéance</th><th className="px-4 py-2">Statut</th><th className="px-4 py-2"></th></tr></thead>
            <tbody>
              {echeances.map((ec, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-bold">{ec.etape}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{ec.montant.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-2 text-center font-black">{ec.pct}%</td>
                  <td className="px-4 py-2">{ec.date}</td>
                  <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black">{ec.statut}</span></td>
                  <td className="px-4 py-2 text-right"><button type="button" className="text-red-500" onClick={() => setEcheances(echeances.filter((_, j) => j !== i))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input required placeholder="Étape *" className={fieldClass} value={frm.etape} onChange={(e) => setFrm({ ...frm, etape: e.target.value })} />
          <input required type="number" min={0} step={0.01} placeholder="Montant *" className={fieldClass} value={frm.montant} onChange={(e) => setFrm({ ...frm, montant: Number(e.target.value) })} />
          <input required type="number" min={1} max={100} placeholder="% (1–100) *" className={fieldClass} value={frm.pct} onChange={(e) => setFrm({ ...frm, pct: Number(e.target.value) })} />
          <input required type="date" className={fieldClass} value={frm.date} onChange={(e) => setFrm({ ...frm, date: e.target.value })} />
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => { if (!frm.etape.trim() || !(frm.montant > 0) || frm.pct < 1 || frm.pct > 100 || !frm.date) return notify("Échec simulé : étape, montant, % 1–100 et date requis (mock)."); setEcheances([...echeances, { ...frm, statut: "À venir" }]); setFrm({ etape: "", montant: 5000000, pct: 10, date: "2027-01-15" }); }}>+ Ajouter</button>
        </div>
        {totalPct !== 100 && <p className="mt-1 text-[12px] font-black text-amber-600">⚠ Total {totalPct}% — l&apos;envoi exige exactement 100% (mock).</p>}
      </div>
      <div>
        <label className={labelClass}>S5 — Documents (PDF, max 50 Mo, ≥ 1 requis)</label>
        {docs.map((d, i) => (
          <div key={i} className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold">
            <span className="flex-1">📄 {d.name}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black">{d.type}</span>
            <span className="font-mono text-[10px] text-slate-400">SHA-256 {d.sha} — {d.date}</span>
            <button type="button" className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold" onClick={() => notify(`Aperçu simulé : ${d.name} (mock).`)}>Voir</button>
            <button type="button" className="text-red-500" onClick={() => { if (window.confirm("Supprimer ce document ? (mock)")) setDocs(docs.filter((_, j) => j !== i)); }}>✕</button>
          </div>
        ))}
        <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-500 hover:border-emerald-400">
          + Joindre un PDF — CONTRAT_SIGNÉ (Initial/Avenant) (mock)
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 50 * 1024 * 1024) return notify("Échec simulé : 50 Mo maximum (mock)."); setDocs([...docs, { name: f.name, type: "Initial", sha: "9be2…77aa", date: new Date().toLocaleDateString("fr-FR") }]); e.target.value = ""; }} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold" onClick={() => notify("Brouillon simulé sauvegardé (mock).")}>Sauvegarder brouillon</button>
        <button
          type="button" className="btn-primary"
          onClick={() => {
            if (!email.includes("@")) return notify("Échec simulé : e-mail prestataire manquant (mock).");
            if (docs.length < 1) return notify("Échec simulé : aucun PDF attaché (mock).");
            if (totalPct !== 100) return notify(`Échec simulé : échéancier = ${totalPct}% (100% requis) (mock).`);
            notify(`Contrat simulé ENVOYÉ à ${email} (mock).`);
          }}
        >
          Envoyer au prestataire (mock)
        </button>
      </div>
    </div>
  );
}

/* ================= I. Espaces métier & filtres ================= */

function EspacesDemo({ notify }: { notify: Notify }) {
  const [espace, setEspace] = useState<"validation" | "passation" | "logistique">("validation");
  const [scope, setScope] = useState("mine");
  const [mode, setMode] = useState("status");
  const [q, setQ] = useState("");
  const [fin, setFin] = useState<string[]>(["RSS3_GAVI"]);
  const [typeB, setTypeB] = useState("");
  const [page, setPage] = useState(1);
  const base = {
    validation: [
      { num: "DA-2026-014", objet: "Ordinateurs de bureau", etape: "TECHNIQUE", unite: "LOGISTIQUE", montant: "12 500 000 Ar", action: "Valider" },
      { num: "DA-2026-013", objet: "Audit financier", etape: "HIERARCHIQUE", unite: "FINANCE", montant: "8 200 000 Ar", action: "Valider" },
      { num: "DA-2026-010", objet: "Kits diagnostics", etape: "BUDGETAIRE", unite: "SUIVI_EVALUATION", montant: "210 300 000 Ar", action: "Valider" },
    ],
    passation: [
      { num: "DA-2026-011", objet: "Formation 40 agents", etape: "VALIDEE_BUDGETAIRE", unite: "SUIVI_EVALUATION", montant: "68 250 000 Ar", action: "Commander" },
      { num: "DA-2026-009", objet: "Vaccins chaîne de froid", etape: "EN_COMMANDE", unite: "LOGISTIQUE", montant: "1 240 000 000 Ar", action: "Consulter" },
    ],
    logistique: [
      { num: "DA-2026-009", objet: "Vaccins chaîne de froid", etape: "EN_COMMANDE — réception attendue", unite: "LOGISTIQUE", montant: "1 240 000 000 Ar", action: "Réceptionner" },
      { num: "DA-2026-007", objet: "Réhabilitation CSB II", etape: "LIVREE — écart détecté", unite: "TECHNIQUE", montant: "860 500 000 Ar", action: "Résoudre l'écart" },
    ],
  };
  const rows = base[espace].filter((r) => (r.num + r.objet + r.etape + r.unite).toLowerCase().includes(q.toLowerCase()));
  const codes = ["SRPS_CS7_FM", "RSS3_GAVI", "FAE_GAVI", "CDS_GAVI", "VAR_GAVI", "PARN2_BM", "PPSB_BM"];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Espaces Validation / Passation / Logistique-Marché — filtres partagés</p>
      <div className="flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1">
        {([["validation", "Validation (SOUMISE + étape)"], ["passation", "Passation (VALIDÉES → commandes)"], ["logistique", "Marché/Logistique (réceptions)"]] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => { setEspace(v); setPage(1); }} className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-black ${espace === v ? "bg-white shadow" : "text-slate-500"}`}>{l}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{["mine", "all"].map((s) => <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${scope === s ? "bg-white shadow" : "text-slate-500"}`}>{s === "mine" ? "Mes dossiers" : "Tous les dossiers"}</button>)}</div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{["status", "table"].map((s) => <button key={s} type="button" onClick={() => setMode(s)} className={`rounded-lg px-3 py-1.5 text-[11px] font-black ${mode === s ? "bg-white shadow" : "text-slate-500"}`}>{s === "status" ? "Vue par statut" : "Vue tableau"}</button>)}</div>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600" value={typeB} onChange={(e) => setTypeB(e.target.value)}>
          <option value="">Type de besoin : tous</option><option value="MATERIELS">Matériels</option><option value="PETITS_SERVICES">Petits services</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Financement (catalogue source-ligne-code)</label>
        <div className="flex flex-wrap gap-1">{codes.map((s) => <button key={s} type="button" onClick={() => setFin((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))} className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-black ${fin.includes(s) ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-400"}`}>{s}</button>)}</div>
      </div>
      <input placeholder="Rechercher un numéro, un objet, une unité, un statut… (mock)" className={fieldClass} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      <p className="text-[11px] font-bold text-slate-400">Espace={espace} — Scope={scope} — {mode === "status" ? "Vue par statut" : "Vue tableau"} — {rows.length} résultat(s) — 5 / page (mock)</p>
      {rows.map((r) => (
        <div key={r.num} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <span className="font-mono text-[12px] font-black">{r.num}</span>
          <span className="text-sm font-bold">{r.objet}</span>
          <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{r.etape}</span>
          <span className="text-[11px] font-bold text-slate-400">{r.unite}</span>
          <span className="ml-auto text-[12px] font-bold">{r.montant}</span>
          <button type="button" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Action simulée ouverte : ${r.num} (${espace} → modale) (mock).`)}>{r.action}</button>
        </div>
      ))}
      {rows.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">Aucun dossier visible dans cette vue.</p>}
      <div className="flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">←</button>
        <span className="text-[12px] font-black">Page {page}</span>
        <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">→</button>
      </div>
    </div>
  );
}

/* ================= J. Dashboards analytiques ================= */

function DashGlobalDemo() {
  const mga = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MGA", maximumFractionDigits: 0 }).format(n);
  const cards = [
    { t: "Travaux", c: "#1f9d8b", m: [{ label: "aoi", value: 8, color: "#7ea9d4" }, { label: "aon", value: 5, color: "#5bd06ae0" }, { label: "dc", value: 3, color: "#acae6bd6" }], s: [{ label: "en cours dans le temps", value: 9, color: "#14b8a6" }, { label: "en cours en retard", value: 3, color: "#f97316" }, { label: "termine", value: 4, color: "#10b981" }] },
    { t: "Biens", c: "#ef8d32", m: [{ label: "aon", value: 10, color: "#5bd06ae0" }, { label: "dc", value: 7, color: "#acae6bd6" }, { label: "ed", value: 2, color: "#b16bccc9" }], s: [{ label: "non demarre dans le temps", value: 6, color: "#14b8a6" }, { label: "en cours dans le temps", value: 8, color: "#14b8a6" }, { label: "termine", value: 5, color: "#10b981" }] },
    { t: "Consultance", c: "#4b5563", m: [{ label: "sci", value: 6, color: "#f472b6" }, { label: "smc", value: 4, color: "#f59e0b" }, { label: "sfqc", value: 2, color: "#60a5fa" }], s: [{ label: "en cours dans le temps", value: 5, color: "#14b8a6" }, { label: "en cours en retard", value: 2, color: "#f97316" }, { label: "arrete", value: 1, color: "#8b5e3c" }, { label: "termine", value: 4, color: "#10b981" }] },
  ];
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Dashboard global passations — replica personnel/dashboard (donuts)</p>
      <div>
        <h3 className="text-xl font-black">Tableau de Bord <span className="text-emerald-600">UCP</span></h3>
        <p className="text-[13px] font-medium text-slate-500">Suivi en temps réel des passations de marchés (mock)</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Kpi label="Total Marchés" value="47" sub="tous types (mock)" accent="#10b981" />
        <Kpi label="Montant Total" value={mga(12400000000)} sub="estimé cumulé (mock)" accent="#f59e0b" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((g) => (
          <div key={g.t} className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-center font-black uppercase" style={{ color: g.c }}>{g.t}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><p className="mb-1 text-center text-[10px] font-bold uppercase text-slate-500">Méthode</p><DonutCSS segments={g.m} size={110} /></div>
              <div><p className="mb-1 text-center text-[10px] font-bold uppercase text-slate-500">Statut</p><DonutCSS segments={g.s} size={110} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashDemandeRadarDemo({ notify }: { notify: Notify }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("mine");
  const [fin, setFin] = useState<string[]>([]);
  const sections = [
    ["En préparation", 4], ["En validation hiérarchique", 3], ["En validation technique", 2], ["En validation budgétaire", 3],
    ["En validation programmatique", 1], ["En approbation finale", 1], ["En passation", 3], ["En cours de livraison", 2],
    ["Réception", 2], ["À clôturer", 2], ["À corriger", 2], ["Archives", 9],
  ] as const;
  const rows = [
    ["DA-2026-014", "Ordinateurs de bureau", "R. Randria", "Matériels", "v1", "PTBA-2026-A1", "12 500 000 Ar", "TECHNIQUE", "02/10/2026"],
    ["DA-2026-011", "Formation 40 agents", "S. Rabe", "Petits services", "v2", "PTBA-2026-A1", "68 250 000 Ar", "VALIDEE_BUDGETAIRE", "28/09/2026"],
    ["DA-2026-009", "Vaccins chaîne de froid", "T. Rakoto", "Matériels", "v1", "PTBA-2026-B3", "1 240 000 000 Ar", "EN_COMMANDE", "20/09/2026"],
    ["DA-2026-007", "Réhabilitation CSB II", "R. Randria", "Matériels", "v1", "PTBA-2026-C2", "860 500 000 Ar", "LIVREE", "12/09/2026"],
    ["DA-2026-003", "Audit financier", "T. Rakoto", "Petits services", "v3", "PTBA-2026-A1", "120 000 000 Ar", "CLOTUREE", "01/09/2026"],
  ].filter((r) => (r[0] + r[1]).toLowerCase().includes(q.toLowerCase()));
  const codes = ["SRPS_CS7_FM", "RSS3_GAVI", "FAE_GAVI", "CDS_GAVI", "VAR_GAVI", "PARN2_BM", "PPSB_BM"];
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Radar demande-achat — replica demande-achat/dashboard (12 sections)</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{["mine", "all"].map((s) => <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-lg px-3 py-1 text-[11px] font-black ${scope === s ? "bg-white shadow" : "text-slate-500"}`}>{s === "mine" ? "Radar de mes dossiers" : "Radar de tous les dossiers"}</button>)}</div>
        <button type="button" className="rounded-xl bg-emerald-600 px-4 py-1.5 text-[11px] font-bold text-white" onClick={() => notify("Redirection simulée : /demande-achat/new (mock).")}>+ Nouvel état</button>
      </div>
      <input placeholder="Rechercher un numéro, un objet… (mock)" className={fieldClass} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      <div>
        <label className={labelClass}>Financement / Type de besoin — {fin.length > 0 ? <button type="button" className="underline" onClick={() => setFin([])}>Tout effacer ({fin.length})</button> : "Aucun filtre appliqué"}</label>
        <div className="flex flex-wrap gap-1">{codes.map((c) => <button key={c} type="button" onClick={() => setFin((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))} className={`rounded-lg border px-2 py-1 font-mono text-[10px] font-black ${fin.includes(c) ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-400"}`}>{c}</button>)}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sections.map(([s, n]) => <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{s} · {n}</span>)}
      </div>
      <p className="text-[12px] font-black">Radar des dossiers — {rows.length} dossier(s) (mock)</p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[860px] text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Numéro</th><th className="px-4 py-3">Intitulé</th><th className="px-4 py-3">Demandeur</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">PTBA</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Position actuelle</th><th className="px-4 py-3">Créé le</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r[0]} className="border-t border-slate-100"><td className="px-4 py-2 font-mono font-black">{r[0]}</td><td className="px-4 py-2 font-bold">{r[1]}</td><td className="px-4 py-2">{r[2]}</td><td className="px-4 py-2">{r[3]}</td><td className="px-4 py-2">{r[4]}</td><td className="px-4 py-2 font-mono text-[11px]">{r[5]}</td><td className="px-4 py-2 font-bold tabular-nums">{r[6]}</td><td className="px-4 py-2"><span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">{r[7]}</span></td><td className="px-4 py-2">{r[8]}</td><td className="px-4 py-2"><div className="flex gap-1"><button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Détail simulé : ${r[0]} — timeline BROUILLON → CLOTUREE (mock).`)}>Détail</button><button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold" onClick={() => notify(`Action simulée : ${r[0]} (mock).`)}>Action</button></div></td></tr>)}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">Aucun dossier visible dans cette vue.</p>}
      <div className="flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40">←</button>
        <span className="text-[12px] font-black">Page {page} — 5 / page (mock)</span>
        <button type="button" onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">→</button>
      </div>
    </div>
  );
}

function DashTdrDemo({ notify }: { notify: Notify }) {
  const months = [["Jan", 8], ["Fév", 12], ["Mar", 9], ["Avr", 14], ["Mai", 18], ["Juin", 11], ["Juil", 13], ["Aoû", 10], ["Sep", 15], ["Oct", 18], ["Nov", 12], ["Déc", 7]] as [string, number][];
  const radar = [["FM", 20], ["GAVI", 26], ["BM", 10]] as [string, number][];
  const maxR = 26;
  const pt = (i: number) => {
    const angle = (Math.PI / 2) + (i * 2 * Math.PI) / radar.length;
    const r = 12 + (radar[i][1] / maxR) * 48;
    return `${60 + r * Math.cos(angle)},${60 - r * Math.sin(angle)}`;
  };
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Analytics TDR/ST — replica TdrSt/dashboard (KPI + bar/pie/radar)</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black">Dashboard TdR/ST</h3>
          <p className="text-[12px] font-medium text-slate-500">Tableau de bord des indicateurs — Vision globale (mock)</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-bold" onClick={() => notify("Retour simulé : /TdrSt/formulaire (mock).")}>← Retour au formulaire</button>
          <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify("Données simulées actualisées (mock).")}>Actualiser</button>
        </div>
      </div>
      <p className="text-[13px] font-bold text-slate-600">Total documents (année) : 56 — Taux de validation : 75.0% — Sources de financement : 3 (mock)</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Documents ce mois" value="18" sub="▲ +12% vs mois précédent (mock)" accent="#10b981" />
        <Kpi label="Délai moyen validation" value="6,2 j" sub="seuil : 10 j — vs mois précédent (mock)" accent="#f59e0b" />
        <Kpi label="Documents validés" value="42" sub="▲ +8% vs mois précédent (mock)" accent="#3b82f6" />
        <Kpi label="En attente" value="7" sub="▼ −3 vs mois précédent (mock)" accent="#ef4444" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Documents déposés</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Nombre de documents déposés par mois</p>
          <Bars data={months.map(([label, value]) => ({ label, value }))} color="#22c55e" />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Documents par type</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Classification des documents</p>
          <DonutCSS size={120} segments={[{ label: "TDR", value: 34, color: "#10b981" }, { label: "ST", value: 22, color: "#3b82f6" }]} />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Documents par source</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Répartition par source de financement</p>
          <svg viewBox="0 0 120 120" className="mx-auto h-36 w-36">
            {[20, 40, 60].map((r) => <polygon key={r} points={`${60},${60 - r} ${60 + r * 0.866},${60 + r * 0.5} ${60 - r * 0.866},${60 + r * 0.5}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />)}
            <polygon points={radar.map((_, i) => pt(i)).join(" ")} fill="#22c55e" fillOpacity="0.25" stroke="#22c55e" strokeWidth="2" />
            {radar.map(([l, v], i) => <text key={l} x={60 + 68 * Math.cos(Math.PI / 2 + (i * 2 * Math.PI) / 3)} y={60 - 68 * Math.sin(Math.PI / 2 + (i * 2 * Math.PI) / 3)} textAnchor="middle" fontSize="9" fontWeight="800" fill="#475569">{l} {v}</text>)}
          </svg>
        </div>
      </div>
    </div>
  );
}

function DashLogAdminDemo() {
  const annexes = [["DAO-complet-AOI-03.pdf", 210, 82], ["annexe-prix.xlsx", 140, 54], ["plan-csb.pdf", 88, 31], ["CCAG.pdf", 76, 27], ["TDR-formation.pdf", 64, 22], ["devis-quantitatif.xlsx", 52, 18], ["PV-modele.docx", 41, 14], ["RC-pro.pdf", 33, 11], ["quitus-fiscal.pdf", 21, 7], ["attestation-CNAPS.pdf", 12, 4]] as [string, number, number][];
  const users = [
    ["EURL MediDistrib", "12/01/2026", "28/10/2026", 210, 48, "Élevé"],
    ["Vakinankaratra SARL", "03/02/2026", "25/10/2026", 120, 22, "Moyen"],
    ["Miaro Conseil", "19/03/2026", "Jamais", 45, 3, "Faible"],
  ] as [string, string, string, number, number, string][];
  const stat = (label: string, value: string, desc: string, accent: string, icon: string) => (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-base" style={{ background: `${accent}18`, color: accent }}>{icon}</span><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p></div>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{desc}</p>
    </div>
  );
  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Admin DAO performance — replica log-dashboard (traçabilité)</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black">Tableau de bord d&apos;administration</h3>
          <p className="text-[12px] font-semibold text-slate-400">Suivi des performances, traçabilité et monitoring des DAO (mock)</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">5 DAO suivis</span>
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">3 entreprises actives</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat("Consultations", "1 284", "Vues totales sur les dossiers", "#3b82f6", "👁")}
        {stat("Téléchargements DAO", "462", "Dossiers complets récupérés", "#8b5cf6", "⬇")}
        {stat("Taux de conversion", "36,0%", "Ratio téléchargements / vues", "#ec4899", "📊")}
        {stat("Taux de clôture", "68%", "Dossiers finalisés", "#10b981", "✓")}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Consultations par DAO</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Nombre de vues par dossier — Total : 1 284</p>
          <Bars color="#3b82f6" data={[{ label: "AOI3", value: 320 }, { label: "AON7", value: 410 }, { label: "DC11", value: 180 }, { label: "AOI9", value: 240 }, { label: "AON2", value: 134 }]} />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Répartition des téléchargements</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Volume par dossier — 462 total</p>
          <DonutCSS size={120} segments={[{ label: "AOI-03", value: 190, color: "#8b5cf6" }, { label: "AON-07", value: 150, color: "#3b82f6" }, { label: "DC-11", value: 122, color: "#ec4899" }]} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Annexes les plus téléchargées</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Top 10 des fichiers par taux d&apos;intérêt — {annexes.length} fichiers</p>
          {annexes.map(([n, c, p], i) => (
            <div key={n} className="mb-1.5 flex items-center gap-2 text-[12px] font-bold"><span className="w-6 text-slate-400">{i + 1}</span><span className="flex-1 truncate">{n}</span><span>{c}</span><div className="h-2 w-20 overflow-hidden rounded bg-fuchsia-50"><div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${p}%` }} /></div><span className="w-10 text-right text-[11px] text-slate-400">{p}%</span></div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-black uppercase text-slate-500">Alertes de supervision</p>
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Points de contrôle UCP</p>
          <p className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">URGENT — Date limite imminente : AON-2026-07 — Échéance : 28/11/2026</p>
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700">Dormant — Dossiers inactifs (&gt; 7 jours) : DC-2026-05</p>
          <div className="mt-2 flex items-center gap-3">
            <svg viewBox="0 0 80 80" className="h-16 w-16"><circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="9" /><circle cx="40" cy="40" r="32" fill="none" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round" strokeDasharray="68 100" transform="rotate(-90 40 40)" /><text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="900" fill="#334155">68%</text></svg>
            <p className="text-[12px] font-bold">Taux de clôture global — seuils ≥70 vert / ≥40 ambre (mock)</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-[11px] font-black uppercase text-slate-500">Traçabilité des entreprises</p>
        <p className="mb-2 text-[11px] font-semibold text-slate-400">Engagement de chaque soumissionnaire — {users.length} entreprises</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-3">Entreprise</th><th className="px-4 py-3">Inscrit le</th><th className="px-4 py-3">Dernière activité</th><th className="px-4 py-3">Consultations</th><th className="px-4 py-3">Téléchargements</th><th className="px-4 py-3">Engagement</th></tr></thead>
            <tbody>
              {users.map((r) => (
                <tr key={r[0]} className="border-t border-slate-100"><td className="px-4 py-2 font-bold">{r[0]}</td><td className="px-4 py-2">{r[1]}</td><td className="px-4 py-2">{r[2]}</td><td className="px-4 py-2">{r[3]}</td><td className="px-4 py-2">{r[4]}</td><td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${r[5] === "Élevé" ? "bg-emerald-50 text-emerald-700" : r[5] === "Moyen" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{r[5]}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-400">Score = vues/max×50 + téléchargements/max×50 — ≥70 Élevé · ≥30 Moyen · sinon Faible (mock).</p>
      </div>
    </div>
  );
}

function DashContratDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const groups = [
    ["À contractualiser (Brouillons)", "Contrats en brouillon à compléter avant envoi", ["CTR-2026-09 — EURL MediDistrib — 47 900 000 XOF — Séance : SE-2026-011 — Créé le : 01/12/2026"]],
    ["En attente signature", "Contrats envoyés au prestataire pour signature et retour", ["CTR-2026-08 — Vakinankaratra SARL — 86 000 000 XOF — Séance : SE-2026-009 — Créé le : 20/11/2026"]],
    ["Contrats signés / En exécution", "Contrats signés et en cours d'exécution ou clôturés", ["CTR-2026-05 — Miaro Conseil — 44 100 000 XOF — Séance : SE-2026-004 — Créé le : 10/10/2026"]],
    ["Suspendus ou Annulés", "Contrats suspendus ou annulés", []],
  ] as [string, string, string[]][];
  const empty: Record<string, string> = { "À contractualiser (Brouillons)": "Aucun contrat en brouillon.", "En attente signature": "Aucun contrat en attente de signature.", "Contrats signés / En exécution": "Aucun contrat signé.", "Suspendus ou Annulés": "Aucun contrat suspendu ou annulé." };
  const shown = groups.map(([t, s, rows]) => [t, s, rows.filter((r) => r.toLowerCase().includes(q.toLowerCase()))] as [string, string, string[]]);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Contractualisation — replica contractualisation (3 stats + accordéons)</p>
      <div>
        <h3 className="text-lg font-black">CONTRACTUALISATION DES MARCHÉS</h3>
        <p className="text-[12px] font-medium text-slate-500">Module NOTI5 — Suivi des signatures et validation des contrats — Secrétaire : secretaire@ucp.mg (mock)</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="À contractualiser" value="3" sub="Contrats en brouillon ou à compléter (mock)" accent="#f59e0b" />
        <Kpi label="En attente signature" value="2" sub="Contrats envoyés au prestataire (mock)" accent="#38bdf8" />
        <Kpi label="Contrats signés" value="11" sub="Contrats finalisés et signés (mock)" accent="#10b981" />
      </div>
      <p className="text-[12px] font-black">Suivi des contrats de marché</p>
      <input placeholder="Rechercher un contrat, marché, prestataire… (mock)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.map(([t, s, rows]) => (
        <div key={t} className="rounded-2xl border border-slate-200 p-4">
          <p className="font-black text-[13px]">{t}</p>
          <p className="text-[11px] font-semibold text-slate-400">{s}</p>
          {rows.length === 0 ? <p className="mt-2 text-[12px] italic text-slate-400">{q ? "Aucun contrat ne correspond à cette recherche." : empty[t]}</p> : rows.map((r) => (
            <div key={r} className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold"><span className="flex-1">{r}</span><button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify(`Dossier simulé ouvert : ${r.split(" — ")[0]} (mock).`)}>Voir le contrat</button></div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DashEvalSecDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const groups = [
    ["À assigner", "Séances validées en attente de la nomination des 3 évaluateurs.", ["SE-2026-012 — AON réhabilitation — Offres : 3 — Évaluateurs : 0/3 — Progression : 0/3 offres terminées"]],
    ["En évaluation", "Les évaluateurs remplissent individuellement leurs grilles de notation.", ["SE-2026-011 — AOI vaccins — Offres : 4 — Évaluateurs : 3/3 — Progression : 2/4 offres terminées"]],
    ["Terminés", "Toutes les offres ont été évaluées, notées et signées.", ["SE-2026-008 — DC formation — Offres : 3 — Évaluateurs : 3/3 — Progression : 3/3 offres terminées"]],
  ] as [string, string, string[]][];
  const empty: Record<string, string> = { "À assigner": "Aucun DAO en attente d'assignation.", "En évaluation": "Aucun DAO en cours d'évaluation.", "Terminés": "Aucun DAO terminé." };
  const shown = groups.map(([t, s, rows]) => [t, s, rows.filter((r) => r.toLowerCase().includes(q.toLowerCase()))] as [string, string, string[]]);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Évaluation (secrétaire) — replica evaluation_offre (assign + classement)</p>
      <div>
        <h3 className="text-lg font-black">ÉVALUATION DES OFFRES</h3>
        <p className="text-[12px] font-medium text-slate-500">Module Évaluation — Assignation, suivi et classement des offres par séance — Secrétaire : secretaire@ucp.mg (mock)</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="À assigner" value="2" sub="Séances en attente des évaluateurs (mock)" accent="#f59e0b" />
        <Kpi label="En évaluation" value="3" sub="DAO en cours d'évaluation (mock)" accent="#38bdf8" />
        <Kpi label="Terminés" value="5" sub="Dossiers d'évaluation clos (mock)" accent="#10b981" />
      </div>
      <p className="text-[12px] font-black">Suivi des évaluations de dossier</p>
      <input placeholder="Rechercher un dossier, mot clé… (mock)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.map(([t, s, rows]) => (
        <div key={t} className="rounded-2xl border border-slate-200 p-4">
          <p className="font-black text-[13px]">{t}</p>
          <p className="text-[11px] font-semibold text-slate-400">{s}</p>
          {rows.length === 0 ? <p className="mt-2 text-[12px] italic text-slate-400">{q ? "Aucun DAO ne correspond à cette recherche." : empty[t]}</p> : rows.map((r) => (
            <div key={r} className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
              <span className="flex-1">{r}</span>
              <span className="flex gap-1">
                {t === "À assigner" && <button type="button" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white" onClick={() => notify("Assignation simulée ouverte (mock).")}>Assigner les évaluateurs</button>}
                {t === "En évaluation" && <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold" onClick={() => notify("Suivi simulé ouvert (mock).")}>Suivi</button>}
                {t === "Terminés" && <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold" onClick={() => notify("Classement simulé ouvert (mock).")}>Voir le classement</button>}
              </span>
            </div>
          ))}
        </div>
      ))}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[12px] font-semibold text-slate-600">
        <p className="font-black text-slate-800">Détail SE-2026-011 — Identification du DAO</p>
        <p>Offres — Lot et NIF/STAT : Lot 1 (MediDistrib 5001234, Vakinankaratra 5005678) · Lot 2 (Miaro 5009012)</p>
        <p>Configuration des 3 évaluateurs commissionnés — Évaluateurs assignés : 3/3</p>
        <p>Avancement de l&apos;évaluation des offres : 2/4 terminées</p>
        <p>Classement Final Officiel — Rang / Soumissionnaire / Score Total / Technique / Financier — Lauréat : EURL MediDistrib (89.4)</p>
        <button type="button" className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold" onClick={() => notify("Invitations simulées renvoyées aux évaluateurs (mock).")}>Renvoyer les invitations</button>
      </div>
    </div>
  );
}

function DashOuvertureDemo({ notify }: { notify: Notify }) {
  const [q, setQ] = useState("");
  const sections = [
    ["Brouillons", "Dossiers à reprendre", ["AOI-2026-12 — Brouillon — AOI — Biens — Limite : 30/12/2026 12:00 — Projet : MDG-S-MOH-4041"]],
    ["En attente d'ouverture", "Dossiers dont le délai est atteint", []],
    ["Validation membres", "Séances à contrôler par les membres", []],
    ["Validation président", "Séances en attente de décision finale", ["DC-2026-11 — Validation président — DC — Services — Limite : 05/11/2026 16:00 — Projet : MDG-HSS-3"]],
    ["Dépôt en cours", "Dossiers dont la limite n'est pas encore passée", ["AON-2026-07 — Dépôt en cours — AON — Travaux — Limite : 28/11/2026 10:00 — Projet : MDG-S-MOH-4041"]],
    ["Validées", "Séances validées, PV consultables", ["AOI-2026-03 — Validée — AOI — Biens — Limite : 15/11/2026 12:00 — Projet : MDG-S-MOH-4041"]],
    ["Rejetées", "Séances rejetées", []],
    ["Annulés", "DAO annulés", []],
  ] as [string, string, string[]][];
  const empty: Record<string, string> = { "Brouillons": "Aucun brouillon disponible.", "En attente d'ouverture": "Aucun DAO en attente d'ouverture.", "Validation membres": "Aucune séance en validation membres.", "Validation président": "Aucune séance en validation président.", "Dépôt en cours": "Aucun dépôt en cours.", "Validées": "Aucun PV validé.", "Rejetées": "Aucune séance rejetée.", "Annulés": "Aucun DAO annulé." };
  const shown = sections.map(([t, s, rows]) => [t, s, rows.filter((r) => r.toLowerCase().includes(q.toLowerCase()))] as [string, string, string[]]);
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Ouverture des offres — replica ouverture_offre (dual secrétaire/validateur)</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-black">1. Dossiers DAO / DC à suivre — 1. Vue des séances d&apos;ouverture</p>
        <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-[12px] font-bold text-white" onClick={() => notify("Redirection simulée : /ouverture_offre/new (mock).")}>+ Nouvelle Séance</button>
      </div>
      <input placeholder="Rechercher un DAO… / Rechercher un dossier ou une séance… (mock)" className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-[12px] font-semibold text-slate-500">Président de séance : Mme Rabe — Membres complets actuellement : 3 / 3 (mock).</p>
      {shown.map(([t, s, rows]) => (
        <div key={t}>
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">{t} — {s} · {rows.length}</p>
          {rows.length === 0 ? <p className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] italic text-slate-400">{empty[t]}</p> : rows.map((r) => {
            const validated = t === "Validées";
            return (
              <div key={r} className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-[13px]">
                <span className="font-bold">{r}</span>
                <span className="ml-auto flex gap-2">
                  <button type="button" className={`rounded-lg px-3 py-1.5 text-[11px] font-bold text-white ${t === "Brouillons" ? "bg-emerald-600" : "bg-slate-400"}`} onClick={() => notify(`Séance simulée : ${t === "Brouillons" ? "reprise" : "consultation"} (mock).`)}>{t === "Brouillons" ? "Reprendre" : t === "Dépôt en cours" ? "Création…" : "Voir"}</button>
                  {validated && <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold" onClick={() => notify("PV simulé téléchargé : PV-AOI-2026-03.pdf (mock).")}>PV PDF</button>}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ================= J+. Dashboard PPM — back-office Django ================= */

type PpmRow = { label: string; type: "travaux" | "biens" | "consultants"; bailleur: string; agmo: string; statut: string; montant: number };

const PPM_ROWS: PpmRow[] = [
  { label: "Réhabilitation CSB II Antsirabe", type: "travaux", bailleur: "GAVI", agmo: "DRSP Vakinankaratra", statut: "En cours", montant: 860500000 },
  { label: "Construction dépôt vaccins Antananarivo", type: "travaux", bailleur: "Fonds Mondial", agmo: "UCP / Coordination", statut: "Non démarré", montant: 1200000000 },
  { label: "Réhabilitation CSR Toamasina", type: "travaux", bailleur: "Banque Mondiale", agmo: "DRSP Atsinanana", statut: "Terminé", montant: 445750000 },
  { label: "Extension laboratoire Analamanga", type: "travaux", bailleur: "Fonds Mondial", agmo: "DRSP Analamanga", statut: "Non démarré", montant: 520000000 },
  { label: "Ordinateurs de bureau (25)", type: "biens", bailleur: "GAVI", agmo: "UCP / Coordination", statut: "En cours", montant: 62500000 },
  { label: "Chaîne de froid (réfrigérateurs)", type: "biens", bailleur: "GAVI", agmo: "DRSP Analamanga", statut: "Non démarré", montant: 310000000 },
  { label: "Motos agents de santé (12)", type: "biens", bailleur: "Fonds Mondial", agmo: "DRSP Vakinankaratra", statut: "En cours", montant: 144000000 },
  { label: "Fournitures de bureau", type: "biens", bailleur: "Banque Mondiale", agmo: "UCP / Coordination", statut: "Terminé", montant: 28400000 },
  { label: "Kits diagnostics paludisme", type: "biens", bailleur: "Fonds Mondial", agmo: "DRSP Atsinanana", statut: "En cours", montant: 210300000 },
  { label: "Étude faisabilité CSB", type: "consultants", bailleur: "Banque Mondiale", agmo: "UCP / Coordination", statut: "Terminé", montant: 95000000 },
  { label: "Audit financier annuel", type: "consultants", bailleur: "Fonds Mondial", agmo: "UCP / Coordination", statut: "En cours", montant: 120000000 },
  { label: "Formation logistique 40 agents", type: "consultants", bailleur: "GAVI", agmo: "DRSP Analamanga", statut: "Non démarré", montant: 68250000 },
];

const PPM_PALETTE = ["#15803d", "#22c55e", "#4ade80", "#86efac", "#f59e0b", "#fbbf24", "#fcd34d", "#0ea5e9", "#38bdf8", "#7dd3fc", "#ef4444", "#f87171", "#fca5a5", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ec4899", "#f472b6"];

function fmtAr(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DashPpmAdminDemo({ notify }: { notify: Notify }) {
  const [draft, setDraft] = useState({ bailleur: "", agmo: "", statut: "", model_type: "" });
  const [applied, setApplied] = useState(draft);
  const setD = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLSelectElement>) => setDraft((p) => ({ ...p, [k]: e.target.value }));
  const rows = PPM_ROWS.filter((r) =>
    (!applied.bailleur || r.bailleur === applied.bailleur) &&
    (!applied.agmo || r.agmo === applied.agmo) &&
    (!applied.statut || r.statut === applied.statut) &&
    (!applied.model_type || r.type === applied.model_type)
  );
  const hasFilter = !!(applied.bailleur || applied.agmo || applied.statut || applied.model_type);
  const agg = (key: "bailleur" | "agmo" | "statut" | "type") => {
    const m = new Map<string, { count: number; total: number }>();
    rows.forEach((r) => {
      const k = key === "type" ? r.type : r[key];
      const e = m.get(k) ?? { count: 0, total: 0 };
      e.count += 1;
      e.total += r.montant;
      m.set(k, e);
    });
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
  };
  const byBailleur = agg("bailleur");
  const byAgmo = agg("agmo");
  const byStatut = agg("statut");
  const byModel = agg("type");
  const seg = (entries: [string, { count: number; total: number }][]) =>
    entries.map(([label, d], i) => ({ label, value: d.count, color: PPM_PALETTE[i % PPM_PALETTE.length] }));
  const bailleurs = [...new Set(PPM_ROWS.map((r) => r.bailleur))].sort();
  const agmos = [...new Set(PPM_ROWS.map((r) => r.agmo))].sort();
  const statuts = [...new Set(PPM_ROWS.map((r) => r.statut))].sort();
  const nav = (label: string) => notify(`Navigation simulée : ${label} (mock — Django admin).`);
  const tableCls = "w-full text-left text-[12px]";
  const thCls = "bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400";

  const detailTable = (title: string, entries: [string, { count: number; total: number }][], withAmount: boolean) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600">{title}</p>
      {entries.length === 0 ? (
        <p className="px-4 py-7 text-center text-[12px] italic text-slate-400">Aucune donnée disponible</p>
      ) : (
        <table className={tableCls}>
          <thead><tr><th className={thCls}>{withAmount ? title.replace("Détail par ", "").replace("de Marché", "").trim() : "Statut"}</th><th className={`${thCls} text-center`}>Total</th>{withAmount && <th className={`${thCls} text-right`}>Montant estimé (Ar)</th>}</tr></thead>
          <tbody>
            {entries.map(([name, d]) => (
              <tr key={name} className="border-t border-slate-50 hover:bg-emerald-50/40">
                <td className="px-4 py-2.5 font-semibold text-slate-700">{name}</td>
                <td className="px-4 py-2.5 text-center font-black text-emerald-700">{d.count}</td>
                {withAmount && <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmtAr(d.total)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className={`${cardClass} space-y-5`}>
      <p className={sectionTitleClass}>Back-office Django — replica templates/admin/ppm/dashboard.html (Plus Jakarta Sans, tokens verts)</p>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="flex min-h-[560px]">
          {/* Sidebar admin */}
          <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-black text-white">U</span>
              <p className="text-[12px] font-bold leading-tight text-emerald-800">UCP Admin<span className="block text-[9px] font-medium uppercase tracking-widest text-slate-400">e-Procurement</span></p>
            </div>
            <nav className="flex-1 space-y-3 px-2 py-3">
              <div>
                <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Navigation</p>
                {[["Tableau de bord admin", false], ["Tableau de bord PPM", true]].map(([l, on]) => (
                  <button key={l as string} type="button" onClick={() => nav(l as string)} className={`block w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold ${on ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}>{l}</button>
                ))}
              </div>
              <div>
                <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">Planification</p>
                {["Travaux", "Biens & Services", "Consultants"].map((l) => (
                  <button key={l} type="button" onClick={() => nav(`admin:ppm — ${l}`)} className="block w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium text-slate-600 hover:bg-slate-50">{l}</button>
                ))}
              </div>
            </nav>
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-700">U</span>
              <p className="text-[12px] font-semibold text-slate-700">UCP Admin<span className="block text-[10px] font-normal text-slate-400">Administrateur</span></p>
            </div>
          </aside>
          {/* Main */}
          <div className="min-w-0 flex-1 bg-[#eceeef]">
            <div className="relative flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-500" />
              <p className="font-bold text-emerald-800">Tableau de bord PPM <span className="ml-2 text-[11px] font-medium text-slate-400">Plan Prévisionnel de Marchés</span></p>
              <button type="button" onClick={() => nav("Retour admin")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">← Retour admin</button>
            </div>
            <div className="space-y-4 p-4">
              {/* KPI strip */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg text-emerald-600">↻</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total marchés<span className="block text-xl font-black text-emerald-800">{rows.length}</span></p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-lg text-amber-600">₳</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Montant total (Ar)<span className="block text-xl font-black tabular-nums text-emerald-800">{fmtAr(rows.reduce((s, r) => s + r.montant, 0))}</span></p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600">◉</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bailleurs<span className="block text-xl font-black text-emerald-800">{byBailleur.length}</span></p>
                </div>
              </div>
              {/* Filters (GET form) */}
              <form
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                onSubmit={(e) => { e.preventDefault(); setApplied(draft); notify(`Filtres PPM simulés appliqués : ${rows.length} marché(s) (mock).`); }}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Bailleur">
                    <select className={fieldClass} value={draft.bailleur} onChange={setD("bailleur")}>
                      <option value="">Tous les bailleurs</option>
                      {bailleurs.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="AGMO">
                    <select className={fieldClass} value={draft.agmo} onChange={setD("agmo")}>
                      <option value="">Tous les AGMO</option>
                      {agmos.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                  <Field label="Statut PPM">
                    <select className={fieldClass} value={draft.statut} onChange={setD("statut")}>
                      <option value="">Tous les statuts</option>
                      {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Type de marché">
                    <select className={fieldClass} value={draft.model_type} onChange={setD("model_type")}>
                      <option value="">Tous les types</option>
                      <option value="travaux">Travaux</option>
                      <option value="biens">Biens & Services</option>
                      <option value="consultants">Consultants</option>
                    </select>
                  </Field>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="submit" className="rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-700 px-5 py-2 text-[13px] font-bold text-white shadow">Filtrer</button>
                  {hasFilter && (
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-[13px] font-bold text-slate-600"
                      onClick={() => { const empty = { bailleur: "", agmo: "", statut: "", model_type: "" }; setDraft(empty); setApplied(empty); notify("Filtres PPM simulés réinitialisés (mock)."); }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </form>
              {/* Charts (doughnuts, cutout 62 %, légende bas) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(
                  [
                    ["Répartition par Bailleur", seg(byBailleur)],
                    ["Répartition par AGMO", seg(byAgmo)],
                    ["Répartition par Statut", seg(byStatut)],
                    ["Répartition par Type", seg(byModel)],
                  ] as [string, { label: string; value: number; color: string }[]][]
                ).map(([title, segments]) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
                    {segments.length === 0
                      ? <p className="py-8 text-center text-[12px] italic text-slate-400">Aucune donnée</p>
                      : <DonutCSS segments={segments} size={130} />}
                  </div>
                ))}
              </div>
              {/* Tables */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {detailTable("Détail par Bailleur", byBailleur, true)}
                {detailTable("Détail par AGMO", byAgmo, true)}
                {detailTable("Détail par Statut", byStatut, false)}
                {detailTable("Détail par Type de Marché", byModel, true)}
              </div>
            </div>
          </div>
        </div>
      </div>
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
      { id: "dash-ppm", label: "PPM admin Django", presenter: "P4", util: { purpose: "Pilotage du Plan Prévisionnel de Marchés côté back-office Django : consolide Travaux + Biens + Consultants avec filtres GET, 4 donuts et 4 tableaux détaillés.", users: "Admin Django (staff_member_required)", rules: "Accès staff uniquement ; 4 filtres combinés (bailleur, AGMO, statut, type) ; montants formatés fr (espace + 2 décimales) ; tri effectif décroissant ; Réinitialiser visible seulement si filtre actif.", script: "Côté back-office : douze marchés, quatre milliards d'ariary, ventilés par bailleur, agence, statut et type — et chaque filtre recalcule tout.", presenter: "Présentateur P4", file: "backend_PPM: apps/ppm/views/dashboard_view.py + templates/admin/ppm/dashboard.html" } },
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
    case "dash-tdr": return <DashTdrDemo notify={notify} />;
    case "dash-log": return <DashLogAdminDemo />;
    case "dash-contrat": return <DashContratDemo notify={notify} />;
    case "dash-eval": return <DashEvalSecDemo notify={notify} />;
    case "dash-ouv": return <DashOuvertureDemo notify={notify} />;
    case "dash-ppm": return <DashPpmAdminDemo notify={notify} />;
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




"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Shared styling — identical tokens to production forms               */
/* ------------------------------------------------------------------ */

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 hover:border-slate-300";
const textareaClass = `${fieldClass} min-h-[80px] resize-y`;
const labelClass =
  "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1";
const cardClass =
  "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] sm:p-8";
const sectionTitleClass =
  "text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700";

type Toast = { title: string; message: string } | null;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Login — replica of src/app/auth/login/page.tsx                    */
/* ------------------------------------------------------------------ */
function LoginForm({ onSuccess }: { onSuccess: (m: string) => void }) {
  const [email, setEmail] = useState("demo@ucp.mg");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,249,0.93)_100%)] p-7 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)] sm:p-8">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
        Unité de Coordination des Projets
      </p>
      <h2 className="mt-3 text-center text-3xl font-bold text-slate-900">Connexion</h2>
      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            onSuccess(`Connexion simulée pour ${email} — redirection vers le tableau de bord.`);
          }, 600);
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Saisir votre email"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Saisir votre mot de passe"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#166534] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_16px_30px_-20px_rgba(22,101,52,0.65)] transition hover:bg-[#14532d]"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Register public — replica of auth/public/register/page.tsx       */
/* ------------------------------------------------------------------ */
function RegisterForm({ onSuccess }: { onSuccess: (m: string) => void }) {
  const [f, setF] = useState({
    full_name: "Jean Dupont",
    email: "jean@entreprise.mg",
    phone: "+261 34 00 000 00",
    type_entite: "ENTREPRISE",
    nif: "1234567",
    password: "demo1234",
    confirmPassword: "demo1234",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form
      className="mx-auto w-full max-w-md space-y-4 rounded-[30px] border border-slate-200/80 bg-white p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.password !== f.confirmPassword) {
          onSuccess("Échec simulé : les mots de passe ne correspondent pas.");
          return;
        }
        onSuccess(`Compte fournisseur simulé créé pour ${f.email} — écran vérification e-mail.`);
      }}
    >
      <Field label="Nom complet">
        <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={f.full_name} onChange={set("full_name")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input type="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Téléphone">
          <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={f.phone} onChange={set("phone")} />
        </Field>
      </div>
      <Field label="Type d'entité">
        <select className={fieldClass} value={f.type_entite} onChange={set("type_entite")}>
          {["ENTREPRISE", "BUREAU_ETUDES", "ONG", "PARTICULIER", "CONSULTANT"].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>
      <Field label="NIF">
        <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={f.nif} onChange={set("nif")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mot de passe">
          <input type="password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" value={f.password} onChange={set("password")} />
        </Field>
        <Field label="Confirmation">
          <input type="password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" value={f.confirmPassword} onChange={set("confirmPassword")} />
        </Field>
      </div>
      <button type="submit" className="btn-primary w-full">
        Créer mon compte UCP
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Demande Achat — replica of personnel/demande-achat/new/page.tsx  */
/* ------------------------------------------------------------------ */
function DemandeAchatForm({ onSuccess }: { onSuccess: (m: string) => void }) {
  const [f, setF] = useState({
    uniteTechnique: "LOGISTIQUE",
    typeDemande: "MATERIELS",
    categorieBesoin: "NOUVEAU_BESOIN",
    priorite: "NORMAL",
    objet: "Achat ordinateurs de bureau",
    serviceBeneficiaire: "Service Informatique",
    lienPtba: "PTBA-2026-A1",
    justification: "Renouvellement du parc informatique.",
    designation: "Ordinateur portable",
    quantite: 5,
    prix: "2 500 000",
    lieu: "Antananarivo",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess("Demande ETAT DE BESOINS simulée transmise au valideur hiérarchique.");
  };
  return (
    <form onSubmit={submit} className={`${cardClass} space-y-6`}>
      <p className={sectionTitleClass}>Section 1 — Qualification</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Unité technique">
          <select className={fieldClass} value={f.uniteTechnique} onChange={set("uniteTechnique")}>
            {["PASSATION", "SUIVI_EVALUATION", "FINANCE", "LOGISTIQUE", "COORDINATION", "TECHNIQUE", "RH_ADMIN"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Type de demande">
          <select className={fieldClass} value={f.typeDemande} onChange={set("typeDemande")}>
            <option value="MATERIELS">Matériels</option>
            <option value="PETITS_SERVICES">Petits services</option>
          </select>
        </Field>
        <Field label="Catégorie de besoin">
          <select className={fieldClass} value={f.categorieBesoin} onChange={set("categorieBesoin")}>
            {["NOUVEAU_BESOIN", "REAPPROVISIONNEMENT", "REMPLACEMENT", "URGENCE"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Priorité">
          <select className={fieldClass} value={f.priorite} onChange={set("priorite")}>
            <option value="NORMAL">Normal (5 jours)</option>
            <option value="URGENT">Urgent (48h)</option>
          </select>
        </Field>
      </div>
      <p className={sectionTitleClass}>Section 2 — Objet du besoin</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Objet"><input className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Service bénéficiaire"><input className={fieldClass} value={f.serviceBeneficiaire} onChange={set("serviceBeneficiaire")} /></Field>
        <Field label="Lien PTBA"><input className={fieldClass} value={f.lienPtba} onChange={set("lienPtba")} /></Field>
        <Field label="Justification"><textarea className={textareaClass} value={f.justification} onChange={set("justification")} /></Field>
      </div>
      <p className={sectionTitleClass}>Section 3 — Ligne de besoin</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Désignation"><input className={fieldClass} value={f.designation} onChange={set("designation")} /></Field>
        <Field label="Quantité"><input type="number" className={fieldClass} value={f.quantite} onChange={(e) => setF((p) => ({ ...p, quantite: Number(e.target.value) }))} /></Field>
        <Field label="Prix unitaire estimé"><input className={fieldClass} value={f.prix} onChange={set("prix")} /></Field>
        <Field label="Lieu de livraison"><input className={fieldClass} value={f.lieu} onChange={set("lieu")} /></Field>
      </div>
      <button type="submit" className="btn-primary">Soumettre la demande</button>
    </form>
  );
}

/* To avoid hook-in-props complexity, define each modal form explicitly */
function ValidationDemo({ notify }: { notify: (m: string) => void }) {
  const [decision, setDecision] = useState("FAVORABLE");
  const [commentaire, setCommentaire] = useState("Dossier conforme, visa accordé.");
  const [conformite, setConformite] = useState("OUI");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Décision simulée enregistrée : ${decision}.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation — replica de ValidationModal.tsx</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Décision">
          <select className={fieldClass} value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option>FAVORABLE</option><option>DEFAVORABLE</option><option>A_COMPLETER</option><option>APPROUVEE</option>
          </select>
        </Field>
        <Field label="Conformité technique">
          <select className={fieldClass} value={conformite} onChange={(e) => setConformite(e.target.value)}>
            <option>OUI</option><option>NON</option>
          </select>
        </Field>
      </div>
      <Field label="Commentaire"><textarea className={textareaClass} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} /></Field>
      <button className="btn-primary" type="submit">Valider l&apos;étape</button>
    </form>
  );
}

function BudgetDemo({ notify }: { notify: (m: string) => void }) {
  const [ligne, setLigne] = useState("Ligne 1.2 — Fonctionnement");
  const [source, setSource] = useState("RSS3_GAVI");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Imputation simulée : ${ligne} / ${source}.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Imputation budgétaire — replica de BudgetModal.tsx</p>
      <Field label="Ligne budgétaire"><input className={fieldClass} value={ligne} onChange={(e) => setLigne(e.target.value)} /></Field>
      <Field label="Source de financement">
        <select className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)}>
          {["SRPS_CS7_FM", "RSS3_GAVI", "FAE", "CDS", "VAR", "PARN2", "PPSB"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <button className="btn-primary" type="submit">Enregistrer le budget</button>
    </form>
  );
}

function ReceptionDemo({ notify }: { notify: (m: string) => void }) {
  const [f, setF] = useState({ date: "2026-10-02", receptionnaire: "Service Logistique", conformite: "CONFORME", commentaire: "Colis reçus en bon état." });
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Réception simulée du ${f.date} (${f.conformite}).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Réception — replica de ReceptionModal.tsx</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de réception"><input type="date" className={fieldClass} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Réceptionnaire"><input className={fieldClass} value={f.receptionnaire} onChange={(e) => setF({ ...f, receptionnaire: e.target.value })} /></Field>
      </div>
      <Field label="Conformité quantité">
        <select className={fieldClass} value={f.conformite} onChange={(e) => setF({ ...f, conformite: e.target.value })}>
          <option>CONFORME</option><option>ECART_QUANTITE</option><option>AVARIE</option>
        </select>
      </Field>
      <Field label="Commentaire"><textarea className={textareaClass} value={f.commentaire} onChange={(e) => setF({ ...f, commentaire: e.target.value })} /></Field>
      <button className="btn-primary" type="submit">Valider la réception</button>
    </form>
  );
}

function PassationDemo({ notify }: { notify: (m: string) => void }) {
  const [mode, setMode] = useState("DEMANDE_COTATION");
  const [ref, setRef] = useState("MARCHE-2026-014");
  const [date, setDate] = useState("2026-10-02");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Passation simulée : ${mode} / ${ref}.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Passation — replica de PassationModal.tsx</p>
      <Field label="Mode de passation">
        <select className={fieldClass} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>DEMANDE_COTATION</option><option>APPEL_OFFRE</option><option>GRE_A_GRE</option>
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Référence marché"><input className={fieldClass} value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        <Field label="Date d'attribution"><input type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <button className="btn-primary" type="submit">Attribuer le marché</button>
    </form>
  );
}

function LivraisonClotureDemo({ notify }: { notify: (m: string) => void }) {
  const [date, setDate] = useState("2026-10-02");
  const [statut, setStatut] = useState("CLOTURE");
  const [satis, setSatis] = useState(5);
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Clôture simulée : ${statut}, satisfaction ${satis}/5.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Livraison / Clôture — replica de LivraisonModal + ClotureModal</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de livraison / clôture"><input type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Statut final">
          <select className={fieldClass} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option>CLOTURE</option><option>PARTIELLEMENT_EXECUTE</option>
          </select>
        </Field>
      </div>
      <Field label="Niveau de satisfaction">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setSatis(n)} className={`h-10 w-10 rounded-xl border text-sm font-black ${satis >= n ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400"}`}>{n}</button>
          ))}
        </div>
      </Field>
      <button className="btn-primary" type="submit">Clôturer le dossier</button>
    </form>
  );
}

function ProcurementDemo({ notify }: { notify: (m: string) => void }) {
  const [f, setF] = useState({ title: "Fourniture de vaccins — AOI-2026-03", procedure: "AOI", category: "BIENS", bailleur: "GAVI", deadline: "2026-11-15T12:00", publication: "2026-10-02" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Marché simulé publié : ${f.title}.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Marché / Procurement — replica de procurementForm.tsx</p>
      <Field label="Intitulé du marché"><input className={fieldClass} value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Procédure"><select className={fieldClass} value={f.procedure} onChange={set("procedure")}><option>AOI</option><option>AON</option><option>DC</option><option>GRE_A_GRE</option></select></Field>
        <Field label="Catégorie"><select className={fieldClass} value={f.category} onChange={set("category")}><option>BIENS</option><option>SERVICES</option><option>TRAVAUX</option></select></Field>
        <Field label="Bailleur"><select className={fieldClass} value={f.bailleur} onChange={set("bailleur")}><option>GAVI</option><option>GLOBAL_FUND</option><option>WORLD_BANK</option></select></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date de publication"><input type="date" className={fieldClass} value={f.publication} onChange={set("publication")} /></Field>
        <Field label="Deadline"><input type="datetime-local" className={fieldClass} value={f.deadline} onChange={set("deadline")} /></Field>
      </div>
      <Field label="Dossier de soumission (simulé)"><input type="file" className={fieldClass} onChange={() => {}} /></Field>
      <button className="btn-primary" type="submit">Publier le marché</button>
    </form>
  );
}

function SeanceDemo({ notify }: { notify: (m: string) => void }) {
  const [f, setF] = useState({ ref: "DOS-2026-011", objet: "Ouverture AOI vaccins", date: "2026-10-10", heure: "10:00", lieu: "Salle UCP", president: "Mme Rabe (Présidente)", obs: "Séance publique." });
  const [members, setMembers] = useState("A. Rakoto — Membre\nB. Rabe — Membre\nC. Randria — Membre");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Séance simulée créée : ${f.ref} (${members.split("\n").length} membres).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Séance d&apos;ouverture — replica de ouverture_offre/new</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Référence dossier"><input className={fieldClass} value={f.ref} onChange={set("ref")} /></Field>
        <Field label="Objet"><input className={fieldClass} value={f.objet} onChange={set("objet")} /></Field>
        <Field label="Date"><input type="date" className={fieldClass} value={f.date} onChange={set("date")} /></Field>
        <Field label="Heure"><input type="time" className={fieldClass} value={f.heure} onChange={set("heure")} /></Field>
        <Field label="Lieu"><input className={fieldClass} value={f.lieu} onChange={set("lieu")} /></Field>
        <Field label="Président"><input className={fieldClass} value={f.president} onChange={set("president")} /></Field>
      </div>
      <Field label="Membres de commission (min. 3)"><textarea className={textareaClass} value={members} onChange={(e) => setMembers(e.target.value)} /></Field>
      <button className="btn-primary" type="submit">Créer la séance</button>
    </form>
  );
}

function ValidationPubliqueDemo({ notify }: { notify: (m: string) => void }) {
  const [role, setRole] = useState("membre");
  const [decision, setDecision] = useState("VALIDE");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Décision publique simulée : ${decision} (${role}).`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Validation publique — replica de ouverture_offre/validation/[id]</p>
      <div className="flex gap-3">
        {(["membre", "president"] as const).map((r) => (
          <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${role === r ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>
            <input type="radio" checked={role === r} onChange={() => setRole(r)} />{r}
          </label>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email"><input type="email" defaultValue="membre@commission.mg" className={fieldClass} /></Field>
        <Field label="Mot de passe"><input type="password" defaultValue="demo1234" className={fieldClass} /></Field>
      </div>
      <Field label="Décision">
        <select className={fieldClass} value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option>VALIDE</option><option>REJETE</option><option>EN_ATTENTE</option>
        </select>
      </Field>
      <button className="btn-primary" type="submit">Soumettre la décision</button>
    </form>
  );
}

function EvaluationDemo({ notify }: { notify: (m: string) => void }) {
  const [step, setStep] = useState(1);
  const [score, setScore] = useState(82);
  const [reco, setReco] = useState("ATTRIBUER");
  return (
    <div className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Évaluation des offres — replica de EvaluationForm (4 étapes)</p>
      <div className="flex gap-2">
        {["1. Préliminaire", "2. Technique", "3. Financière", "4. Décision"].map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i + 1)} className={`rounded-xl px-3 py-2 text-[12px] font-bold ${step === i + 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>
        ))}
      </div>
      {step === 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {["Offre signée", "Garantie conforme", "Dossier administratif", "Validité de l'offre"].map((c) => (
            <label key={c} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><span>{c}</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-emerald-600" /></label>
          ))}
        </div>
      )}
      {step === 2 && (
        <Field label={`Note technique (${score}/100)`}>
          <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-emerald-600" />
        </Field>
      )}
      {step === 3 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Montant lu (Ar)"><input defaultValue="48 500 000" className={fieldClass} /></Field>
          <Field label="Montant évalué final (Ar)"><input defaultValue="47 900 000" className={fieldClass} /></Field>
        </div>
      )}
      {step === 4 && (
        <Field label="Recommandation">
          <select className={fieldClass} value={reco} onChange={(e) => setReco(e.target.value)}>
            <option>ATTRIBUER</option><option>REJETER</option><option>RELANCER</option>
          </select>
        </Field>
      )}
      <div className="flex gap-2">
        {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold">Précédent</button>}
        {step < 4
          ? <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">Enregistrer & continuer</button>
          : <button type="button" onClick={() => notify(`Évaluation simulée transmise : ${reco} (${score}/100).`)} className="btn-primary">Transmettre ({reco})</button>}
      </div>
    </div>
  );
}

function EvalLoginDemo({ notify }: { notify: (m: string) => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify("Accès évaluateur DAO simulé — liste des offres affichée."); }} className={`${cardClass} mx-auto max-w-md space-y-4`}>
      <p className={sectionTitleClass}>Login évaluateur DAO — replica de evaluation/login</p>
      <Field label="Email"><input type="email" defaultValue="evaluateur@ucp.mg" className={fieldClass} /></Field>
      <Field label="Code DAO"><input type="password" defaultValue="DAO-2026" className={fieldClass} /></Field>
      <button className="btn-primary w-full" type="submit">Accéder aux offres</button>
    </form>
  );
}

function TdrDemo({ notify }: { notify: (m: string) => void }) {
  const [f, setF] = useState({ intitule: "TDR — Formation logistique", type: "TDR", montant: "15 000", procedure: "DC", debut: "2026-11-01", fin: "2026-12-15" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`${f.type} simulé enregistré : ${f.intitule}.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>TDR / ST — replica de TdrSt/formulaire</p>
      <Field label="Intitulé"><input className={fieldClass} value={f.intitule} onChange={set("intitule")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type de document"><select className={fieldClass} value={f.type} onChange={set("type")}><option>TDR</option><option>ST</option></select></Field>
        <Field label="Procédure envisagée"><select className={fieldClass} value={f.procedure} onChange={set("procedure")}><option>DC</option><option>AOI</option><option>AON</option><option>GRE_A_GRE</option></select></Field>
        <Field label="Début"><input type="date" className={fieldClass} value={f.debut} onChange={set("debut")} /></Field>
        <Field label="Fin"><input type="date" className={fieldClass} value={f.fin} onChange={set("fin")} /></Field>
      </div>
      <Field label="Montant estimé (USD)"><input className={fieldClass} value={f.montant} onChange={set("montant")} /></Field>
      <button className="btn-primary" type="submit">Enregistrer le document</button>
    </form>
  );
}

function ContratDemo({ notify }: { notify: (m: string) => void }) {
  const [montant, setMontant] = useState("47 900 000");
  const [etape, setEtape] = useState("Avance de démarrage (30%)");
  return (
    <form onSubmit={(e) => { e.preventDefault(); notify(`Échéancier simulé ajouté : ${etape} — ${montant} Ar.`); }} className={`${cardClass} space-y-4`}>
      <p className={sectionTitleClass}>Contrat NOTI5 + échéancier — replica de contractualisation/[id]</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="E-mail prestataire"><input type="email" defaultValue="prestataire@entreprise.mg" className={fieldClass} /></Field>
        <Field label="Durée d'exécution"><input defaultValue="90 jours" className={fieldClass} /></Field>
      </div>
      <Field label="Clauses particulières"><textarea defaultValue="Pénalités de retard 1/1000 par jour." className={textareaClass} readOnly={false} onChange={() => {}} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Étape"><input className={fieldClass} value={etape} onChange={(e) => setEtape(e.target.value)} /></Field>
        <Field label="Montant (Ar)"><input className={fieldClass} value={montant} onChange={(e) => setMontant(e.target.value)} /></Field>
      </div>
      <button className="btn-primary" type="submit">Ajouter l&apos;échéance</button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

const CATALOG: { group: string; items: { id: string; label: string; desc: string; roles: string }[] }[] = [
  {
    group: "Authentification",
    items: [
      { id: "login", label: "Connexion", desc: "auth/login — email + mot de passe", roles: "Public" },
      { id: "register", label: "Inscription fournisseur", desc: "auth/public/register — compte libre", roles: "Public" },
      { id: "eval-login", label: "Login évaluateur DAO", desc: "evaluation/login — code DAO isolé", roles: "Évaluateur" },
    ],
  },
  {
    group: "Demande d'achat",
    items: [
      { id: "demande", label: "État de besoins (création)", desc: "demande-achat/new — 3 sections + lignes", roles: "Demandeur" },
      { id: "validation", label: "Validation", desc: "ValidationModal — décision + commentaire", roles: "Validateur" },
      { id: "budget", label: "Imputation budgétaire", desc: "BudgetModal — ligne + source", roles: "Finance" },
      { id: "passation", label: "Passation", desc: "PassationModal — mode + attribution", roles: "Agent achat" },
      { id: "reception", label: "Réception", desc: "ReceptionModal — PV + écarts", roles: "Logistique" },
      { id: "cloture", label: "Livraison / Clôture", desc: "LivraisonModal + ClotureModal", roles: "Logistique" },
    ],
  },
  {
    group: "Marchés & séances",
    items: [
      { id: "marche", label: "Publication marché", desc: "procurementForm — AOI/AON/DC", roles: "Agent marché" },
      { id: "seance", label: "Séance d'ouverture", desc: "ouverture_offre/new — commission ≥ 3", roles: "Admin / Secrétaire" },
      { id: "validation-publique", label: "Validation publique", desc: "validation/[id] — membre/président", roles: "Commission (sans JWT)" },
    ],
  },
  {
    group: "Évaluation & contrat",
    items: [
      { id: "evaluation", label: "Évaluation (4 étapes)", desc: "EvaluationForm — wizard noté", roles: "Évaluateur assigné" },
      { id: "tdr", label: "TDR / ST", desc: "TdrSt/formulaire — doc + budget", roles: "Demandeur" },
      { id: "contrat", label: "Contrat NOTI5", desc: "contractualisation/[id] — échéancier", roles: "Contratualisation" },
    ],
  },
];

export default function PresentationPage() {
  const [active, setActive] = useState("demande");
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string) => {
    setToast({ title: "Succès (simulation)", message });
    window.setTimeout(() => setToast(null), 3500);
  };
  const activeMeta = CATALOG.flatMap((c) => c.items).find((i) => i.id === active);

  return (
    <main className="min-h-screen bg-[#eceeef] pb-16 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">UCP — Démo jury</p>
            <h1 className="text-2xl font-black tracking-tight">Catalogue des formulaires <span className="text-emerald-700">/presentation</span></h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Tous les formulaires, 100% mockés (useState local) — aucun backend, aucun rôle requis.</p>
          </div>
          <span className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Mode présentation</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-4 pt-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 lg:sticky lg:top-6">
          {CATALOG.map((c) => (
            <div key={c.group} className="mb-4 last:mb-0">
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{c.group}</p>
              <div className="space-y-1">
                {c.items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setActive(it.id)}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left transition ${active === it.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "hover:bg-slate-100 text-slate-700"}`}
                  >
                    <span className="block text-[13px] font-bold">{it.label}</span>
                    <span className={`block text-[11px] font-medium ${active === it.id ? "text-emerald-100" : "text-slate-400"}`}>{it.roles}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <section className="page-enter space-y-4" key={active}>
          {activeMeta && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-sm font-black text-emerald-900">{activeMeta.label}</p>
              <p className="text-[13px] font-medium text-emerald-800">{activeMeta.desc} — rôle d&apos;origine : {activeMeta.roles} (contourné ici).</p>
            </div>
          )}
          {active === "login" && <LoginForm onSuccess={notify} />}
          {active === "register" && <RegisterForm onSuccess={notify} />}
          {active === "eval-login" && <EvalLoginDemo notify={notify} />}
          {active === "demande" && <DemandeAchatForm onSuccess={notify} />}
          {active === "validation" && <ValidationDemo notify={notify} />}
          {active === "budget" && <BudgetDemo notify={notify} />}
          {active === "passation" && <PassationDemo notify={notify} />}
          {active === "reception" && <ReceptionDemo notify={notify} />}
          {active === "cloture" && <LivraisonClotureDemo notify={notify} />}
          {active === "marche" && <ProcurementDemo notify={notify} />}
          {active === "seance" && <SeanceDemo notify={notify} />}
          {active === "validation-publique" && <ValidationPubliqueDemo notify={notify} />}
          {active === "evaluation" && <EvaluationDemo notify={notify} />}
          {active === "tdr" && <TdrDemo notify={notify} />}
          {active === "contrat" && <ContratDemo notify={notify} />}
        </section>
      </div>

      {/* Toast — reuses .ucp-toast styles from globals.css */}
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

const fs = require('fs');

const path = '/home/stephanie/firstStageDev/UCP/ucp-frontend/src/app/demande-achat/components/ReceptionModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Compact form container and gaps
content = content.replace(
  `        {/* CONTENU PRINCIPAL */}
        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-6 overflow-y-auto">`,
  `        {/* CONTENU PRINCIPAL */}
        <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-4 overflow-y-auto">`
);

// 2. Compact BLOC 1 (Expedition)
content = content.replace(
  `{/* BLOC 1 - EXPÉDITION (Haut compact) */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">`,
  `{/* BLOC 1 - EXPÉDITION (compact) */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">`
);

// 3. Compact BLOC 2 (Date/Recep)
content = content.replace(
  `<div className="grid grid-cols-2 gap-4 border-b border-slate-100 p-4">`,
  `<div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-4 py-3">`
);

// 4. Documents compact form
const docsRegex = /\{\/\* Upload Bon de Livraison professionnel \*\/\}[\\s\\S]*\{\/\* Upload PV de réception professionnel \*\/\}[\\s\\S]*?<\/div>/;

const docsReplacement = `{/* Documents (Compact) */}
              <div className="flex gap-3">
                <input type="file" id="bl-upload" className="hidden" onChange={(e) => setFileBL(e.target.files?.[0] || null)} />
                <label htmlFor="bl-upload" className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                  <FileText className="h-4 w-4" />
                  {fileBL ? \`BL: \${fileBL.name.substring(0,10)}...\` : "Ajouter bon de livraison"}
                  {fileBL && <Check className="h-3 w-3 text-emerald-600" />}
                </label>

                <input type="file" id="pv-upload" className="hidden" onChange={(e) => setFilePV(e.target.files?.[0] || null)} />
                <label htmlFor="pv-upload" className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100">
                  <FileText className="h-4 w-4" />
                  {filePV ? \`PV: \${filePV.name.substring(0,10)}...\` : "Ajouter PV de réception"}
                  {filePV && <Check className="h-3 w-3 text-emerald-600" />}
                </label>
              </div>`;

content = content.replace(/\{\/\* Upload Bon de Livraison professionnel \*\/\}[\s\S]*\{\/\* Upload PV de réception professionnel \*\/\}[\s\S]*?<\/div>/, docsReplacement);

// 5. Huge Buttons for Conformite sans labels extra
const buttonsRegex = /\{\/\* Décision Boutons \*\/\}[\s\S]*?(?=<\/div>\s*<\/div>\s*\{\/\* BLOC 3)/;

const buttonsReplacement = `{/* Décision Boutons */}
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 md:flex-row items-center justify-center">
              <div className="flex gap-2 w-full md:w-auto">
                <button type="button" onClick={() => setConformiteQuantite("CONFORME")} className={\`flex-1 md:flex-none rounded-lg border px-6 py-3 text-sm font-bold shadow-sm transition \${conformiteQuantite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}\`}>
                  Conforme (Qte)
                </button>
                <button type="button" onClick={() => setConformiteQuantite("PARTIELLE")} className={\`flex-1 md:flex-none rounded-lg border px-6 py-3 text-sm font-bold shadow-sm transition \${conformiteQuantite === "PARTIELLE" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}\`}>
                  Partielle
                </button>
                <button type="button" onClick={() => setConformiteQuantite("NON_CONFORME")} className={\`flex-1 md:flex-none rounded-lg border px-6 py-3 text-sm font-bold shadow-sm transition \${conformiteQuantite === "NON_CONFORME" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}\`}>
                  Non conforme
                </button>
              </div>
              <div className="hidden h-8 w-px bg-slate-300 md:block mx-2"></div>
              <div className="flex gap-2 w-full md:w-auto">
                <button type="button" onClick={() => setConformiteQualite("CONFORME")} className={\`flex-1 md:flex-none rounded-lg border px-6 py-3 text-sm font-bold shadow-sm transition \${conformiteQualite === "CONFORME" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}\`}>
                  Qualité OK
                </button>
                <button type="button" onClick={() => setConformiteQualite("NON_CONFORME")} className={\`flex-1 md:flex-none rounded-lg border px-6 py-3 text-sm font-bold shadow-sm transition \${conformiteQualite === "NON_CONFORME" || conformiteQualite === "DEFECTUEUX" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}\`}>
                  Problème qualité
                </button>
              </div>
            </div>`;

content = content.replace(buttonsRegex, buttonsReplacement);

// 6. Ecart bloc ultra compact
const ecartRegex = /\{\/\* BLOC 3 - ÉCART \(Conditionnel\) \*\/\}[\s\S]*?(?=<\/div>\s*\{\/\* BLOC 4)/;

const ecartReplacement = `{/* BLOC 3 - ÉCART (Conditionnel) */}
          {isProblemDetected && (
            <div className="flex animate-in fade-in slide-in-from-top-2 items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <select value={typeEcart} onChange={(e) => setTypeEcart(e.target.value as any)} className="w-[180px] rounded border border-rose-200 bg-white px-2 py-1.5 text-xs font-semibold text-rose-900 outline-none">
                <option value="MANQUANT">Manquant</option>
                <option value="DEFECTUEUX">Défectueux</option>
                <option value="NON_CONFORME">Non conforme</option>
              </select>
              <select value={actionCorrective} onChange={(e) => setActionCorrective(e.target.value as any)} className="w-[180px] rounded border border-rose-200 bg-white px-2 py-1.5 text-xs font-semibold text-rose-900 outline-none">
                <option value="REMPLACEMENT">Remplacement</option>
                <option value="AVOIR">Avoir / Rembours.</option>
                <option value="REJET">Rejet définitif</option>
              </select>
              <input type="text" required value={descriptionEcart} onChange={(e) => setDescriptionEcart(e.target.value)} placeholder="Précisez le problème..." className="flex-1 rounded border border-rose-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-rose-300" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600">
              {error}
            </div>
          )}`;

content = content.replace(ecartRegex, ecartReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Update layout done!');

const fs = require('fs');

const path = '/home/stephanie/firstStageDev/UCP/ucp-frontend/src/app/demande-achat/components/ReceptionModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove initial default date and receptionnaire
content = content.replace(
  `  const [dateReception, setDateReception] = useState(() => demande?.date_reception || getTodayDate());
  const [receptionnaire, setReceptionnaire] = useState(() =>
    getDefaultReceptionnaire(demande, currentUser),
  );`,
  `  const [dateReception, setDateReception] = useState(() => demande?.date_reception || "");
  const [receptionnaire, setReceptionnaire] = useState(() => demande?.receptionnaire || "");`
);

// 2. Initial line quantities should be undefined (or empty string in state) and NO default
content = content.replace(
  `    quantite_recue: ligne.quantite_recue ?? ligne.quantite ?? 0,`,
  `    quantite_recue: ligne.quantite_recue ?? ("" as any),`
);

// 3. Bring back Conformité Quantité state if we want to ask it, OR keep it computed but show it differently. 
// Wait, the user said "il n y a que conforme qualite ,et pas de quantitie comme avant"
// Let's add Conformite Quantite back to state so it behaves like Qualite.
content = content.replace(
  `  const [conformiteQualite, setConformiteQualite] = useState<`,
  `  const [conformiteQuantite, setConformiteQuantite] = useState<ReceiveDemandePayload["conformite_quantite"] | "">(() => (demande?.conformite_quantite as ReceiveDemandePayload["conformite_quantite"]) || "");
  const [conformiteQualite, setConformiteQualite] = useState<`
);

content = content.replace(
  `  const conformiteQuantite = isQuantiteDiff ? "PARTIELLE" : "CONFORME";

  const isProblemDetected = useMemo(() => {
    return isQuantiteDiff || (conformiteQualite !== "" && conformiteQualite !== "CONFORME");
  }, [isQuantiteDiff, conformiteQualite]);`,
  `  const isProblemDetected = useMemo(() => {
    return (conformiteQuantite !== "" && conformiteQuantite !== "CONFORME") || 
           (conformiteQualite !== "" && conformiteQualite !== "CONFORME") || 
           isQuantiteDiff;
  }, [conformiteQuantite, conformiteQualite, isQuantiteDiff]);`
);


// 4. Update the layout: bigger modal, no note column, better inputs.
content = content.replace(
  `max-w-[1024px] rounded-2xl bg-white shadow-2xl flex flex-col max-h-screen`,
  `max-w-[1200px] w-[95vw] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[95vh]`
);

// Remove Note column from table header
content = content.replace(
  `<th className="border-b border-slate-100 px-4 py-2">Note</th>`,
  ``
);

// Remove Note column and update Qte reçue input
content = content.replace(
  `                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={ligneState.quantite_recue}
                            onChange={(e) => handleLigneChange(ligne.id!, "quantite_recue", Number(e.target.value))}
                            className={\`w-full rounded-md border py-1.5 text-center font-bold outline-none \${
                              isDiff ? "border-amber-300 text-amber-700 focus:border-amber-500" : "border-slate-200 text-slate-800 focus:border-emerald-500"
                            }\`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={ligneState.observation_reception}
                            onChange={(e) => handleLigneChange(ligne.id!, "observation_reception", e.target.value)}
                            placeholder="Note optionnelle"
                            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none placeholder:text-slate-300 focus:border-emerald-500"
                          />
                        </td>`,
  `                        <td className="px-4 py-2 text-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="Saisir la quantité..."
                              value={ligneState.quantite_recue === "" ? "" : ligneState.quantite_recue}
                              onChange={(e) => handleLigneChange(ligne.id!, "quantite_recue", e.target.value === "" ? "" : Number(e.target.value))}
                              className={\`w-full rounded-lg border-2 bg-slate-50 focus:bg-white px-3 py-2.5 text-center text-sm font-bold shadow-inner outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:ring-4 \${
                                ligneState.quantite_recue === "" ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100" : 
                                isDiff ? "border-amber-300 text-amber-700 focus:border-amber-500 focus:ring-amber-100" : "border-emerald-300 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-100"
                              }\`}
                            />
                            {ligneState.quantite_recue === "" && (
                              <div className="absolute -top-2 -right-2 right-0">
                                <span className="flex h-3 w-3 rounded-full bg-amber-500 shadow-sm animate-pulse"></span>
                              </div>
                            )}
                          </div>
                        </td>`
);

// Update Conformité Buttons Area (bringing back Conformité Quantité and styling)
content = content.replace(
  `            {/* Décision Boutons */}
            <div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 p-4 shrink-0">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Qualité
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConformiteQualite("CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition \${
                      conformiteQualite === "CONFORME"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }\`}
                  >
                    Qualité OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQualite("NON_CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition \${
                      conformiteQualite === "NON_CONFORME"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }\`}
                  >
                    Problème qualité
                  </button>
                </div>
              </div>
            </div>`,
  `            {/* Décision Boutons */}
            <div className="flex flex-col gap-6 border-t border-slate-100 bg-slate-50/50 p-4 shrink-0 md:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Quantité (Rendu Global)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQuantite === "CONFORME"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Totale
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("PARTIELLE")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQuantite === "PARTIELLE"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Partielle
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQuantite("NON_CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQuantite === "NON_CONFORME"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Anormale
                  </button>
                </div>
              </div>

              <div className="hidden w-px bg-slate-200 md:block"></div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Conformité Qualité (État)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConformiteQualite("CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQualite === "CONFORME"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Sans dégâts
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQualite("NON_CONFORME")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQualite === "NON_CONFORME"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Non conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => setConformiteQualite("DEFECTUEUX")}
                    className={\`flex-1 rounded-lg border py-2.5 text-sm font-bold transition shadow-sm \${
                      conformiteQualite === "DEFECTUEUX"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }\`}
                  >
                    Défectueux
                  </button>
                </div>
              </div>
            </div>`
);


// Better file upload areas (professional dropzones)
content = content.replace(
  `              {/* Upload Bon de Livraison */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="bl-upload"
                  className="hidden"
                  onChange={(e) => setFileBL(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="bl-upload"
                  className={\`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition \${
                    fileBL
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }\`}
                >
                  <FileText className="h-4 w-4" />
                  {fileBL ? <span className="max-w-[120px] truncate">{fileBL.name}</span> : "Bon de livraison"}
                  {fileBL && <Check className="h-4 w-4 shrink-0" />}
                </label>
              </div>

              {/* Upload PV de réception */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="pv-upload"
                  className="hidden"
                  onChange={(e) => setFilePV(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="pv-upload"
                  className={\`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition \${
                    filePV
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }\`}
                >
                  <FileText className="h-4 w-4" />
                  {filePV ? <span className="max-w-[120px] truncate">{filePV.name}</span> : "PV de réception"}
                  {filePV && <Check className="h-4 w-4 shrink-0" />}
                </label>
              </div>`,
  `              {/* Upload Bon de Livraison professionnel */}
              <div className="flex flex-col gap-1 w-full md:w-48">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bon de livraison</label>
                <input
                  type="file"
                  id="bl-upload"
                  className="hidden"
                  onChange={(e) => setFileBL(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="bl-upload"
                  className={\`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-3 text-center transition group \${
                    fileBL
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
                  }\`}
                >
                  {fileBL ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-800 truncate w-[140px] px-2">{fileBL.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-emerald-700">
                      <FileText className="h-5 w-5 mb-0.5 opacity-60" />
                      <span className="text-xs font-bold">Sélectionner fichier</span>
                      <span className="text-[10px] opacity-60">PDF, JPG, PNG</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Upload PV de réception professionnel */}
              <div className="flex flex-col gap-1 w-full md:w-48">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PV de réception</label>
                <input
                  type="file"
                  id="pv-upload"
                  className="hidden"
                  onChange={(e) => setFilePV(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="pv-upload"
                  className={\`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-3 text-center transition group \${
                    filePV
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
                  }\`}
                >
                  {filePV ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-full bg-blue-100 p-1.5 text-blue-700">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-blue-800 truncate w-[140px] px-2">{filePV.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-blue-700">
                      <FileText className="h-5 w-5 mb-0.5 opacity-60" />
                      <span className="text-xs font-bold">Sélectionner fichier</span>
                      <span className="text-[10px] opacity-60">Optionnel</span>
                    </div>
                  )}
                </label>
              </div>`
);


// Let's add a small check to disable submission if some quantities are missing (since they are empty by default)
// Wait, quantite_recue is ANY or number, but if it is "", we should block it!
content = content.replace(
  `disabled={saving || conformiteQualite === ""}`,
  `disabled={saving || conformiteQualite === "" || conformiteQuantite === "" || lignes.some(l => l.quantite_recue === "" as any) || !dateReception || !receptionnaire}`
);


// And update validation: `if (conformiteQualite === "" || conformiteQuantite === "") return;`
content = content.replace(
  `if (conformiteQualite === "") return;`,
  `if (conformiteQualite === "" || conformiteQuantite === "" || !dateReception || !receptionnaire) return;`
);

// We need to bring back CheckCircle icon in Lucide
fs.writeFileSync(path, content, 'utf8');
console.log('Update done!');

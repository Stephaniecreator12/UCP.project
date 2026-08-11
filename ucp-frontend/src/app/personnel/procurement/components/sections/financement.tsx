"use client";
import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { TextLabel, TextTitle } from "@/app/components/textStyle";
import { useWatch } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import { useEffect } from "react";
import { ProcurementFormValues }
  from "../../../../../types/procurement";
import { FINANCE_CATALOG } from "@/lib/financeCatalog";
import { getChoiceLabel } from "@/services/choices";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";

const FINANCING_SOURCE_FALLBACK = [
  { code: "FM", label: "Fonds Mondial" },
  { code: "GAVI", label: "Alliance Gavi" },
  { code: "BM", label: "Banque Mondiale" },
];

function generateProjectCode(bailleur: string | undefined, optionKey: string | undefined) {
  if (!bailleur || !optionKey) return "";

  const match = FINANCE_CATALOG.find(
    (c) => c.family === bailleur && c.optionKey === optionKey
  );

  return match ? match.subvention : "";
}

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function FinancingSection({
  form,
}: Props) {



  const selected = useWatch({
    control: form.control,
    name: "financing_sources",
  });
  const referenceBailleur = useWatch({
    control: form.control,
    name: "reference_bailleur",
  });
  const projectCode = useWatch({
    control: form.control,
    name: "project_code",
  });
  const optionKey = useWatch({
    control: form.control,
    name: "optionKey",
  });
  const financingSources = useReferenceChoices("FINANCING_SOURCE", FINANCING_SOURCE_FALLBACK);
  useEffect(() => {
    if (!selected) return;

    if (selected.length === 1) {
      form.setValue("reference_bailleur", selected[0]);
    }

    if (selected.length === 0) {
      form.setValue("reference_bailleur", undefined);
    }
    if (referenceBailleur && optionKey) {
      const code = generateProjectCode(referenceBailleur, optionKey);
      form.setValue("project_code", code, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selected, referenceBailleur, form, optionKey]);
  const {
    register,
    formState: { errors },
  } = form;
  const selectClassName = "w-full md:w-1/2 px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:bg-slate-50/50 outline-none shadow-3xs transition-all duration-150";

  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
          Financement & conformité bailleur
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 space-y-6">

        <div className="flex flex-col">
        <TextTitle text="Source de financement"></TextTitle>
        <div className="flex flex-row flex-wrap items-center gap-5 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
          {financingSources.map((source) => {
            return (
              <label
                key={source.code}
                className="flex items-center gap-2.5 cursor-pointer bg-white border border-slate-150 px-3 py-1.5 rounded-lg shadow-3xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
              >
                <input
                  type="checkbox"
                  value={source.code}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-transparent cursor-pointer"
                  {...form.register("financing_sources")}
                />
                <TextLabel text={source.label}>
                </TextLabel>
              </label>
            );
          })}
          {errors.financing_sources && (
            <p className="text-red-600 font-medium text-xs w-full mt-1">⚠️ {errors.financing_sources.message}</p>
          )}
        </div>
          
        </div>


        <div className="flex flex-col gap-2.5">

          <TextTitle text="Bailleur référent"></TextTitle>
          {selected.length > 1 ? (
            <select
              {...form.register("reference_bailleur")}
              className={selectClassName}
            >
              <option value="">Aucun</option>
              {selected.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {getChoiceLabel(financingSources, item)}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg w-fit min-w-[150px] shadow-3xs">
              {selected.length ?
                <TextLabel text={getChoiceLabel(financingSources, selected[0])}></TextLabel> : <TextLabel text="Aucun"></TextLabel>}
            </div>
          )
          }
          {errors.reference_bailleur && (
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.reference_bailleur.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          <TextTitle text="Libellé budgétaire"></TextTitle>
          {
            referenceBailleur ?
              (
                <select {...form.register("optionKey")} className={selectClassName}>
                  <option value="">Aucun</option>
                  {FINANCE_CATALOG.filter(c => c.family === referenceBailleur).map((entry) => (
                    <option key={entry.optionKey} value={entry.optionKey}>
                      {entry.optionKey}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg w-fit min-w-[150px] shadow-3xs">
                  <TextLabel text="Aucun">
                  </TextLabel>
                </div>

              )
          }
          {errors.optionKey && (
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.optionKey.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <TextTitle text="Code projet"></TextTitle>
          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg w-fit min-w-[150px] shadow-3xs font-mono text-sm text-slate-700 font-bold">
            <TextLabel text={
              optionKey ? projectCode :
                "Aucun"
            }>
            </TextLabel>
          </div>
          {errors.project_code && (
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.project_code.message}</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

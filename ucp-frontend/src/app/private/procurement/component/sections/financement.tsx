"use client";
import { FINANCING_SOURCE_LABELS } from "@/lib/locales/french";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";
import { useWatch } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import { useEffect} from "react";
import { ProcurementFormValues }
from "../../../../../types/procurement";
import { FINANCE_CATALOG } from "@/lib/financeCatalog";

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
}, [selected,referenceBailleur, form, optionKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Financement & conformité bailleur
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex flex-row flex-wrap items-center gap-6">
            {Array.from(new Set(FINANCE_CATALOG.map((e) => e.family))).map((family) => {
              const entry = FINANCE_CATALOG.find((e) => e.family === family);
              return (
                <label 
                  key={family} 
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    value={family}
                    className="w-4 h-4"
                    {...form.register("financing_sources")}
                  />
                  <span className="text-sm font-medium leading-none">
                    {entry?.familyLabel}
                  </span>
                </label>
              );
            })}
          </div>

        
          <div className="flex flex-col">

            <label>
              Bailleur référent
            </label>
            {selected.length > 1? (
            <select
              {...form.register("reference_bailleur")}
              className="input"
            >
              {selected.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {FINANCING_SOURCE_LABELS[item]}
                </option>
              ))}
            </select>
            ):(
              <div>
                {selected.length?
                <p>{FINANCING_SOURCE_LABELS[selected[0]]}</p>:<p>aucun</p>}
              </div>
            )
        }
          </div>
        <div>
  <label>Libellé budgétaire</label>
  {
    referenceBailleur?
    (
      <select {...form.register("optionKey")} className="input flex flex-col">
        <option value="">Sélectionnez un budget</option>
        {FINANCE_CATALOG.filter(c => c.family === referenceBailleur).map((entry) => (
          <option key={entry.optionKey} value={entry.optionKey}>
            {entry.optionKey}
          </option>
        ))}
      </select>
    ):(
      <span className="text-sm font-medium leading-none">
        Aucun
      </span>
    )
  }
  
</div>

        <div>

          <label>
            Code projet
          </label>

          <p>{projectCode}</p>

        </div>

      </CardContent>
    </Card>
  );
}

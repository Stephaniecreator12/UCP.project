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
import { useEffect } from "react";
import { ProcurementFormValues }
from "../../../../../types/procurement";
import { FINANCE_CATALOG } from "@/lib/financeCatalog";
function generateProjectCode(bailleur: string | undefined) {
  if (!bailleur) return "";

  const match = FINANCE_CATALOG.find(
    (c) => c.family === bailleur
  );

  return match ? match.value : "";
}
export type FinancingSource =
  | "Fonds Mondial"
  | "Alliance Gavi"
  | "Banque Mondiale";

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
  useEffect(() => {
  if (!selected) return;

  if (selected.length === 1) {
    form.setValue("reference_bailleur", selected[0]);
  }

  if (selected.length === 0) {
    form.setValue("reference_bailleur", undefined);
  }
  if (!referenceBailleur) return;
  const code = generateProjectCode(referenceBailleur);

  if (code) {
    form.setValue("project_code", code, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
}, [selected,referenceBailleur, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Financement & conformité bailleur
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="space-y-3">

          <label>
            Sources de financement
          </label>

          <div className="flex gap-6">

            <label>
              <input
                type="checkbox"
                value="GLOBAL_FUND"
                {...form.register("financing_sources")}
              />

              Fonds Mondial
            </label>

            <label>
              <input
                type="checkbox"
                value="GAVI"
                {...form.register("financing_sources")}
              />

              Alliance Gavi
            </label>

            <label>
              <input
                type="checkbox"
                value="WORLD_BANK"
                {...form.register("financing_sources")}
              />

              Banque Mondiale
            </label>

          </div>

        </div>

        
          <div>

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

          <label>
            Code projet
          </label>

          <p>{projectCode}</p>

        </div>

      </CardContent>
    </Card>
  );
}
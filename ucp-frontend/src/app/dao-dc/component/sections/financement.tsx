"use client";
import { FINANCING_SOURCE_LABELS } from "@/lib/locales/french";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";
import { TextLabel, TextTitle } from "@/app/components/textStyle";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import type { ProcurementFormValues } from "@/types/procurement";
import { FINANCE_CATALOG } from "@/lib/financeCatalog";

const SOURCE_TO_FAMILY = {
  GLOBAL_FUND: "FM",
  GAVI: "GAVI",
  WORLD_BANK: "BM",
} as const;

type BackendFinancingSource = keyof typeof SOURCE_TO_FAMILY;

function getFamilyFromSource(source: string | undefined) {
  if (!source) return undefined;
  return SOURCE_TO_FAMILY[source as BackendFinancingSource];
}

function generateProjectCode(
  bailleur: string | undefined,
  optionKey: string | undefined,
) {
  const family = getFamilyFromSource(bailleur);
  if (!family || !optionKey) return "";

  const match = FINANCE_CATALOG.find(
    (c) => c.family === family && c.optionKey === optionKey
  );

  return match ? match.subvention : "";
}

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function FinancingSection({
  form,
}: Props) {
  const watchedSelected = useWatch({
    control: form.control,
    name: "financing_sources",
    defaultValue: [],
  });
  const selected = useMemo(
    () => (watchedSelected ?? []) as BackendFinancingSource[],
    [watchedSelected],
  );
  const referenceBailleur = useWatch({
    control: form.control,
    name: "reference_bailleur",
  }) as BackendFinancingSource | undefined;
  const projectCode = useWatch({
    control: form.control,
    name: "project_code",
  });
  const optionKey = useWatch({
    control: form.control,
    name: "optionKey",
  });
  useEffect(() => {
    if (selected.length === 1) {
      if (referenceBailleur !== selected[0]) {
        form.setValue("reference_bailleur", selected[0]);
      }
    }

    if (selected.length === 0) {
      form.setValue("reference_bailleur", undefined);
      form.setValue("optionKey", undefined);
      form.setValue("project_code", undefined);
      return;
    }

    if (
      selected.length > 1 &&
      referenceBailleur &&
      !selected.includes(referenceBailleur)
    ) {
      form.setValue("reference_bailleur", undefined);
      form.setValue("optionKey", undefined);
      form.setValue("project_code", undefined);
      return;
    }

    const effectiveReference =
      selected.length === 1 ? selected[0] : referenceBailleur;

    if (!effectiveReference || !optionKey) {
      form.setValue("project_code", undefined);
      return;
    }

    const family = getFamilyFromSource(effectiveReference);
    const optionMatchesReference = FINANCE_CATALOG.some(
      (entry) => entry.family === family && entry.optionKey === optionKey,
    );

    if (!optionMatchesReference) {
      form.setValue("optionKey", undefined);
      form.setValue("project_code", undefined);
      return;
    }

    if (effectiveReference && optionKey) {
      const code = generateProjectCode(effectiveReference, optionKey);
      form.setValue("project_code", code, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selected, referenceBailleur, form, optionKey]);
  const {
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Financement & conformité bailleur
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex flex-row flex-wrap items-center gap-6">
            {(Object.entries(FINANCING_SOURCE_LABELS) as Array<[BackendFinancingSource, string]>).map(([source, label]) => {
              return (
                <label 
                  key={source} 
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    value={source}
                    className="w-4 h-4"
                    {...form.register("financing_sources", {
                      validate: (value) =>
                        (Array.isArray(value) && value.length > 0) ||
                        "Sélectionne au moins une source de financement.",
                    })}
                  />
                  <TextLabel text={label} />
                </label>
              );
            })}
            {errors.financing_sources && (
              <p className="text-red-500 text-xs mt-1">{errors.financing_sources.message}</p>
            )}
          </div>

        
          <div className="flex flex-col gap-3">

          <TextTitle text="Bailleur référent"></TextTitle>
            {selected.length > 1 ? (
            <select
              {...form.register("reference_bailleur")}
              className="input"
            >
              <option value="">Aucun</option>
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
                {selected.length
                  ? <TextLabel text={FINANCING_SOURCE_LABELS[selected[0]]} />
                  : <TextLabel text="Aucun" />}
              </div>
            )
        }
        {errors.reference_bailleur && (
          <p className="text-red-500 text-xs mt-1">{errors.reference_bailleur.message}</p>
        )}
          </div>
        <div className="flex flex-col gap-3">
  <TextTitle text="Libellé budgétaire"></TextTitle>
  {
    referenceBailleur?
    (
      <select {...form.register("optionKey")} className="input">
        <option value="">Aucun</option>
        {FINANCE_CATALOG.filter(
          (c) => c.family === getFamilyFromSource(referenceBailleur),
        ).map((entry) => (
          <option key={entry.optionKey} value={entry.optionKey}>
            {entry.optionKey}
          </option>
        ))}
      </select>
    ):(
      <div>
        <TextLabel text="Aucun">
        </TextLabel>
      </div>
      
    )
  }
  {errors.optionKey && (
    <p className="text-red-500 text-xs mt-1">{errors.optionKey.message}</p>
  )}
</div>

        <div className="flex flex-col gap-3">
          <TextTitle text="Code projet"></TextTitle>
          <TextLabel text={optionKey ? projectCode : "Aucun"} />
          {errors.project_code && (
            <p className="text-red-500 text-xs mt-1">{errors.project_code.message}</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

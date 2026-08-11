"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { TextTitle} from "@/app/components/textStyle";
import { UseFormReturn } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../../types/procurement";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";

const PROCEDURE_TYPE_FALLBACK = [
  { code: "AOI", label: "AOI" },
  { code: "AON", label: "AON" },
  { code: "DC", label: "DC" },
  { code: "GRE_A_GRE", label: "Gré à gré" },
];

const CATEGORY_TYPE_FALLBACK = [
  { code: "BIENS", label: "Biens" },
  { code: "SERVICES", label: "Services" },
  { code: "INFRA", label: "Infrastructures" },
];

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function BasicInfoSection({
  form,
}: Props) {
  const {
    register,
    formState: { errors },
  } = form;
  const procedureTypes = useReferenceChoices("PROCEDURE_TYPE", PROCEDURE_TYPE_FALLBACK);
  const categoryTypes = useReferenceChoices("CATEGORY_TYPE", CATEGORY_TYPE_FALLBACK);
  const inputClassName = "w-full px-3 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:bg-slate-50/50 focus:outline-none shadow-3xs transition-all duration-150 placeholder:text-slate-400";
  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
          Section A — Informations du marché
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 space-y-6">

        <div className="flex flex-col gap-2.5">
          <TextTitle text="Intitulé du marché"></TextTitle>
          <input
            {...form.register("title")}
            className={inputClassName}
            placeholder="Saisir l'intitulé du marché"
          />
          {errors.title && (
            <p className="text-red-600 font-medium text-xs">⚠️ {errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2.5">
            <TextTitle text="Type de procédure"></TextTitle>

            <select
              {...form.register("procedure_type")}
              className={inputClassName}
            >
              <option value="">Aucun</option>
              {procedureTypes.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.procedure_type && (
              <p className="text-red-600 font-medium text-xs">⚠️ {errors.procedure_type.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <TextTitle text="Catégorie"></TextTitle>

            <select
              {...form.register("category")}
              className={inputClassName}
            >
              <option value="">Aucun</option>
              {categoryTypes.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-600 font-medium text-xs">⚠️ {errors.category.message}</p>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
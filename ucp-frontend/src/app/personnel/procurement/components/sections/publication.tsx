"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { UseFormReturn } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../../types/procurement";
import { useReferenceChoices } from "@/hooks/useReferenceChoices";

const PUBLICATION_STATUS_FALLBACK = [
  { code: "PUBLISHED", label: "Publié" },
  { code: "CANCELLED", label: "Annulé" },
  { code: "CLOSED", label: "Clôturé" },
];

interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function PublicationSection({
  form,
}: Props) {
  const {
    register,
    formState: { errors },
  } = form;
  const statuses = useReferenceChoices("PUBLICATION_STATUS", PUBLICATION_STATUS_FALLBACK);
  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
          Visibilité & accès public
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2">
        <select
          {...form.register("status")}
          className="w-full md:w-1/3 px-3 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:bg-slate-50/50 focus:outline-none shadow-3xs transition-all duration-150"
        >
          {statuses.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && (
            <p className="text-red-600 font-medium text-xs mt-2">⚠️ {errors.status.message}</p>
        )}
      </CardContent>
    </Card>
  );

}
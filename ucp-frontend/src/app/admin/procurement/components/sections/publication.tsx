"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { UseFormReturn } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../../types/procurement";
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
          <option value="PUBLISHED">
            Publié
          </option>

          <option value="CANCELLED">
            Annulé
          </option>

          <option value="CLOSED">
            Clôturé
          </option>
        </select>
        {errors.status && (
            <p className="text-red-600 font-medium text-xs mt-2">⚠️ {errors.status.message}</p>
        )}
      </CardContent>
    </Card>
  );

}
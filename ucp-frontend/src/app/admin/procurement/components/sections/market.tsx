"use client";

import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";
import { TextTitle} from "@/app/components/textStyle";
import { UseFormReturn } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../../types/procurement";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Section A — Informations du marché
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex flex-col gap-3">
          <TextTitle text="Intitulé du marché"></TextTitle>
          <input
            {...form.register("title")}
            className="input focus:outline-none focus:ring-0 text-md"
            placeholder="Saisir l'intitulé du marché"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <TextTitle text="Type de procédure"></TextTitle>

          <select
            {...form.register("procedure_type")}
            className="input"
          >
            <option value="">Aucun</option>
            <option value="AOI">
              AOI
            </option>

            <option value="AON">
              AON
            </option>

            <option value="DC">
              DC
            </option>

            <option value="GRE_A_GRE">
              Gré à gré
            </option>
          </select>
          {errors.procedure_type && (
            <p className="text-red-500 text-xs mt-1">{errors.procedure_type.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <TextTitle text="Catégorie"></TextTitle>

          <select
            {...form.register("category")}
            className="input"
          >
            <option value="">Aucun</option>
            <option value="BIENS">
              Biens
            </option>

            <option value="SERVICES">
              Services
            </option>

            <option value="INFRA">
              Infrastructures
            </option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
"use client";

import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";

import { UseFormReturn } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../../types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function BasicInfoSection({
  form,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Section A — Informations du marché
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-6">

        <div>
          <label>
            Référence
          </label>

          <input
            disabled
            value="Auto-généré"
            className="input"
          />
        </div>

        <div>
          <label>
            Intitulé du marché
          </label>

          <input
            {...form.register("title")}
            className="input"
          />
        </div>

        <div>
          <label>
            Type de procédure
          </label>

          <select
            {...form.register("procedure_type")}
            className="input"
          >
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
        </div>

        <div>
          <label>
            Catégorie
          </label>

          <select
            {...form.register("category")}
            className="input"
          >
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
        </div>

      </CardContent>
    </Card>
  );
}
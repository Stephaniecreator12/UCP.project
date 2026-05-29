"use client";

import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";
import { UseFormReturn } from "react-hook-form";

import type { ProcurementFormValues } from "@/types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function PublicationSection({
  form,
}: Props) {
  const {
    formState: { errors },
  } = form;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Visibilité & accès public
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-sm text-slate-600">
          Le statut contrôle la visibilité du dossier sur le portail public après publication.
        </p>
        <select
          {...form.register("status")}
          className="input"
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
            <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

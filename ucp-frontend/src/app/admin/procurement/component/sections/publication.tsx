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

export function PublicationSection({
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
          Visibilité & accès public
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
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
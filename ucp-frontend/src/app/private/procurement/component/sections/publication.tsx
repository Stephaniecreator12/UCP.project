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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Visibilité & accès public
        </CardTitle>
      </CardHeader>

      <CardContent>
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
      </CardContent>
    </Card>
  );
}
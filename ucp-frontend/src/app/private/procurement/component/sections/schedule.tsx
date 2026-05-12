"use client";

import { format } from "date-fns";

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

export function ScheduleSection({
  form,
}: Props) {
  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Calendrier & publication
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-6">

        <div>

          <label>
            Date de publication
          </label>

          <input
            disabled
            value={format(
              new Date(),
              "dd/MM/yyyy"
            )}
            className="input"
          />

        </div>

        <div>

          <label>
            Date limite
          </label>

          <input
            type="datetime-local"
            {...form.register("deadline")}
            className="input"
          />

        </div>

      </CardContent>

    </Card>
  );
}
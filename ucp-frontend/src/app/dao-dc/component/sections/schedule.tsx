"use client";

import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";

import { UseFormReturn } from "react-hook-form";
import { TextTitle } from "@/app/components/textStyle";
import type { ProcurementFormValues } from "@/types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function ScheduleSection({
  form,
}: Props) {
  const {
    formState: { errors },
  } = form;
  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Calendrier & publication
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex flex-col gap-3">

          <TextTitle text="Date de publication"></TextTitle>

          <input
            type="datetime-local"
            {...form.register("publication_date")}
            className="input max-w-xs"
          />
          {errors.publication_date && (
            <p className="text-red-500 text-xs mt-1">{errors.publication_date.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">


          <TextTitle text="Date limite"></TextTitle>
          <input
            type="datetime-local"
            {...form.register("deadline")}
            className="input max-w-xs"
          />
          {errors.deadline && (
            <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>
          )}
        </div>

      </CardContent>

    </Card>
  );
}

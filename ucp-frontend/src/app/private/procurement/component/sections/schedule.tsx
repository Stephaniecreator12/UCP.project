"use client";

import { format } from "date-fns";
import { useFieldArray } from "react-hook-form";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card,
} from "@/app/TdrSt/dashboard/ui/card";

import { UseFormReturn } from "react-hook-form";
import { TextTitle } from "@/app/components/textStyle";
import { ProcurementFormValues }
from "../../../../../types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}

export function ScheduleSection({
  form,
}: Props) {
  const {
    control,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray<ProcurementFormValues, "dates_atelier">({
    control,
    name: "dates_atelier",
  });

  const watchCategory = watch("category");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      append({ date_atelier: selectedDate }); 
      e.target.value = ""; 
    }
  };
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
            className="input focus:outline-none focus:ring-0 text-md w-[15%]"
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
            className="input focus:outline-none focus:ring-0 text-md w-[15%]"
          />
          {errors.deadline && (
            <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>
          )}
        </div>
        {watchCategory === "SERVICES" && (
          <div className="flex flex-col gap-3">
            <TextTitle text="Dates prévisionnelles de l’atelier" />

            <input
              type="datetime-local"
              onChange={handleDateChange}
              className="input focus:outline-none focus:ring-0 text-md w-full max-w-xs border rounded p-2"
            />
            
            {errors.dates_atelier && (
              <p className="text-red-500 text-xs mt-1">{errors.dates_atelier.message}</p>
            )}

            {fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {fields.map((field, index) => {
                  const dateValue = field.date_atelier;
                  const dateObj = new Date(dateValue);
                  const formattedDate = isNaN(dateObj.getTime()) 
                    ? dateValue 
                    : dateObj.toLocaleString();

                  return (
                    <div 
                      key={field.id} 
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{formattedDate}</span>
                      
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 focus:outline-none"
                        title="Supprimer cette date"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
      </CardContent>

    </Card>
  );
}
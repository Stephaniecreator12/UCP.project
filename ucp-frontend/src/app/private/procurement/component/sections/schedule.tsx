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
    watch,
    setValue,
    formState: { errors },
  } = form;

  const datesAtelier = watch("dates_atelier");
  const watchCategory = watch("category");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setValue("dates_atelier", [...datesAtelier, selectedDate], {
        shouldValidate: true,
      });
      e.target.value = ""; 
    }
  };

  const handleRemoveDate = (indexToRemove: number) => {
    const updatedDates = datesAtelier.filter((_, index) => index !== indexToRemove);
    setValue("dates_atelier", updatedDates, { shouldValidate: true });
  };
  const triggerDatePicker = () => {
    const inputEl = document.getElementById("dates-atelier-upload") as HTMLInputElement;
    if (inputEl && typeof inputEl.showPicker === "function") {
      inputEl.showPicker();
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
            <label
              onClick={triggerDatePicker}
              htmlFor="dates-atelier-upload"
              className="cursor-pointer text-sm"
            >
              Ajouter des dates
            </label>
            <input
              id="dates-atelier-upload"
              type="datetime-local"
              onChange={handleDateChange}
              className="hidden"
            />

            {errors.dates_atelier && (
              <p className="text-red-500 text-xs mt-1">
                {errors.dates_atelier.message}
              </p>
            )}

            {datesAtelier.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {datesAtelier.map((dateValue, index) => {
                  const dateObj = new Date(dateValue);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? dateValue
                    : dateObj.toLocaleString();

                  return (
                    <div
                      key={`${dateValue}-${index}`}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{formattedDate}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveDate(index)}
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
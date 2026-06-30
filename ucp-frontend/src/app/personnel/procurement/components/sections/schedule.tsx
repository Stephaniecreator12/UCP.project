"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../card";

import { UseFormReturn } from "react-hook-form";
import { TextTitle } from "@/app/components/textStyle";
import { ProcurementFormValues }
from "../../../../../types/procurement";
import { Calendar, Plus } from "lucide-react";
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
  const inputDateStyle = "w-full sm:w-64 px-3 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:border-slate-300 focus:bg-slate-50/50 outline-none shadow-3xs transition-all duration-150";

  return (
    <Card className="shadow-xs border border-slate-200/80 rounded-xl overflow-hidden">

      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
          Calendrier & publication
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2.5">
            <TextTitle text="Date de publication"></TextTitle>
            <input
              type="datetime-local"
              {...form.register("publication_date")}
              className={inputDateStyle}
            />
            {errors.publication_date && (
              <p className="text-red-600 font-medium text-xs">⚠️ {errors.publication_date.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <TextTitle text="Date limite"></TextTitle>
            <input
              type="datetime-local"
              {...form.register("deadline")}
              className={inputDateStyle}
            />
            {errors.deadline && (
              <p className="text-red-600 font-medium text-xs">⚠️ {errors.deadline.message}</p>
            )}
          </div>
        </div>

        {watchCategory === "SERVICES" && (
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <TextTitle text="Dates prévisionnelles de l’atelier" />
            <label
              onClick={triggerDatePicker}
              htmlFor="dates-atelier-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-3xs transition-all duration-150 cursor-pointer w-fit"
            >
              <Plus size={14} /> Ajouter des dates
            </label>
            <input
              id="dates-atelier-upload"
              type="datetime-local"
              onChange={handleDateChange}
              className="hidden"
            />

            {errors.dates_atelier && (
              <p className="text-red-600 font-medium text-xs">
                ⚠️ {errors.dates_atelier.message}
              </p>
            )}

            {datesAtelier.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {datesAtelier.map((dateValue, index) => {
                  const dateObj = new Date(dateValue);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? dateValue
                    : dateObj.toLocaleString();

                  return (
                    <div
                      key={`${dateValue}-${index}`}
                      className="inline-flex items-center gap-2 bg-blue-50/60 text-blue-800 border border-blue-100/80 px-3 py-1 rounded-full text-xs font-medium shadow-3xs"
                    >
                      <Calendar size={12} className="text-blue-500" />
                      <span>{formattedDate}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveDate(index)}
                        className="text-slate-400 hover:text-red-600 font-bold ml-1 transition-colors outline-none text-sm"
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
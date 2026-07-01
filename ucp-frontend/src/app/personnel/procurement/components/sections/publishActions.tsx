"use client";
import { ApiResult } from "@/types/api";
import { uploadTechnicalDocument } from "../../../../../services/procurement";
import { uploadAnnexDocument } from "../../../../../services/procurement";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "@/types/procurement";
import { Path } from "react-hook-form";
import { ProcurementMarket } from "@/types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
  onPublish: (values: ProcurementFormValues) => Promise<ApiResult<ProcurementMarket>>;
}
export function PublishActions({ form, onPublish }: Props) {
  const [globalError, setGlobalError] = useState("");
  const handleSubmit = async (values: ProcurementFormValues) => {
    setGlobalError("");
    const res = await onPublish(values);

    if (res.error) {
      if (typeof res.message === "object" && res.message !== null) {
        Object.entries(res.message).forEach(([key, messages]) => {
          form.setError(key as Path<ProcurementFormValues>, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : (messages as string),
          }, 
          { shouldFocus: true });
        });
      } else {
        setGlobalError(res.message as string);
      }
      return;
    }

    if (values.technicalFiles?.length) {
      for (const file of values.technicalFiles) {
        const techRes = await uploadTechnicalDocument(res.data.id, file);
        if ("error" in techRes && techRes.error) {
          setGlobalError(`Erreur fichier technique : ${techRes.message}`);
          return;
        }
      }
    }

    if (values.annexFiles?.length) {
      for (const file of values.annexFiles) {
        const annexRes = await uploadAnnexDocument(res.data.id, file);
        if ("error" in annexRes && annexRes.error) {
          setGlobalError(`Erreur fichier annexe : ${annexRes.message}`);
          return;
        }
      }
    }

    form.reset();
    alert("Marché publié !");
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      {globalError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg shadow-3xs max-w-2xl">
          ⚠️ {globalError}
        </div>
      )}

      <button
      type="button"
        onClick={()=>{
          form.clearErrors();
          form.handleSubmit(handleSubmit)();
        }}
        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all duration-150 w-full md:w-fit"
      >
        Publier sur le portail
      </button>
    </div>
    
  );
}
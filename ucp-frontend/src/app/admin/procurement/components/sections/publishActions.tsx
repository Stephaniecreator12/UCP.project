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
    console.log("Données à envoyer :", values);
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
    <div>
      
      <button
      type="button"
        onClick={()=>{
          form.clearErrors();
          form.handleSubmit(handleSubmit)();
        }}
        className="btn-primary"
      >
        Publier sur le portail
      </button>
      {globalError && <p className="text-red-600 mb-4 font-bold">{globalError}</p>}
    </div>
    
  );
}
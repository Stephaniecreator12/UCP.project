"use client";

import {
  createMarket,
  uploadAnnexDocument,
  uploadTechnicalDocument,
} from "@/services/procurement";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "@/types/procurement";
import { Path } from "react-hook-form";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}
type FieldErrors = Record<string, string | string[]>;
export type ApiResult<T> =
  | { error: false; data: T }
  | { error: true; message: string | FieldErrors; status?: number };
export function PublishActions({ form }: Props) {
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const handleSubmit = async (values: ProcurementFormValues) => {
    setGlobalError("");
    setSuccessMessage("");
    const res = await createMarket(values);

    if (res.error) {
      if (typeof res.message === "object" && res.message !== null) {
        Object.entries(res.message).forEach(([key, messages]) => {
          form.setError(key as Path<ProcurementFormValues>, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : (messages as string),
          });
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
    setSuccessMessage("Dossier DAO / DC publié avec succès.");
  };

  return (
    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-5">
      <p className="mb-3 text-sm text-slate-600">
        Cette action crée le dossier DAO / DC, téléverse les pièces choisies puis le rend disponible selon le statut sélectionné.
      </p>
      <button
        type="button"
        onClick={form.handleSubmit(handleSubmit)}
        className="btn-primary"
      >
        Publier sur le portail
      </button>
      {globalError && <p className="mt-3 text-sm font-semibold text-red-600">{globalError}</p>}
      {successMessage && <p className="mt-3 text-sm font-semibold text-emerald-700">{successMessage}</p>}
    </div>
    
  );
}

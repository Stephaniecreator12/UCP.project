"use client";

import { createMarket } from "../../../../../services/procurement";
import { uploadTechnicalDocument } from "../../../../../services/procurement";
import { uploadAnnexDocument } from "../../../../../services/procurement";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProcurementFormValues } from "@/types/procurement";
interface Props {
  form: UseFormReturn<ProcurementFormValues>;
}
export function PublishActions({ form }: Props) {
  const [error,setError] = useState("");
  const handleSubmit = async () => {
    setError("");

    const values = form.getValues();
    console.log("Données à envoyer :", values);
    const market = await createMarket(values);

    if (market.error) {
      setError(market.message);
      return;
    }

    if (values.technicalFiles?.length) {
      for (const file of values.technicalFiles) {
        const techRes = await uploadTechnicalDocument(market.data.id, file);
        if ("error" in techRes && techRes.error) {
          setError(`Erreur fichier technique : ${techRes.message}`);
          return;
        }
      }
    }

    if (values.annexFiles?.length) {
      for (const file of values.annexFiles) {
        const annexRes = await uploadAnnexDocument(market.data.id, file);
        if ("error" in annexRes && annexRes.error) {
          setError(`Erreur fichier annexe : ${annexRes.message}`);
          return;
        }
      }
    }

    form.reset();
    alert("Marché publié !");
  };

  return (
    <div>
      {error && (
  <div style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>
    {error}
  </div>
)}
      <button
      onClick={handleSubmit}
      className="btn-primary"
    >
      Publier sur le portail
    </button>
    </div>
    
  );
}
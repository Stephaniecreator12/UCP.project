"use client";

import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { AnnexDocument, DateAtelierObj, ProcurementFormValues, ProcurementMarket, TechnicalDocument } from "@/types/procurement";
import { useParams } from "next/navigation";
import { BasicInfoSection } from "./sections/market";
import { FinancingSection } from "./sections/financement";
import { ScheduleSection } from "./sections/schedule";
import { TechnicalDocumentsSection } from "./sections/technicalDocuments";
import { AnnexSection } from "./sections/annexDocuments";
import { SubmissionModelSection } from "./sections/submissionModel";
import { PublicationSection } from "./sections/publication";
import { PublishActionsById } from "./sections/publishActionsById";
import { updateMarketById } from "@/services/procurement";
import { getMarketById } from "@/services/procurement";
import { useState,useEffect } from "react";
export function ProcurementUpdateForm() {
  const [data,setData] = useState<ProcurementMarket>()
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [initialFileUrl, setInitialFileUrl] = useState<string | undefined>(undefined);
  const [initialTechnicalDocs, setInitialTechnicalDocs] = useState<TechnicalDocument[]>([]);
  const [initialAnnexDocs, setInitialAnnexDocs] = useState<AnnexDocument[]>([]);
  const form =
    useForm<ProcurementFormValues>({
      defaultValues: {
        title: "",

        procedure_type: undefined,

        category: undefined,

        financing_sources: [],

        reference_bailleur: undefined,

        project_code: undefined,
        publication_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        dates_atelier: [],
        annexFiles: [],
        technicalFiles: [],

        status: "PUBLISHED",
      },
    });
    useEffect(() => {
    if (!id) return;
    const fetchMarketData = async () => {
      setIsLoading(true);
      const result = await getMarketById(id.toString());
      if (!result.error && result.data) {
      const market = result.data;
      setData(market)
      setInitialFileUrl(market.submission_model);
      setInitialTechnicalDocs(market.technical_documents || []);
      setInitialAnnexDocs(market.annexes || []);
      form.reset({
        title: market.title || "",
        procedure_type: market.procedure_type,
        category: market.category,
        financing_sources: market.financing_sources || [],
        reference_bailleur: market.reference_bailleur,
        project_code: market.project_code,
        publication_date: market.publication_date 
          ? format(new Date(market.publication_date), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        deadline: market.deadline 
          ? format(new Date(market.deadline), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        
        dates_atelier: market.dates_atelier_details
        ? market.dates_atelier_details.map((d) =>
            d.dates_atelier
          )
        : [],
        submission_model: undefined,      
        technicalFiles: [],
        annexFiles: [],  
        status: market.status || "PUBLISHED",
      });      
      } else {
        setApiError(typeof result.error === "string" ? result : "Erreur de chargement");
      }
      setIsLoading(false);
    };
    
    

    fetchMarketData();
  }, [id, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 gap-2 text-slate-500 text-sm">
        <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
        Chargement des données du marché...
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        ⚠️ Impossible de charger le formulaire : {apiError}
      </div>
    );
  }

  return (
    <form 
    onSubmit={(e) => {
    e.preventDefault();
  }}
    className="space-y-8">

      <BasicInfoSection form={form} />

      <FinancingSection form={form} />

      <ScheduleSection form={form}  key={`schedule-${data?.id}`}/>

      <TechnicalDocumentsSection form={form} initialDocuments={initialTechnicalDocs} key={`technical${data?.id}`}/>

      <AnnexSection form={form} initialDocuments={initialAnnexDocs} key={`annexe${data?.id}`}/>

      <SubmissionModelSection form={form} initialFileUrl={initialFileUrl}/>

      <PublicationSection form={form} />

      <PublishActionsById form={form} id={id?id.toString():"-1"} onPublish={updateMarketById}/>

    </form>
  );
}
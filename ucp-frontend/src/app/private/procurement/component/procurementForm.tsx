"use client";

import { useForm } from "react-hook-form";

import { ProcurementFormValues }
from "../../../../types/procurement";

import { BasicInfoSection } from "./sections/market";
import { FinancingSection } from "./sections/financement";
import { ScheduleSection } from "./sections/schedule";
import { TechnicalDocumentsSection } from "./sections/technicalDocuments";
import { AnnexSection } from "./sections/annexDocuments";
import { SubmissionModelSection } from "./sections/submissionModel";
import { PublicationSection } from "./sections/publication";
import { PublishActions } from "./sections/publishActions";

export function ProcurementForm() {

  const form =
    useForm<ProcurementFormValues>({
      defaultValues: {
        title: "",

        procedure_type: "AOI",

        category: "BIENS",

        financing_sources: [],

        reference_bailleur: undefined,

        project_code: "",

        deadline: "",

        status: "PUBLISHED",
      },
    });

  return (
    <form 
    onSubmit={(e) => {
    e.preventDefault();
  }}
    className="space-y-8">

      <BasicInfoSection form={form} />

      <FinancingSection form={form} />

      <ScheduleSection form={form} />

      <TechnicalDocumentsSection form={form}/>

      <AnnexSection form={form}/>

      <SubmissionModelSection form={form}/>

      <PublicationSection form={form} />

      <PublishActions form={form} />

    </form>
  );
}
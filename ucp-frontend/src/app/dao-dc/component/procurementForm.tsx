"use client";

import { useForm } from "react-hook-form";
import type { ProcurementFormValues } from "@/types/procurement";

import { BasicInfoSection } from "./sections/market";
import { FinancingSection } from "./sections/financement";
import { ScheduleSection } from "./sections/schedule";
import { TechnicalDocumentsSection } from "./sections/technicalDocuments";
import { AnnexSection } from "./sections/annexDocuments";
import { SubmissionModelSection } from "./sections/submissionModel";
import { PublicationSection } from "./sections/publication";
import { PublishActions } from "./sections/publishActions";

const toDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function ProcurementForm() {
  const now = toDateTimeLocal(new Date());

  const form = useForm<ProcurementFormValues>({
    defaultValues: {
      title: "",
      procedure_type: "",
      category: "",
      financing_sources: [],
      reference_bailleur: undefined,
      project_code: undefined,
      publication_date: now,
      deadline: now,
      status: "PUBLISHED",
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="space-y-8"
    >
      <BasicInfoSection form={form} />

      <FinancingSection form={form} />

      <ScheduleSection form={form} />

      <TechnicalDocumentsSection form={form} />

      <AnnexSection form={form} />

      <SubmissionModelSection form={form} />

      <PublicationSection form={form} />

      <PublishActions form={form} />
    </form>
  );
}

export type ProcedureType =
  | "AOI"
  | "AON"
  | "DC"
  | "GRE_A_GRE";

export type CategoryType =
  | "BIENS"
  | "SERVICES"
  | "INFRA";

export type FinancingSource =
  | "GLOBAL_FUND"
  | "GAVI"
  | "WORLD_BANK";

export type PublicationStatus =
  | "PUBLISHED"
  | "CANCELLED"
  | "CLOSED";

export interface TechnicalDocument {
  id: number;
  file: string;
  version: number;
  uploaded_at: string;
}

export interface AnnexDocument {
  id: number;
  file: string;
  uploaded_at: string;
}

export interface ProcurementMarket {
  id: number;
  reference_number: string;
  title: string;
  procedure_type: ProcedureType | "";
  category: CategoryType | "";

  financing_source: FinancingSource[];

  reference_bailleur?: FinancingSource[];

  project_code?: string;

  publication_date?: string;

  deadline: string;

  submission_model?: string;

  status: PublicationStatus;

  technical_documents: TechnicalDocument[];

  annexes: AnnexDocument[];
}
export interface ProcurementFormValues {
  title: string;

  procedure_type: ProcedureType | "";

  category: CategoryType | "";

  financing_sources: FinancingSource[];

  reference_bailleur?: FinancingSource;

  project_code?: string;

  deadline: string;

  status: PublicationStatus;
  submission_model:File;
  technicalFiles?: File[];
  annexFiles?: File[];

  optionKey?:string;
}
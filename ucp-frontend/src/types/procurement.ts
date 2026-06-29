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
<<<<<<< HEAD
export interface DateAtelierObj {
  id: number;
  dates_atelier: string;
}
=======

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
export interface ProcurementMarket {
  id: number;
  reference_number: string;
  title: string;
  procedure_type: ProcedureType | "";
  category: CategoryType | "";

  financing_sources: FinancingSource[];

  reference_bailleur?: FinancingSource;

  project_code?: string;

  publication_date: string;

  deadline: string;
<<<<<<< HEAD
  dates_atelier: string[];
  dates_atelier_details: DateAtelierObj[];
=======
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

  submission_model?: string;

  status: PublicationStatus;

<<<<<<< HEAD
=======
  created_at?: string;

>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
  publication_date: string;
  deadline: string;
<<<<<<< HEAD
  dates_atelier: string[];

  status: PublicationStatus;
  submission_model?:File;
  technicalFiles?: File[];
  annexFiles?: File[];

  optionKey?:string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
=======

  status: PublicationStatus;
  submission_model?: File;
  technicalFiles?: File[];
  annexFiles?: File[];

  optionKey?: string;
}
type ValidationError = Record<string, unknown>;

export type ApiResult<T> =
  | {
      error: false;
      data: T;
    }
  | {
      error: true;
      message: string | ValidationError;
      status?: number;
    };
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

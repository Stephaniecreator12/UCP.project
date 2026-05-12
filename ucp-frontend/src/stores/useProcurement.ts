import { create } from "zustand";
import {
  FinancingSource,
  ProcedureType,
  CategoryType,
  PublicationStatus,
} from "@/types/procurement";

interface ProcurementState {
  title: string;
  procedure_type: ProcedureType | "";
  category: CategoryType | "";
  financing_sources: FinancingSource[];
  reference_bailleur?: FinancingSource;
  project_code: string;
  deadline: string;
  status: PublicationStatus;
  technicalFiles: File[];
  annexFiles: File[];
  submissionFile?: File;
  setField: <K extends keyof ProcurementState>(
    key: K,
    value: ProcurementState[K]
  ) => void;

  reset: () => void;
}
export const useProcurementStore =
  create<ProcurementState>((set) => ({
    title: "",
    procedure_type: "",
    category: "",
    financing_sources: [],
    reference_bailleur: undefined,
    project_code: "",
    deadline: "",
    status: "PUBLISHED",

    technicalFiles: [],
    annexFiles: [],
    submissionFile: undefined,
    setField: (key, value) =>
      set((state) => ({
        ...state,
        [key]: value,
      })),
    reset: () =>
      set({
        title: "",
        procedure_type: "",
        category: "",
        financing_sources: [],
        reference_bailleur: undefined,
        project_code: "",
        deadline: "",
        status: "PUBLISHED",
        technicalFiles: [],
        annexFiles: [],
        submissionFile: undefined,
      }),
  }));
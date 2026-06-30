"use client";

import { ProcurementUpdateForm } from "../../components/procurementUpdateForm";
import TopHeader from "@/app/components/TopHeader";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react"
export default function CreateProcurementPage() {
  const router = useRouter()
    const handleListRedirection=()=>{
      router.replace("/procurement")
    }
  return (
    <div className="w-full min-h-screen bg-slate-50/50 flex flex-col">
      <div className="w-full bg-white border-b border-slate-200/80">
        <TopHeader />
      </div>

      <div className="w-full flex-1 py-10 px-6 md:px-12 lg:px-16 flex flex-col gap-8">
        
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleListRedirection()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft size={16} className="text-slate-400 group-hover:text-slate-600" />
            Retour au tableau de bord
          </button>
        </div>

        <div className="w-full">
          <ProcurementUpdateForm />
        </div>
        
      </div>
    </div>
  );
}
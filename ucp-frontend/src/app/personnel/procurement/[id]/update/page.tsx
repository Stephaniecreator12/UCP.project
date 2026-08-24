"use client";

import { ProcurementUpdateForm } from "../../components/procurementUpdateForm";
import TopHeader from "@/app/components/TopHeader";
export default function UpdateProcurementPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased selection:bg-emerald-200">
        <TopHeader />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-4 pb-12 pt-6 md:px-6 lg:pt-8">

        <div className="w-full">
          <ProcurementUpdateForm />
        </div>
        
      </div>
    </div>
  );
}
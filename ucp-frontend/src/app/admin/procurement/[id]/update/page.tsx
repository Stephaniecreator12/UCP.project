"use client";

import { ProcurementUpdateForm } from "../../components/procurementUpdateForm";
import TopHeader from "@/app/components/TopHeader";
export default function CreateProcurementPage() {
  return (
    <div className="container mx-auto py-10">
        <div>
            <TopHeader></TopHeader>
        </div>
        <div>
            <ProcurementUpdateForm />
        </div>
      
    </div>
  );
}
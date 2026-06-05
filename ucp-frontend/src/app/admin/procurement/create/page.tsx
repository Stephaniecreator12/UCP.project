"use client";

import { ProcurementForm } from "../component/procurementForm";
import TopHeader from "@/app/components/TopHeader";
export default function CreateProcurementPage() {
  return (
    <div className="container mx-auto py-10">
        <div>
            <TopHeader></TopHeader>
        </div>
        <div>
            <ProcurementForm />
        </div>
      
    </div>
  );
}
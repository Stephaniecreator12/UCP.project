"use client";

import TopHeader from "@/app/components/TopHeader";
import { ProcurementForm } from "@/app/dao-dc/component/procurementForm";

export default function CreateProcurementPage() {
  return (
    <div className="container mx-auto py-10">
      <div>
        <TopHeader />
      </div>
      <div>
        <ProcurementForm />
      </div>
    </div>
  );
}

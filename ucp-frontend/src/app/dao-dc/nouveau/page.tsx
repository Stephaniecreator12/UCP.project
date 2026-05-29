"use client";

import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";
import { ProcurementForm } from "../component/procurementForm";

export default function DaoDcCreatePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#eceeef_0%,#e8eaed_100%)] text-[#17212e]">
      <TopHeader />

      <div className="page-enter mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pb-10 pt-4 md:px-8">
        <section className="page-enter-up relative grid gap-4 rounded-[14px] border border-[#d9dee3] bg-white px-4 py-4 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-[14px] bg-gradient-to-r from-[#0ea85b] to-[#57d18d]"
            aria-hidden="true"
          />

          <div className="min-w-0 pt-1">
            <p className="m-0 text-[0.7rem] uppercase tracking-[0.05em] text-[#627080]">
              UCP · Passation de marchés
            </p>
            <h1 className="my-[0.32rem] flex items-center gap-2 text-[1.35rem] font-bold tracking-[0.04em] text-[#0c7340]">
              <FilePlus2 className="h-5 w-5" />
              Créer DAO
            </h1>
            <p className="max-w-3xl text-[0.85rem] font-medium leading-6 text-[#627080]">
              Renseigne les informations du dossier DAO/DC, ajoute les pièces et publie
              le dossier pour qu’il soit disponible dans le module d’ouverture des offres.
            </p>
          </div>

          <Link
            href="/dao-dc"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-[#d9dee3] bg-white px-5 py-2.5 text-sm font-bold text-[#435161] shadow-sm transition hover:bg-[#f6f7f8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour dashboard
          </Link>
        </section>

        <section
          className="page-enter-up rounded-[14px] border border-[#d9dee3] bg-white p-4 shadow-[0_18px_36px_-30px_rgba(34,44,52,0.5)] md:p-5"
          style={{ animationDelay: "0.1s" }}
        >
          <ProcurementForm />
        </section>
      </div>
    </main>
  );
}

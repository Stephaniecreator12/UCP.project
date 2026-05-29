"use client";

import Link from "next/link";

import TopHeader from "@/app/components/TopHeader";
import { ProcurementForm } from "../component/procurementForm";

export default function DaoDcCreatePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <TopHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <section className="mb-8 rounded-[30px] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
                Nouveau dossier
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Créer un DAO / une Demande de Cotation
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Renseigne les informations essentielles du marché, ajoute les pièces du dossier,
                puis publie le tout sur le portail selon le statut choisi.
              </p>
            </div>

            <Link
              href="/dao-dc"
              className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Retour au tableau DAO / DC
            </Link>
          </div>
        </section>

        <ProcurementForm />
      </div>
    </main>
  );
}

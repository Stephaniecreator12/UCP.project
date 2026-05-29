"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Sparkles } from "lucide-react";

import TopHeader from "@/app/components/TopHeader";

export default function NouvelleSeancePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f6faf8_0%,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] pb-24 text-slate-800 antialiased">
      <TopHeader />

      <div className="zoom-content mx-auto mt-8 max-w-[900px] px-4 md:px-6">
        <section className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 opacity-50 blur-3xl" />

          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-amber-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                Ouverture des offres
              </p>
              <h1 className="mt-1 text-xl font-black tracking-tight text-slate-800">
                La séance se crée depuis un DAO existant
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Ce formulaire séparé servait seulement aux premiers tests. Dans le vrai
                workflow, le demandeur crée le DAO/DC, puis le secrétaire clique sur
                <span className="font-black text-slate-900"> Ouvrir séance </span>
                depuis le dashboard d&apos;ouverture lorsque la date limite est passée.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/ouverture_offre"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <FileText className="h-4 w-4" />
                  Voir les DAO à ouvrir
                </Link>
                <Link
                  href="/ouverture_offre"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

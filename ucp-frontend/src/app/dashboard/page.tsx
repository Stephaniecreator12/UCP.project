"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopHeader from "@/app/components/TopHeader";
import { getAllProcurements, Procurement } from "@/services/api";
import { getToken } from "@/services/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Procurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;

    const load = async () => {
      try {
        const data = await getAllProcurements();
        setRows(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const works = rows.filter((r) => r.type === "Travaux").length;
  const goods = rows.filter((r) => r.type === "Biens").length;
  const consultants = rows.filter((r) => r.type === "Consultance").length;

  return (
    <div className="app-shell">
      <TopHeader />

      <main className="min-h-[calc(100vh-77px)] px-4 py-6 md:px-8">
        <section className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-600/60 bg-[linear-gradient(160deg,rgba(10,16,22,0.96)_0%,rgba(15,23,31,0.95)_100%)] p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Dashboard final
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[0.03em] text-slate-100 md:text-4xl">
            Vue d&apos;ensemble de la passation
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Cette page est le bilan final. La saisie et la modification des lignes se font d&apos;abord
            dans la page Formulaire.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-300">Travaux</p>
              <p className="mt-2 text-3xl font-bold text-emerald-200">{loading ? "..." : works}</p>
            </div>
            <div className="rounded-2xl border border-slate-500/45 bg-slate-700/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Biens</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{loading ? "..." : goods}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">Consultance</p>
              <p className="mt-2 text-3xl font-bold text-emerald-100">{loading ? "..." : consultants}</p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/formulaire"
              className="rounded-full bg-[linear-gradient(90deg,#39db81_0%,#22995c_100%)] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_14px_24px_-14px_rgba(46,218,102,0.88)]"
            >
              Aller au formulaire
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-500/65 bg-slate-800/70 px-5 py-2.5 text-sm font-semibold text-slate-200"
            >
              Changer d&apos;utilisateur
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut } from "lucide-react";
import { logoutEvaluator } from "@/services/evaluationService";

function extractSeanceId(pathname: string): number | null {
  const match = pathname.match(
    /\/personnel\/evaluation\/(?:dao|classement)\/(\d+)/,
  );
  return match ? Number(match[1]) : null;
}

export default function EvaluatorHeader({ seanceId }: { seanceId?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedSeanceId = seanceId ?? extractSeanceId(pathname);
  const homeHref = resolvedSeanceId
    ? `/personnel/evaluation/dao/${resolvedSeanceId}/offres`
    : "/personnel/evaluation/login";

  const handleLogout = () => {
    logoutEvaluator();
    const loginHref = resolvedSeanceId
      ? `/personnel/evaluation/login?seance=${resolvedSeanceId}`
      : "/personnel/evaluation/login";
    router.replace(loginHref);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md">
      <div
        className="h-[3px] w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"
        aria-hidden="true"
      />
      <div className="flex h-14 w-full items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link
          href={homeHref}
          className="group inline-flex min-w-0 items-center gap-3 no-underline text-inherit transition-transform duration-200 hover:scale-[1.02]"
        >
          <Image
            src="/ucp-sante-logo-color.png"
            alt="Logo UCP"
            width={40}
            height={40}
            className="shrink-0 rounded-xl border border-slate-200 bg-white object-contain shadow-sm transition-shadow duration-200 group-hover:shadow-md"
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <strong className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-800">
                Évaluation des offres
              </strong>
            </div>
            <span className="block truncate text-[11px] text-slate-500">
              Accès évaluateur — mot de passe DAO
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 hover:shadow-md active:translate-y-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Quitter</span>
        </button>
      </div>
    </header>
  );
}

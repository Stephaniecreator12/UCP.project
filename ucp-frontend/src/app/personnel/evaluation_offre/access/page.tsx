"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";

/**
 * /evaluation_offre/access — legacy route.
 *
 * External evaluators now authenticate through the unified login page
 * at /login?validation=evaluation&offre={id}&email={email}.
 * This page redirects them seamlessly, preserving any query params.
 */
function AccessRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const offre = searchParams.get("offre") ?? searchParams.get("offreId") ?? "";
    const email = searchParams.get("email") ?? "";

    const params = new URLSearchParams();
    params.set("validation", "evaluation");
    if (offre) params.set("offre", offre);
    if (email) params.set("email", email);

    router.replace(`/auth/login?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Redirection en cours…</p>
    </div>
  );
}

export default function AccessEvaluationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      }
    >
      <AccessRedirectContent />
    </Suspense>
  );
}

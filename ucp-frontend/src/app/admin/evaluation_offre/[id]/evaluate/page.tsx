"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";

function RedirectFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader className="h-8 w-8 animate-spin text-emerald-700" />
    </div>
  );
}

export default function LegacyEvaluateRedirectPage() {
  return (
    <Suspense fallback={<RedirectFallback />}>
      <LegacyEvaluateRedirect />
    </Suspense>
  );
}

function LegacyEvaluateRedirect() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const offreId = params.id as string;

  useEffect(() => {
    const qs = new URLSearchParams();
    const seance = searchParams.get("seance");
    const email = searchParams.get("email");
    const code = searchParams.get("code");
    if (seance) qs.set("seance", seance);
    if (email) qs.set("email", email);
    if (code) qs.set("code", code);
    const query = qs.toString();
    router.replace(`/evaluation/offres/${offreId}${query ? `?${query}` : ""}`);
  }, [offreId, router, searchParams]);

  return <RedirectFallback />;
}

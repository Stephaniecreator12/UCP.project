"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ResendEmailButton from "@/app/components/ResendEmailButton";
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(searchParams);
  const token = resolvedParams.token;
  const decodedToken = token ? decodeURIComponent(token) : "";
  const userEmail = decodedToken ? decodedToken.split(":")[0] : "";
  const [status, setStatus] = useState(() => token ? "verifying" : "error");
  const [message, setMessage] = useState(() =>
    token ? "Vérification de votre lien en cours..." : "Token d'activation manquant."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Votre compte a été activé avec succès ! Vous pouvez vous connecter.");
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Le lien a expiré ou est invalide.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Une erreur serveur est survenue.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Activation du compte</h1>

        {status === "verifying" && <p className="text-gray-600 animate-pulse">⏳ {message}</p>}
        {status === "success" && <p className="text-green-600 font-medium">✅ {message}</p>}
        {status === "error" && (
          <div className="space-y-4">
            <p className="text-red-600 font-medium">❌ {message}</p>

            {/* Optionnel : Si l'utilisateur saisit son email ou si tu l'as dans l'URL */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Votre lien a expiré ? Demandez-en un nouveau :</p>
              {/* Remplacer par un input ou une variable email si disponible */}
              <ResendEmailButton email={userEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
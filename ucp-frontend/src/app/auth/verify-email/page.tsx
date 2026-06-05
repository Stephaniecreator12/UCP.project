"use client";

import { useEffect, useState, use } from "react";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = use(searchParams);
  const token = resolvedParams.token;
  
  const [status, setStatus] = useState(() => token ? "verifying" : "error"); 
  const [message, setMessage] = useState(() => 
    token ? "Vérification de votre lien en cours..." : "Token d'activation manquant."
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Votre compte a été activé avec succès ! Vous pouvez vous connecter.");
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
        {status === "error" && <p className="text-red-600 font-medium">❌ {message}</p>}
      </div>
    </div>
  );
}
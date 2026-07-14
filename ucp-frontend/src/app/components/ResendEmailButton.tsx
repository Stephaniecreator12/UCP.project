import { useState, useEffect } from "react";

interface ResendProps {
  email: string;
}

export default function ResendEmailButton({ email }: ResendProps) {
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || loading || !email) return;

    setLoading(true);
    setStatusMessage("");
    setIsError(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/resend-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setStatusMessage("✅ Un nouvel email a été envoyé !");
        setCooldown(60); 
        setIsError(true);
        setStatusMessage(data.message || "Impossible de renvoyer l'email.");
      }
    } catch {
      setIsError(true);
      setStatusMessage("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full text-center">
      <button
        type="button"
        disabled={loading || cooldown > 0}
        onClick={handleResend}
        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:no-underline transition underline cursor-pointer"
      >
        {loading ? "Envoi en cours..." : cooldown > 0 ? `Renvoyer le mail (${cooldown}s)` : "Vous n'avez rien reçu ? Renvoyer le mail"}
      </button>
      
      {statusMessage && (
        <p className={`mt-2 text-xs font-semibold ${isError ? "text-rose-600" : "text-emerald-600"}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}
/**
 * Page d'accueil - Redirection vers le Dashboard
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers le dashboard
    router.push("/dashboard");
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f7fa",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>Chargement...</h1>
        <p>Redirection vers le tableau de PPM</p>
      </div>
    </div>
  );
}

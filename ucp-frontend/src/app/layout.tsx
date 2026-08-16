import type { Metadata } from "next";
import "./globals.css";
import { AccessProvider } from "@/context/accessContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  }>) {
  return (
    <html lang="fr" data-theme="light">
      <body className="antialiased">
        <AccessProvider>
          {children}
        </AccessProvider>
      </body>
    </html>
  );
}

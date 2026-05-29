import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCP - Passation de marchés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className="antialiased">{children}</body>
    </html>
  );
}

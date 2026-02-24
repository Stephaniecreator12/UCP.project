import type { Metadata } from "next";
import { Albert_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TopRightSidebar from "@/app/components/TopRightSidebar";

const albertSans = Albert_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UCP - Gestion des Marchés",
  description: "Système de saisie et suivi des marchés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${albertSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <TopRightSidebar />
      </body>
    </html>
  );
}

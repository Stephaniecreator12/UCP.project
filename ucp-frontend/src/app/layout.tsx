<<<<<<< HEAD
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
=======
import type { Metadata } from "next";
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
import "./globals.css";
import { AccessProvider } from "@/context/accessContext";

<<<<<<< HEAD
const manrope = Manrope({
  variable: "--font-ui",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

import type { Metadata } from "next";

=======
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
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
<<<<<<< HEAD
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AccessProvider>
          {children}
        </AccessProvider>
      </body>
=======
      <body className="antialiased">{children}</body>
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
    </html>
  );
}


import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-ui",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./styles/base/globals.css";

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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var savedTheme = localStorage.getItem("theme");
                  var theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
                  document.documentElement.setAttribute("data-theme", theme);
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "light");
                }
              })();
            `,
          }}
        />
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

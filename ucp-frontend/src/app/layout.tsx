import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      style={
        {
          "--font-ui": "Segoe UI, Arial, sans-serif",
          "--font-display": "Segoe UI, Arial, sans-serif",
          "--font-code": "Consolas, Monaco, monospace",
        } as React.CSSProperties
      }
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

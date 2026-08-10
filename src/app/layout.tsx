import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academia Mágica",
  description: "Plataforma educativa gamificada para aprender jugando",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}

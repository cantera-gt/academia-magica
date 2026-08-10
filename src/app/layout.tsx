import type { Metadata } from "next";
import "./globals.css";
import MotionProvider from "@/components/motion-provider";

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
      <body className="antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

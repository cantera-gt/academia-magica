import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/motion-provider";
import AmbientMusicToggle from "@/components/ambient-music-toggle";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
});

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
    <html lang="es" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <MotionProvider>
          {children}
          {/* Instancia unica y persistente: no se desmonta al navegar entre
              paginas, asi que el boton para apagar la musica esta siempre
              disponible sin importar en que pantalla este el alumno. */}
          <AmbientMusicToggle />
        </MotionProvider>
      </body>
    </html>
  );
}

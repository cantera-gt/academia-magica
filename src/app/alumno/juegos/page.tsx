"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, SPRING_PLAYFUL } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";

const GAMES = [
  {
    slug: "memoria",
    name: "Memoria Mágica",
    icon: "🧠",
    description: "Encontrá las parejas de cartas. ¡Cuantos menos intentos, más diamantes!",
    color: "from-teal-400 to-cyan-500",
    teacher: {
      name: "Lucía",
      flag: "🇪🇸",
      img: "/profesores/lucia.webp",
      voice: "es-ES-ElviraNeural",
      howTo:
        "Tocá dos cartas para darlas vuelta. Si son iguales, se quedan boca arriba.",
      goal: "Encontrá las 6 parejas usando la menor cantidad de intentos posible.",
    },
  },
  {
    slug: "suma-veloz",
    name: "Suma Veloz",
    icon: "⚡",
    description: "Resolvé cuentas contrarreloj. ¡Cuantas más aciertes, más diamantes!",
    color: "from-sky-400 to-indigo-500",
    teacher: {
      name: "Diego",
      flag: "🇲🇽",
      img: "/profesores/diego.webp",
      voice: "es-MX-JorgeNeural",
      howTo: "Tocá la respuesta correcta de la cuenta lo más rápido que puedas.",
      goal: "Resolvé todas las que puedas en 30 segundos. ¡Cuantas más aciertes, más diamantes!",
    },
  },
  {
    slug: "reflejos",
    name: "Ojo de Halcón",
    icon: "🦅",
    description: "Esperá la señal verde y tocá lo más rápido posible.",
    color: "from-amber-400 to-rose-500",
    teacher: {
      name: "Susan",
      flag: "🇺🇸",
      img: "/profesores/susan.webp",
      voice: "es-US-PalomaNeural",
      howTo:
        "Esperá a que el círculo se ponga verde y tocálo apenas cambie. Si tocás antes, perdés esa ronda.",
      goal: "Completá las 5 rondas con el mejor tiempo de reacción promedio.",
    },
  },
  {
    slug: "puzzle",
    name: "Rompecabezas Mágico",
    icon: "🧩",
    description: "Ordená las piezas deslizándolas. ¡Cuantos menos movimientos, mejor!",
    color: "from-violet-500 to-fuchsia-600",
    teacher: {
      name: "María José",
      flag: "🇬🇹",
      img: "/profesores/maria-jose.webp",
      voice: "es-GT-MartaNeural",
      howTo: "Tocá una pieza que esté al lado del espacio vacío para moverla ahí.",
      goal: "Ordená los números del 1 al 8 usando la menor cantidad de movimientos.",
    },
  },
  {
    slug: "dibujos-color",
    name: "Pizarra para Pintar",
    icon: "🎨",
    description: "Elegí un color y pintá dibujos tocándolos.",
    color: "from-rose-400 to-fuchsia-600",
    teacher: {
      name: "Amara",
      flag: "🇦🇷",
      img: "/profesores/amara.webp",
      voice: "es-AR-ElenaNeural",
      howTo: "Elegí un color de la paleta y tocá una parte del dibujo para pintarla.",
      goal: "Pintá al menos 3 partes del dibujo para ganar diamantes.",
    },
  },
  {
    slug: "diseno-libre",
    name: "Pizarra Libre",
    icon: "✏️",
    description: "Dibujá lo que quieras desde una hoja en blanco.",
    color: "from-cyan-400 to-blue-600",
    teacher: {
      name: "Kenji",
      flag: "🇪🇸",
      img: "/profesores/kenji.webp",
      voice: "es-ES-AlvaroNeural",
      howTo: "Elegí un color y un grosor de pincel, y dibujá con el dedo sobre la hoja.",
      goal: "Terminá tu propio dibujo y mostráselo a la profe.",
    },
  },
  {
    slug: "memoria-colores",
    name: "Simón Dice",
    icon: "🔴",
    description: "Mirá la secuencia de colores y repetila en el mismo orden.",
    color: "from-indigo-500 to-fuchsia-700",
    teacher: {
      name: "Lukas",
      flag: "🇨🇱",
      img: "/profesores/lukas.webp",
      voice: "es-CL-LorenzoNeural",
      howTo: "Mirá qué botones se iluminan y después tocálos vos en el mismo orden.",
      goal: "Llegá lo más lejos posible: la secuencia se hace más larga en cada ronda.",
    },
  },
  {
    slug: "atrapa-fruta",
    name: "Atrapa la Fruta",
    icon: "🍓",
    description: "Tocá las frutas que caen antes de que lleguen abajo.",
    color: "from-lime-400 to-teal-600",
    teacher: {
      name: "Diego",
      flag: "🇲🇽",
      img: "/profesores/diego.webp",
      voice: "es-MX-JorgeNeural",
      howTo: "Tocá las frutas apenas caen. Si tocás una bomba 💣, resta.",
      goal: "Atrapá la mayor cantidad de frutas en 30 segundos.",
    },
  },
  {
    slug: "tres-en-raya",
    name: "Tres en Raya",
    icon: "❌",
    description: "Jugá una partida de tres en raya contra la profe Susan.",
    color: "from-orange-400 to-red-600",
    teacher: {
      name: "Susan",
      flag: "🇺🇸",
      img: "/profesores/susan.webp",
      voice: "es-US-PalomaNeural",
      howTo: "Tocá un casillero vacío para poner tu ❌. Vos siempre empezás.",
      goal: "Ganale a la profe (¡o al menos empatá!).",
    },
  },
  {
    slug: "laberinto",
    name: "Laberinto Mágico",
    icon: "🧭",
    description: "Guiá a la exploradora hasta el tesoro usando las flechas.",
    color: "from-emerald-500 to-cyan-700",
    teacher: {
      name: "María José",
      flag: "🇬🇹",
      img: "/profesores/maria-jose.webp",
      voice: "es-GT-MartaNeural",
      howTo: "Usá las flechas para moverte por el laberinto, esquivando las paredes.",
      goal: "Llegá hasta el tesoro 💎 en la menor cantidad de movimientos posible.",
    },
  },
];

export default function JuegosPage() {
  const [speakingSlug, setSpeakingSlug] = useState<string | null>(null);

  function handleSpeak(slug: string, text: string, voice: string) {
    if (speakingSlug === slug) {
      stopSpeaking();
      setSpeakingSlug(null);
      return;
    }
    speakText(
      text,
      voice,
      () => setSpeakingSlug(slug),
      () => setSpeakingSlug((s) => (s === slug ? null : s))
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-6 text-white">
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            {"← Mi inicio"}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{"Juegos de recreo 🎮"}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <p className="mb-5 text-sm text-slate-500">
          {"Un ratito de recreo entre materia y materia. Ganá diamantes extra por jugar bien (hasta 5 veces por día por juego)."}
        </p>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.06)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {GAMES.map((g) => (
            <motion.div key={g.slug} variants={staggerItem} className="flex flex-col gap-2">
              <Link href={`/alumno/juegos/${g.slug}`}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_PLAYFUL}
                  className={`flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br ${g.color} p-6 text-center text-white shadow-lg`}
                >
                  <span className="text-5xl">{g.icon}</span>
                  <span className="text-lg font-bold">{g.name}</span>
                  <span className="text-sm text-white/90">{g.description}</span>
                </motion.div>
              </Link>

              <div className="flex items-start gap-2 rounded-2xl bg-white p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.teacher.img}
                  alt={g.teacher.name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500">
                    {g.teacher.name} {g.teacher.flag}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">{g.teacher.howTo}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {"🎯 "}{g.teacher.goal}
                  </p>
                  <button
                    onClick={() =>
                      handleSpeak(g.slug, `${g.teacher.howTo} ${g.teacher.goal}`, g.teacher.voice)
                    }
                    className="mt-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {speakingSlug === g.slug ? "🔊 Hablando..." : "🔊 Escuchar"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

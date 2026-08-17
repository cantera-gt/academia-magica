"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, SPRING_PLAYFUL } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";

const GAMES = [
  {
    slug: "memoria",
    name: "Memoria M\u00e1gica",
    icon: "\ud83e\udde0",
    description: "Encontr\u00e1 las parejas de cartas. \u00a1Cuantos menos intentos, m\u00e1s diamantes!",
    color: "from-teal-400 to-cyan-500",
    teacher: {
      name: "Luc\u00eda",
      flag: "\ud83c\uddea\ud83c\uddf8",
      img: "/profesores/lucia.webp",
      voice: "es-ES-ElviraNeural",
      howTo:
        "Toc\u00e1 dos cartas para darlas vuelta. Si son iguales, se quedan boca arriba.",
      goal: "Encontr\u00e1 las 6 parejas usando la menor cantidad de intentos posible.",
    },
  },
  {
    slug: "suma-veloz",
    name: "Suma Veloz",
    icon: "\u26a1",
    description: "Resolv\u00e9 cuentas contrarreloj. \u00a1Cuantas m\u00e1s aciertes, m\u00e1s diamantes!",
    color: "from-sky-400 to-indigo-500",
    teacher: {
      name: "Diego",
      flag: "\ud83c\uddf2\ud83c\uddfd",
      img: "/profesores/diego.webp",
      voice: "es-MX-JorgeNeural",
      howTo: "Toc\u00e1 la respuesta correcta de la cuenta lo m\u00e1s r\u00e1pido que puedas.",
      goal: "Resolv\u00e9 todas las que puedas en 30 segundos. \u00a1Cuantas m\u00e1s aciertes, m\u00e1s diamantes!",
    },
  },
  {
    slug: "reflejos",
    name: "Ojo de Halc\u00f3n",
    icon: "\ud83e\udd85",
    description: "Esper\u00e1 la se\u00f1al verde y toc\u00e1 lo m\u00e1s r\u00e1pido posible.",
    color: "from-amber-400 to-rose-500",
    teacher: {
      name: "Susan",
      flag: "\ud83c\uddfa\ud83c\uddf8",
      img: "/profesores/susan.webp",
      voice: "es-US-PalomaNeural",
      howTo:
        "Esper\u00e1 a que el c\u00edrculo se ponga verde y toc\u00e1lo apenas cambie. Si toc\u00e1s antes, perd\u00e9s esa ronda.",
      goal: "Complet\u00e1 las 5 rondas con el mejor tiempo de reacci\u00f3n promedio.",
    },
  },
  {
    slug: "puzzle",
    name: "Rompecabezas M\u00e1gico",
    icon: "\ud83e\udde9",
    description: "Orden\u00e1 las piezas desliz\u00e1ndolas. \u00a1Cuantos menos movimientos, mejor!",
    color: "from-violet-500 to-fuchsia-600",
    teacher: {
      name: "Mar\u00eda Jos\u00e9",
      flag: "\ud83c\uddec\ud83c\uddf9",
      img: "/profesores/maria-jose.webp",
      voice: "es-GT-MartaNeural",
      howTo: "Toc\u00e1 una pieza que est\u00e9 al lado del espacio vac\u00edo para moverla ah\u00ed.",
      goal: "Orden\u00e1 los n\u00fameros del 1 al 8 usando la menor cantidad de movimientos.",
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
            {"\u2190 Mi inicio"}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{"Juegos de recreo \ud83c\udfae"}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <p className="mb-5 text-sm text-slate-500">
          {"Un ratito de recreo entre materia y materia. Gan\u00e1 diamantes extra por jugar bien (hasta 5 veces por d\u00eda por juego)."}
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
                    {"\ud83c\udfaf "}{g.teacher.goal}
                  </p>
                  <button
                    onClick={() =>
                      handleSpeak(g.slug, `${g.teacher.howTo} ${g.teacher.goal}`, g.teacher.voice)
                    }
                    className="mt-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                  >
                    {speakingSlug === g.slug ? "\ud83d\udd0a Hablando..." : "\ud83d\udd0a Escuchar"}
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

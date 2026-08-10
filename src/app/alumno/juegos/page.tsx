"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, SPRING_PLAYFUL } from "@/lib/motion";

const GAMES = [
  {
    slug: "memoria",
    name: "Memoria Mágica",
    icon: "🧠",
    description: "Encontrá las parejas de cartas. ¡Cuantos menos intentos, más diamantes!",
    color: "from-teal-400 to-cyan-500",
  },
];

export default function JuegosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-6 text-white">
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Juegos de recreo 🎮</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-6">
        <p className="mb-5 text-sm text-slate-500">
          Un ratito de recreo entre materia y materia. Ganá diamantes extra por jugar bien
          (hasta 5 veces por día por juego).
        </p>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.06)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {GAMES.map((g) => (
            <motion.div key={g.slug} variants={staggerItem}>
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

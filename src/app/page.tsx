"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItemUi, SPRING_UI } from "@/lib/motion";

export default function Home() {
  return (
    <motion.main
      initial="initial"
      animate="animate"
      variants={staggerContainer(0.12, 0.05)}
      className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-br from-purple-500 via-pink-400 to-yellow-300 p-6 text-center"
    >
      <motion.div variants={staggerItemUi}>
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
          Academia Mágica
        </h1>
        <p className="mt-3 text-lg text-white/90">
          Aprender jugando, un diamante a la vez ✨
        </p>
      </motion.div>

      <motion.div
        variants={staggerItemUi}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
          <Link
            href="/alumno"
            className="block rounded-2xl bg-white px-10 py-6 text-xl font-bold text-purple-700 shadow-xl"
          >
            Soy Alumno 🧒
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
          <Link
            href="/login"
            className="block rounded-2xl bg-black/30 px-10 py-6 text-xl font-bold text-white shadow-xl backdrop-blur hover:bg-black/40"
          >
            Soy Administrador 🔐
          </Link>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}

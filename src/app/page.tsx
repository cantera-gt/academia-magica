"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItemUi, SPRING_UI, SPRING_PLAYFUL, popIn } from "@/lib/motion";
import AmbientMusicToggle from "@/components/ambient-music-toggle";

const TEACHERS = [
  { name: "Amara", img: "/profesores/amara.webp" },
  { name: "Diego", img: "/profesores/diego.webp" },
  { name: "James", img: "/profesores/james.webp" },
  { name: "Kenji", img: "/profesores/kenji.webp" },
  { name: "Lucía", img: "/profesores/lucia.webp" },
  { name: "Lukas", img: "/profesores/lukas.webp" },
  { name: "María José", img: "/profesores/maria-jose.webp" },
  { name: "Susan", img: "/profesores/susan.webp" },
];

const FEATURES = [
  {
    emoji: "🧩",
    title: "Ejercicios que se adaptan",
    text: "Cada materia tiene ejercicios pensados para su edad, que suben de nivel a su ritmo.",
  },
  {
    emoji: "🎤",
    title: "Un profe siempre disponible",
    text: "Si tiene una duda, le pregunta al profesor por voz o texto. Nunca le da la respuesta: le enseña el camino.",
  },
  {
    emoji: "💎",
    title: "Diamantes por cada logro",
    text: "Resolver bien un ejercicio suma diamantes de verdad, no puntos vacíos.",
  },
  {
    emoji: "🏰",
    title: "Su cuarto, a su gusto",
    text: "Con los diamantes compra muebles y objetos para decorar su propio cuarto mágico.",
  },
];

export default function Home() {
  return (
    <main className="font-body">
      {/* HEADER FIJO: se mantiene visible en toda la pagina, no solo en el hero */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-[#3b2a55]/80 px-4 py-3 backdrop-blur-md sm:px-8">
        <Link href="/" className="font-display text-lg font-bold text-white sm:text-xl">
          ✨ Academia Mágica
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/alumno"
            className="rounded-full bg-[#ffd93d] px-3 py-1.5 text-sm font-bold text-[#3b2a55] sm:px-4 sm:py-2"
          >
            Alumno 🧒
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/40 hover:bg-white/25 sm:px-4 sm:py-2"
          >
            Admin 🔐
          </Link>
          <AmbientMusicToggle />
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/classroom/ninos-saltando.jpg"
            alt="Niños celebrando en el aula de Academia Mágica"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3b2a55]/85 via-[#6c5ce7]/55 to-[#3b2a55]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3b2a55] via-transparent to-transparent" />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.12, 0.15)}
          className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 pt-24 text-center"
        >
          <motion.div variants={staggerItemUi}>
            <h1 className="font-display text-balance text-5xl font-extrabold leading-tight text-white drop-shadow-lg sm:text-7xl">
              Academia Mágica
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg font-semibold text-white/95 drop-shadow sm:text-2xl">
              Aprender Jugando es Posible en Academia Mágica
            </p>
          </motion.div>

          <motion.div
            variants={staggerItemUi}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                href="/alumno"
                className="block rounded-2xl bg-[#ffd93d] px-10 py-6 text-xl font-bold text-[#3b2a55] shadow-xl"
              >
                Soy Alumno 🧒
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                href="/login"
                className="block rounded-2xl bg-black/35 px-10 py-6 text-xl font-bold text-white shadow-xl ring-2 ring-white/70 backdrop-blur-md hover:bg-black/45"
              >
                Soy Administrador 🔐
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Mascotas ilustradas flotando sobre el borde inferior del hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_PLAYFUL, delay: 0.5 }}
          className="pointer-events-none absolute -bottom-2 left-0 right-0 z-10 flex items-end justify-center gap-4 sm:gap-10"
        >
          <div className="relative h-28 w-20 sm:h-40 sm:w-28">
            <Image src="/personajes2d/girl_4-7_1.webp" alt="" fill sizes="160px" className="object-contain object-bottom drop-shadow-2xl" />
          </div>
          <div className="relative h-36 w-24 sm:h-52 sm:w-36">
            <Image src="/personajes2d/boy_10-12_2.webp" alt="" fill sizes="200px" className="object-contain object-bottom drop-shadow-2xl" />
          </div>
          <div className="relative h-32 w-20 sm:h-44 sm:w-28">
            <Image src="/personajes2d/girl_7-10_3.webp" alt="" fill sizes="160px" className="object-contain object-bottom drop-shadow-2xl" />
          </div>
        </motion.div>

        {/* Divisor ondulado */}
        <svg
          className="absolute -bottom-1 left-0 z-0 h-16 w-full text-[#fff8ec]"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,60 C240,110 480,10 720,40 C960,70 1200,20 1440,55 L1440,100 L0,100 Z"
          />
        </svg>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-[#fff8ec] px-6 py-20 sm:px-10">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.08, 0)}
          className="mx-auto max-w-5xl"
        >
          <motion.h2
            variants={staggerItemUi}
            className="font-display text-balance text-center text-3xl font-extrabold text-[#3b2a55] sm:text-4xl"
          >
            ¿Cómo funciona la magia?
          </motion.h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={popIn}
                className="rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-[#3b2a55]/5"
              >
                <div className="text-4xl">{f.emoji}</div>
                <h3 className="font-display mt-3 text-lg font-bold text-[#3b2a55]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[#3b2a55]/80">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PROFESORES */}
      <section className="relative overflow-hidden bg-[#6c5ce7] px-6 py-20 sm:px-10">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/classroom/reunion-profesores.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#6c5ce7]/90 via-[#6c5ce7]/80 to-[#6c5ce7]/95" />

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.06, 0)}
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <motion.h2 variants={staggerItemUi} className="font-display text-balance text-3xl font-extrabold text-white sm:text-4xl">
            Profesores de verdad, listos para ayudar
          </motion.h2>
          <motion.p variants={staggerItemUi} className="mx-auto mt-3 max-w-xl text-white/85">
            Cada materia tiene su profesor con voz propia. Si hay una duda, está a un micrófono de distancia.
          </motion.p>

          <div className="mt-12 grid grid-cols-4 gap-6 sm:grid-cols-8">
            {TEACHERS.map((t) => (
              <motion.div key={t.name} variants={popIn} className="flex flex-col items-center gap-2">
                <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-white/30 sm:h-20 sm:w-20">
                  <Image src={t.img} alt={t.name} fill sizes="80px" className="object-cover" />
                </div>
                <p className="text-xs font-semibold text-white/90 sm:text-sm">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* APRENDER JUGANDO */}
      <section className="bg-[#fff8ec] px-6 py-20 sm:px-10">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.1, 0)}
          className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2"
        >
          <motion.div variants={staggerItemUi} className="order-2 lg:order-1">
            <p className="font-display text-sm font-bold uppercase tracking-wide text-[#ff6b9d]">
              Aprender jugando
            </p>
            <h2 className="font-display mt-2 text-balance text-3xl font-extrabold text-[#3b2a55] sm:text-4xl">
              Cada ejercicio bien hecho suma diamantes de verdad
            </h2>
            <p className="mt-4 text-[#3b2a55]/70">
              No hay pantallas aburridas: hay juego, curiosidad y ganas de seguir. Los diamantes que gana se
              convierten en muebles, objetos y sorpresas para su propio cuarto mágico.
            </p>
          </motion.div>
          <motion.div variants={staggerItemUi} className="order-1 grid grid-cols-2 gap-4 lg:order-2">
            <div className="relative col-span-2 h-56 overflow-hidden rounded-3xl shadow-lg sm:h-64">
              <Image
                src="/classroom/ninos-suelo.jpg"
                alt="Niños jugando y aprendiendo en el suelo"
                fill
                sizes="(min-width: 1024px) 500px, 90vw"
                className="object-cover"
              />
            </div>
            <div className="relative col-span-2 h-40 overflow-hidden rounded-3xl shadow-lg sm:h-48">
              <Image
                src="/classroom/jugando-futbol.jpg"
                alt="Niños jugando al fútbol en el recreo"
                fill
                sizes="(min-width: 1024px) 500px, 90vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ACOMPAÑAMIENTO */}
      <section className="bg-[#3b2a55] px-6 py-20 sm:px-10">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer(0.1, 0)}
          className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2"
        >
          <motion.div variants={staggerItemUi} className="grid grid-cols-2 gap-4">
            <div className="relative h-40 overflow-hidden rounded-3xl shadow-lg sm:h-48">
              <Image
                src="/classroom/tutoria-nino-profesor.jpg"
                alt="Un profesor ayuda a un alumno a resolver un ejercicio en su tablet"
                fill
                sizes="(min-width: 1024px) 250px, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-3xl shadow-lg sm:h-48">
              <Image
                src="/classroom/tutoria-profesora-nina.jpg"
                alt="Una profesora guía a una alumna paso a paso en su cuaderno"
                fill
                sizes="(min-width: 1024px) 250px, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-3xl shadow-lg sm:h-48">
              <Image
                src="/classroom/tutoria-profesor-nino-2.jpg"
                alt="Un profesor acompaña a un alumno mientras escribe en su cuaderno"
                fill
                sizes="(min-width: 1024px) 250px, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-40 overflow-hidden rounded-3xl shadow-lg sm:h-48">
              <Image
                src="/classroom/tutoria-profesora-nina-2.jpg"
                alt="Una profesora señala algo en la tablet mientras una alumna mira y sonríe"
                fill
                sizes="(min-width: 1024px) 250px, 45vw"
                className="object-cover"
              />
            </div>
          </motion.div>
          <motion.div variants={staggerItemUi}>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-[#7fe7c4]">
              Acompañamiento real
            </p>
            <h2 className="font-display mt-2 text-balance text-3xl font-extrabold text-white sm:text-4xl">
              Nunca le damos la respuesta. Le enseñamos el camino.
            </h2>
            <p className="mt-4 text-white/70">
              Como un profesor de verdad: con preguntas, pistas y paciencia, hasta que la respuesta la
              encuentra ella o él solito. Eso es lo que queda.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-[#6c5ce7] via-[#ff6b9d] to-[#ffd93d] px-6 py-20 text-center sm:px-10">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerContainer(0.1, 0)}
        >
          <motion.h2 variants={staggerItemUi} className="font-display text-balance text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
            ¿Empezamos a jugar y aprender?
          </motion.h2>
          <motion.div variants={staggerItemUi} className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                href="/alumno"
                className="block rounded-2xl bg-white px-10 py-5 text-xl font-bold text-[#6c5ce7] shadow-xl"
              >
                Soy Alumno 🧒
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={SPRING_UI}>
              <Link
                href="/login"
                className="block rounded-2xl bg-black/25 px-10 py-5 text-xl font-bold text-white shadow-xl backdrop-blur hover:bg-black/35"
              >
                Soy Administrador 🔐
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <footer className="bg-[#3b2a55] px-6 py-6 text-center text-xs text-white/50">
        Academia Mágica · Aprender Jugando es Posible ✨
      </footer>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { ActiveStudent } from "@/types/database";
import {
  staggerContainer,
  staggerItem,
  fadeSlideUp,
  SPRING_PLAYFUL,
} from "@/lib/motion";

export default function AlumnoLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ActiveStudent | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.rpc("list_active_students").then(({ data }) => {
      setStudents((data as ActiveStudent[]) ?? []);
      setLoading(false);
    });
  }, [supabase]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);

    const email = `${selected.username}@alumnos.academia-magica.app`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (signInError) {
      setError("PIN incorrecto, ¡probá de nuevo!");
      setSubmitting(false);
      setPin("");
      return;
    }

    // La cuenta puede estar desactivada (por ejemplo, si no se pagó ese mes)
    // aunque el PIN sea correcto. list_active_students ya la oculta del
    // selector, pero esto cierra el acceso directo tambien.
    const { data: isActive } = await supabase.rpc("my_is_active");
    if (isActive === false) {
      await supabase.auth.signOut();
      setError("Esta cuenta está desactivada. Pedile a un adulto que hable con el administrador.");
      setSubmitting(false);
      setPin("");
      return;
    }

    router.push("/alumno/inicio");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <p className="text-white">Cargando...</p>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.08)}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            variants={staggerItem}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white/20"
          >
            {selected.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.thumbnail_url}
                alt={selected.display_name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <span className="text-6xl">⭐</span>
            )}
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-2xl font-bold text-white">
            ¡Hola, {selected.display_name}!
          </motion.h1>
          <motion.p variants={staggerItem} className="text-white/80">
            Ingresá tu PIN secreto
          </motion.p>

          <motion.form
            variants={staggerItem}
            onSubmit={handlePinSubmit}
            className="flex flex-col items-center gap-4"
          >
            <input
              autoFocus
              required
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-48 rounded-xl border-4 border-white/40 bg-white/20 px-4 py-3 text-center text-3xl tracking-[0.5em] text-white placeholder-white/40 outline-none transition-colors focus:border-white"
              placeholder="••••••"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeSlideUp}
                  className="text-sm text-yellow-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || pin.length !== 6}
              whileHover={{ scale: submitting ? 1 : 1.05 }}
              whileTap={{ scale: submitting ? 1 : 0.95 }}
              transition={SPRING_PLAYFUL}
              className="rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-700 shadow-lg disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar 🚀"}
            </motion.button>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setPin("");
                setError(null);
              }}
              className="text-sm text-white/70 underline"
            >
              No soy yo
            </button>
          </motion.form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <Link
        href="/"
        className="absolute left-6 top-6 text-sm text-white/70 hover:text-white"
      >
        ← Volver
      </Link>

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-3xl font-bold text-white"
      >
   ¿Quién eres?
      </motion.h1>
      {students.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscá tu nombre..."
          className="w-64 rounded-xl border-2 border-white/30 bg-white/15 px-4 py-2.5 text-center text-white placeholder-white/50 outline-none focus:border-white"
        />
      )}
      {students.length === 0 ? (
        <p className="max-w-sm text-center text-white/80">
          Todavía no hay alumnos creados. Pedile a tu administrador que te
          registre en el panel de administración.
        </p>
      ) : students.filter((s) =>
          s.display_name.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))
        ).length === 0 ? (
        <p className="max-w-sm text-center text-white/80">
          No encontramos a nadie con ese nombre. Probá escribir menos letras.
        </p>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.08)}
          className="flex flex-wrap justify-center gap-6"
        >
          {students
            .filter((s) =>
              s.display_name.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"))
            )
            .map((s) => (
            <motion.button
              key={s.username}
              variants={staggerItem}
              onClick={() => setSelected(s)}
              whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="flex w-32 flex-col items-center gap-2 rounded-2xl bg-white/15 p-4 backdrop-blur hover:bg-white/25"
            >
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20">
                {s.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.thumbnail_url}
                    alt={s.display_name}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <span className="text-4xl">⭐</span>
                )}
              </span>
              <span className="font-semibold text-white">
                {s.display_name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </main>
  );
}


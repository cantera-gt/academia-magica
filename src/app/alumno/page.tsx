"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ActiveStudent } from "@/types/database";

const CHARACTER_EMOJI: Record<string, string> = {
  princess: "👑",
  superhero: "🦸",
};

export default function AlumnoLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [students, setStudents] = useState<ActiveStudent[]>([]);
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
        <div className="text-7xl">
          {CHARACTER_EMOJI[selected.active_character ?? ""] ?? "⭐"}
        </div>
        <h1 className="text-2xl font-bold text-white">
          ¡Hola, {selected.display_name}!
        </h1>
        <p className="text-white/80">Ingresá tu PIN secreto</p>

        <form
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
            className="w-48 rounded-xl border-4 border-white/40 bg-white/20 px-4 py-3 text-center text-3xl tracking-[0.5em] text-white placeholder-white/40 outline-none focus:border-white"
            placeholder="••••••"
          />

          {error && <p className="text-sm text-yellow-200">{error}</p>}

          <button
            type="submit"
            disabled={submitting || pin.length !== 6}
            className="rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-700 shadow-lg disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Entrar 🚀"}
          </button>
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
        </form>
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

      <h1 className="text-3xl font-bold text-white">¿Quién sos?</h1>

      {students.length === 0 ? (
        <p className="max-w-sm text-center text-white/80">
          Todavía no hay alumnos creados. Pedile a tu administrador que te
          registre en el panel de administración.
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {students.map((s) => (
            <button
              key={s.username}
              onClick={() => setSelected(s)}
              className="flex w-32 flex-col items-center gap-2 rounded-2xl bg-white/15 p-4 backdrop-blur transition hover:scale-105 hover:bg-white/25"
            >
              <span className="text-5xl">
                {CHARACTER_EMOJI[s.active_character ?? ""] ?? "⭐"}
              </span>
              <span className="font-semibold text-white">
                {s.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

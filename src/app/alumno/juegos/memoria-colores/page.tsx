"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Simon Dice: la pantalla muestra una secuencia de colores que se va
// alargando, y el alumno tiene que repetirla tocando los mismos botones en
// el mismo orden. Clasico juego de memoria de secuencias.

const PADS = [
  { id: 0, color: "bg-red-500", active: "bg-red-300", label: "rojo" },
  { id: 1, color: "bg-blue-500", active: "bg-blue-300", label: "azul" },
  { id: 2, color: "bg-green-500", active: "bg-green-300", label: "verde" },
  { id: 3, color: "bg-yellow-400", active: "bg-yellow-200", label: "amarillo" },
];

type Phase = "idle" | "showing" | "input" | "gameover";

export default function MemoriaColoresPage() {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [litPad, setLitPad] = useState<number | null>(null);
  const [rounds, setRounds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const cancelledRef = useRef(false);

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase("showing");
    await new Promise((r) => setTimeout(r, 500));
    for (const step of seq) {
      if (cancelledRef.current) return;
      setLitPad(step);
      await new Promise((r) => setTimeout(r, 420));
      if (cancelledRef.current) return;
      setLitPad(null);
      await new Promise((r) => setTimeout(r, 200));
    }
    if (cancelledRef.current) return;
    setUserStep(0);
    setPhase("input");
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function start() {
    cancelledRef.current = false;
    setRounds(0);
    setResult(null);
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    playSequence(first);
  }

  async function finish(finalRounds: number) {
    const won = finalRounds >= 3;
    const moves = Math.max(0, 40 - finalRounds * 4);
    setSaving(true);
    const res = await finishGame(supabase, "memoriacolores", won, moves);
    setResult(res);
    setSaving(false);
  }

  function tapPad(id: number) {
    if (phase !== "input") return;
    setLitPad(id);
    setTimeout(() => setLitPad(null), 200);

    if (id !== sequence[userStep]) {
      setPhase("gameover");
      finish(rounds);
      return;
    }

    const nextStep = userStep + 1;
    if (nextStep === sequence.length) {
      const newRounds = rounds + 1;
      setRounds(newRounds);
      const next = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(next);
      setTimeout(() => playSequence(next), 500);
    } else {
      setUserStep(nextStep);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-700 p-6">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          {(phase === "showing" || phase === "input") && (
            <span className="text-sm font-semibold">🏆 Ronda {rounds + 1}</span>
          )}
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Simón Dice 🔴🔵🟢🟡</h1>

        {phase === "idle" && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-sm text-white/80">
              Mira la secuencia de colores y repítela tocando los mismos botones en orden.
            </p>
            <motion.button
              onClick={start}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-purple-700 shadow-lg"
            >
              ¡Empezar! 🚀
            </motion.button>
          </div>
        )}

        {(phase === "showing" || phase === "input") && (
          <>
            <p className="mt-4 text-center text-sm font-semibold text-white/90">
              {phase === "showing" ? "Mira bien..." : "¡Ahora repite!"}
            </p>
            <div className="mx-auto mt-4 grid w-64 grid-cols-2 gap-3">
              {PADS.map((pad) => (
                <motion.button
                  key={pad.id}
                  onClick={() => tapPad(pad.id)}
                  disabled={phase !== "input"}
                  whileTap={phase === "input" ? { scale: 0.92 } : undefined}
                  className={`h-28 w-28 rounded-2xl shadow-lg transition-colors ${
                    litPad === pad.id ? pad.active : pad.color
                  }`}
                  aria-label={pad.label}
                />
              ))}
            </div>
          </>
        )}

        <AnimatePresence>
          {phase === "gameover" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">🏁</span>
              <p className="text-lg font-bold">Llegaste a la ronda {rounds + 1}</p>
              {saving ? (
                <p className="text-sm text-white/80">Calculando premio...</p>
              ) : result ? (
                <>
                  <p className="text-2xl font-bold">
                    {result.diamonds_earned > 0
                      ? `+${result.diamonds_earned} 💎`
                      : "Ya llegaste al límite de hoy"}
                  </p>
                  <p className="text-xs text-white/70">
                    Partidas jugadas hoy: {result.plays_today}/{result.daily_cap}
                  </p>
                </>
              ) : null}
              <motion.button
                onClick={start}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-purple-700"
              >
                Jugar de nuevo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

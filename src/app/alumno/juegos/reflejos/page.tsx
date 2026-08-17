"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

const TOTAL_ROUNDS = 5;
const EARLY_PENALTY_MS = 1200;
const MIN_DELAY = 700;
const MAX_DELAY = 2200;

type Phase = "idle" | "waiting" | "ready" | "early" | "hit" | "done";

export default function ReflejosPage() {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const readyAt = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    setPhase("waiting");
    setLastMs(null);
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timeoutRef.current = setTimeout(() => {
      readyAt.current = performance.now();
      setPhase("ready");
    }, delay);
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  async function finish(finalTimes: number[]) {
    const earlyCount = finalTimes.filter((t) => t >= EARLY_PENALTY_MS).length;
    const validTimes = finalTimes.filter((t) => t < EARLY_PENALTY_MS);
    const avg =
      finalTimes.reduce((a, b) => a + b, 0) / Math.max(1, finalTimes.length);
    const won = earlyCount <= 1 && validTimes.length >= 3;
    const moves = Math.min(40, Math.max(4, Math.round(avg / 40)));
    setSaving(true);
    const res = await finishGame(supabase, "reflejos", won, moves);
    setResult(res);
    setSaving(false);
  }

  function handleTap() {
    if (phase === "waiting") {
      clearTimer();
      setPhase("early");
      const nextTimes = [...times, EARLY_PENALTY_MS];
      setTimes(nextTimes);
      setLastMs(null);
      advance(nextTimes);
      return;
    }
    if (phase === "ready") {
      const reaction = Math.round(performance.now() - readyAt.current);
      setPhase("hit");
      setLastMs(reaction);
      const nextTimes = [...times, reaction];
      setTimes(nextTimes);
      advance(nextTimes);
    }
  }

  function advance(nextTimes: number[]) {
    const nextRound = round + 1;
    setTimeout(() => {
      if (nextRound >= TOTAL_ROUNDS) {
        setRound(nextRound);
        setPhase("done");
        finish(nextTimes);
      } else {
        setRound(nextRound);
        startRound();
      }
    }, 700);
  }

  function playAgain() {
    setRound(0);
    setTimes([]);
    setLastMs(null);
    setResult(null);
    startRound();
  }

  const avgMs =
    times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          {phase !== "idle" && phase !== "done" && (
            <span className="text-sm font-semibold">
              Ronda {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Ojo de Halcón 🦅</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Esperá a que se ponga verde y tocá lo más rápido que puedas.
        </p>

        {phase === "idle" && (
          <motion.button
            onClick={startRound}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING_PLAYFUL}
            className="mx-auto mt-10 block rounded-2xl bg-white px-8 py-4 text-lg font-bold text-orange-600 shadow-lg"
          >
            ¡Empezar! 🚀
          </motion.button>
        )}

        {(phase === "waiting" || phase === "ready" || phase === "early" || phase === "hit") && (
          <motion.button
            onClick={handleTap}
            whileTap={{ scale: 0.96 }}
            animate={{
              backgroundColor:
                phase === "ready"
                  ? "#22c55e"
                  : phase === "early"
                    ? "#ef4444"
                    : phase === "hit"
                      ? "#22c55e"
                      : "#f43f5e",
            }}
            className="mx-auto mt-10 flex h-56 w-56 items-center justify-center rounded-full text-center text-xl font-extrabold text-white shadow-2xl"
          >
            {phase === "waiting" && "Esperá... 👀"}
            {phase === "ready" && "¡AHORA! 👆"}
            {phase === "early" && "Muy pronto 😅"}
            {phase === "hit" && `${lastMs} ms ⚡`}
          </motion.button>
        )}

        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">🏁</span>
              <p className="text-lg font-bold">
                Promedio: {avgMs !== null ? `${avgMs} ms` : "-"}
              </p>
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
                onClick={playAgain}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-orange-600"
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

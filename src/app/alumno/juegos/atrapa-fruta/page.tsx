"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Atrapa la Fruta: caen frutas (y alguna bomba) desde arriba, hay que
// tocarlas antes de que lleguen abajo. Tocar una fruta suma, tocar una
// bomba resta. Contrarreloj, como Suma Veloz.

const ROUND_SECONDS = 30;
const AREA_H = 420;
const FRUITS = ["🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "🍍"];
const BOMB = "💣";

type FallingItem = {
  id: number;
  emoji: string;
  isBomb: boolean;
  x: number;
  duration: number;
};

let nextId = 1;

export default function AtrapaFrutaPage() {
  const supabase = createClient();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(
    async (finalCorrect: number) => {
      const won = finalCorrect >= 5;
      const moves = Math.max(4, 20 - finalCorrect * 2);
      setSaving(true);
      const res = await finishGame(supabase, "atrapafruta", won, moves);
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, finished]);

  useEffect(() => {
    if (!started || finished) return;
    spawnRef.current = setInterval(() => {
      const isBomb = Math.random() < 0.22;
      const emoji = isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)];
      setItems((prev) => [
        ...prev,
        {
          id: nextId++,
          emoji,
          isBomb,
          x: 8 + Math.random() * 80,
          duration: 2.1 + Math.random() * 1.1,
        },
      ]);
    }, 650);
    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [started, finished]);

  useEffect(() => {
    if (started && !finished && secondsLeft === 0) {
      setFinished(true);
      setItems([]);
      finish(correct);
    }
  }, [secondsLeft, started, finished, correct, finish]);

  function start() {
    setStarted(true);
    setFinished(false);
    setSecondsLeft(ROUND_SECONDS);
    setCorrect(0);
    setWrong(0);
    setItems([]);
    setResult(null);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function tapItem(item: FallingItem) {
    if (finished) return;
    if (item.isBomb) setWrong((w) => w + 1);
    else setCorrect((c) => c + 1);
    removeItem(item.id);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600 p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          {started && !finished && (
            <span className="text-sm font-semibold">⏱️ {secondsLeft}s</span>
          )}
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Atrapa la Fruta 🍓</h1>

        {!started && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-sm text-white/80">
              Toca las frutas antes de que caigan. ¡Cuidado con la bomba 💣, resta!
            </p>
            <motion.button
              onClick={start}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-lg"
            >
              ¡Empezar! 🚀
            </motion.button>
          </div>
        )}

        {started && !finished && (
          <>
            <div className="mt-3 flex justify-center gap-4 text-sm font-semibold text-white/90">
              <span>✅ {correct}</span>
              <span>💣 {wrong}</span>
            </div>
            <div
              className="relative mt-3 overflow-hidden rounded-3xl bg-white/15 backdrop-blur"
              style={{ height: AREA_H }}
            >
              {items.map((item) => (
                <motion.button
                  key={item.id}
                  initial={{ top: -60 }}
                  animate={{ top: AREA_H }}
                  transition={{ duration: item.duration, ease: "linear" }}
                  onAnimationComplete={() => removeItem(item.id)}
                  onClick={() => tapItem(item)}
                  style={{ position: "absolute", left: `${item.x}%` }}
                  className="-translate-x-1/2 text-4xl leading-none active:scale-90"
                >
                  {item.emoji}
                </motion.button>
              ))}
            </div>
          </>
        )}

        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">🏁</span>
              <p className="text-lg font-bold">
                {correct} frutas, {wrong} bombas
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
                onClick={start}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-emerald-700"
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

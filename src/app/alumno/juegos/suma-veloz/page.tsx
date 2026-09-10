"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

const ROUND_SECONDS = 30;

type Question = { text: string; answer: number; options: number[] };

function makeQuestion(): Question {
  const useSum = Math.random() < 0.6;
  let a = 1 + Math.floor(Math.random() * 18);
  let b = 1 + Math.floor(Math.random() * 18);
  if (!useSum && b > a) [a, b] = [b, a];
  const answer = useSum ? a + b : a - b;

  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const delta = 1 + Math.floor(Math.random() * 5);
    const candidate = Math.random() < 0.5 ? answer + delta : answer - delta;
    if (candidate !== answer && candidate >= 0) distractors.add(candidate);
  }
  const options = [answer, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

  return { text: `${a} ${useSum ? "+" : "-"} ${b}`, answer, options };
}

export default function SumaVelozPage() {
  const supabase = createClient();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [question, setQuestion] = useState<Question>(() => makeQuestion());
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(
    async (finalCorrect: number) => {
      const won = finalCorrect >= 3;
      const moves = Math.max(4, 20 - finalCorrect * 2);
      setSaving(true);
      const res = await finishGame(supabase, "sumaveloz", won, moves);
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!started || finished) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, finished]);

  useEffect(() => {
    if (started && !finished && secondsLeft === 0) {
      setFinished(true);
      finish(correct);
    }
  }, [secondsLeft, started, finished, correct, finish]);

  function start() {
    setStarted(true);
    setFinished(false);
    setSecondsLeft(ROUND_SECONDS);
    setCorrect(0);
    setWrong(0);
    setQuestion(makeQuestion());
    setResult(null);
  }

  function answer(value: number) {
    if (finished) return;
    const isCorrect = value === question.answer;
    setFlash(isCorrect ? "correct" : "wrong");
    setTimeout(() => setFlash(null), 200);
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    setQuestion(makeQuestion());
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          {started && !finished && (
            <span className="text-sm font-semibold">⏱️ {secondsLeft}s</span>
          )}
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Suma Veloz ⚡</h1>

        {!started && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-sm text-white/80">
              Resuelve todas las cuentas que puedas en {ROUND_SECONDS} segundos.
            </p>
            <motion.button
              onClick={start}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-lg"
            >
              ¡Empezar! 🚀
            </motion.button>
          </div>
        )}

        {started && !finished && (
          <>
            <div className="mt-4 flex justify-center gap-4 text-sm font-semibold text-white/90">
              <span>✅ {correct}</span>
              <span>❌ {wrong}</span>
            </div>
            <motion.div
              key={question.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: flash === "correct" ? [1, 1.05, 1] : flash === "wrong" ? [1, 0.97, 1] : 1,
              }}
              transition={{ duration: 0.25 }}
              className="mt-6 rounded-3xl bg-white/15 p-8 text-center backdrop-blur"
            >
              <p className="text-4xl font-extrabold text-white">{question.text} = ?</p>
            </motion.div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {question.options.map((opt) => (
                <motion.button
                  key={opt}
                  onClick={() => answer(opt)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_PLAYFUL}
                  className="rounded-2xl bg-white py-4 text-2xl font-bold text-blue-700 shadow-lg"
                >
                  {opt}
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
                {correct} correctas, {wrong} incorrectas
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
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-blue-700"
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

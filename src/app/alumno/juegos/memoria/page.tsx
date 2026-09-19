"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame as saveGame, type FinishGameResult } from "@/lib/finish-game";
import { playWinSound, playRecordSound } from "@/lib/sound";
import { useStudentDifficulty, byDifficulty } from "@/lib/age";

// Ocho simbolos disponibles; cada partida usa los primeros N segun la edad.
const EMOJIS = ["🦄", "🐉", "🌟", "🎈", "🍀", "💎", "🐢", "🌺"];

interface CardState {
  key: string;
  emoji: string;
  matched: boolean;
}

// Parejas segun edad: 4 para los pequenos (8 cartas caben de un vistazo y no
// exceden su memoria de trabajo), 6 como hasta ahora, 8 para los mayores.
function shuffledDeck(pairCount = 6): CardState[] {
  const chosen = EMOJIS.slice(0, pairCount);
  const pairs = [...chosen, ...chosen];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({ key: `${i}-${emoji}-${Math.random()}`, emoji, matched: false }));
}

export default function MemoriaPage() {
  const supabase = createClient();
  const { difficulty } = useStudentDifficulty();
  const pairCount = byDifficulty(difficulty, 4, 6, 8);
  const [deck, setDeck] = useState<CardState[]>(() => shuffledDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  const finishGame = useCallback(
    async (finalMoves: number) => {
      setSaving(true);
      const res = await saveGame(supabase, "memoria", true, finalMoves);
      playWinSound();
      if (res?.is_record) playRecordSound();
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (allMatched && !won) {
      setWon(true);
      finishGame(moves);
    }
  }, [allMatched, won, moves, finishGame]);

  function flipCard(index: number) {
    if (locked || won) return;
    if (flipped.includes(index) || deck[index].matched) return;
    if (flipped.length === 2) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves((m) => m + 1);
      const [a, b] = next;
      const isMatch = deck[a].emoji === deck[b].emoji;

      setTimeout(() => {
        if (isMatch) {
          setDeck((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c))
          );
        }
        setFlipped([]);
        setLocked(false);
      }, 700);
    }
  }

  function playAgain() {
    setDeck(shuffledDeck(pairCount));
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          <span className="text-sm font-semibold">Intentos: {moves}</span>
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Memoria Mágica 🧠</h1>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {deck.map((card, i) => {
            const isFlipped = card.matched || flipped.includes(i);
            return (
              <button
                key={card.key}
                onClick={() => flipCard(i)}
                className="aspect-square"
                style={{ perspective: 600 }}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/25 text-2xl backdrop-blur"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    ❓
                  </div>
                  <div
                    className={`absolute inset-0 flex items-center justify-center rounded-xl text-3xl ${
                      card.matched ? "bg-emerald-300" : "bg-white"
                    }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    {card.emoji}
                  </div>
                </motion.div>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">🎉</span>
              <p className="text-lg font-bold">¡Ganaste en {moves} intentos!</p>
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
                  {result.is_record && (
                    <p className="mt-1 text-base font-black">{"\uD83C\uDFC6 \u00a1Nuevo r\u00e9cord!"}</p>
                  )}
                  {result.capped && (
                    <p className="mt-1 text-xs text-white/70">
                      {"Ya ganaste todos los diamantes del recreo de hoy. Ma\u00f1ana m\u00e1s \u2014 puedes seguir jugando igual."}
                    </p>
                  )}
                </>
              ) : null}
              <motion.button
                onClick={playAgain}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-teal-700"
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

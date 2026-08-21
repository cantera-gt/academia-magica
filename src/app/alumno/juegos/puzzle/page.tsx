"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

const SIZE = 3;
const TILE_EMOJIS = ["🦋", "🌈", "🍎", "🐬", "🎈", "🌟", "🍀", "🌸"];
const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function shuffledBoard(): number[] {
  const board = [...SOLVED];
  let blank = 8;
  let lastBlank = -1;
  for (let i = 0; i < 120; i++) {
    const row = Math.floor(blank / SIZE);
    const col = blank % SIZE;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(blank - SIZE);
    if (row < SIZE - 1) neighbors.push(blank + SIZE);
    if (col > 0) neighbors.push(blank - 1);
    if (col < SIZE - 1) neighbors.push(blank + 1);
    const candidates = neighbors.filter((n) => n !== lastBlank);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    [board[blank], board[pick]] = [board[pick], board[blank]];
    lastBlank = blank;
    blank = pick;
  }
  return board;
}

export default function PuzzlePage() {
  const supabase = createClient();
  const [board, setBoard] = useState<number[]>(() => shuffledBoard());
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const finish = useCallback(
    async (finalMoves: number) => {
      setSaving(true);
      const res = await finishGame(supabase, "puzzle", true, finalMoves);
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  function tap(index: number) {
    if (solved) return;
    const blank = board.indexOf(0);
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const blankRow = Math.floor(blank / SIZE);
    const blankCol = blank % SIZE;
    const adjacent =
      (row === blankRow && Math.abs(col - blankCol) === 1) ||
      (col === blankCol && Math.abs(row - blankRow) === 1);
    if (!adjacent) return;

    const next = [...board];
    [next[index], next[blank]] = [next[blank], next[index]];
    setBoard(next);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (next.every((v, i) => v === SOLVED[i])) {
      setSolved(true);
      finish(nextMoves);
    }
  }

  function playAgain() {
    setBoard(shuffledBoard());
    setMoves(0);
    setSolved(false);
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 p-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            {"← Juegos"}
          </Link>
          <span className="text-sm font-semibold">Movimientos: {moves}</span>
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">{"Rompecabezas Mágico 🧩"}</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Desliza las piezas hasta ordenarlas del 1 al 8.
        </p>

        <div className="mx-auto mt-6 grid w-full max-w-xs grid-cols-3 gap-2">
          {board.map((value, i) => (
            <button
              key={i}
              onClick={() => tap(i)}
              className="aspect-square"
              disabled={value === 0}
            >
              {value === 0 ? (
                <div className="h-full w-full rounded-xl bg-white/10" />
              ) : (
                <motion.div
                  layout
                  transition={SPRING_PLAYFUL}
                  className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-white text-3xl font-bold text-purple-700 shadow-lg"
                >
                  <span>{TILE_EMOJIS[value - 1]}</span>
                  <span className="text-xs text-purple-400">{value}</span>
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {solved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">{"🎉"}</span>
              <p className="text-lg font-bold">{"¡Lo resolviste en "}{moves}{" movimientos!"}</p>
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

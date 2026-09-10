"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Tres en Raya contra la profe: IA simple (gana si puede, bloquea si hace
// falta, si no juega centro/esquina). El alumno siempre empieza.

type Cell = "X" | "O" | null;
type Winner = "player" | "ai" | "draw" | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Cell[]): "X" | "O" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function pickAiMove(board: Cell[]): number {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);

  for (const i of empty) {
    const copy = [...board];
    copy[i] = "O";
    if (checkWinner(copy) === "O") return i;
  }
  for (const i of empty) {
    const copy = [...board];
    copy[i] = "X";
    if (checkWinner(copy) === "X") return i;
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TresEnRayaPage() {
  const supabase = createClient();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [playerMoves, setPlayerMoves] = useState(0);
  const [winner, setWinner] = useState<Winner>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const finish = useCallback(
    async (finalWinner: Winner, moves: number) => {
      const won = finalWinner === "player" || finalWinner === "draw";
      const effectiveMoves = finalWinner === "draw" ? 16 : finalWinner === "player" ? moves : 20;
      setSaving(true);
      const res = await finishGame(supabase, "tresenraya", won, effectiveMoves);
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (winner) return;
    const w = checkWinner(board);
    if (w === "X") {
      setWinner("player");
      finish("player", playerMoves);
    } else if (w === "O") {
      setWinner("ai");
      finish("ai", playerMoves);
    } else if (board.every((c) => c !== null)) {
      setWinner("draw");
      finish("draw", playerMoves);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  function playerMove(i: number) {
    if (board[i] !== null || winner || aiThinking) return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    setPlayerMoves((m) => m + 1);

    const w = checkWinner(next);
    if (w || next.every((c) => c !== null)) return;

    setAiThinking(true);
    setTimeout(() => {
      const aiMove = pickAiMove(next);
      const afterAi = [...next];
      afterAi[aiMove] = "O";
      setBoard(afterAi);
      setAiThinking(false);
    }, 550);
  }

  function restart() {
    setBoard(Array(9).fill(null));
    setPlayerMoves(0);
    setWinner(null);
    setAiThinking(false);
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-red-500 p-6">
      <div className="mx-auto max-w-sm">
        <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
          ← Juegos
        </Link>
        <h1 className="mt-3 text-center text-2xl font-bold text-white">Tres en Raya ❌⭕</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Tú eres ❌. La profe Susan es ⭕. ¡Empiezas tú!
        </p>

        <div className="mx-auto mt-5 grid w-72 grid-cols-3 gap-2">
          {board.map((cell, i) => (
            <motion.button
              key={i}
              onClick={() => playerMove(i)}
              whileTap={cell === null && !winner && !aiThinking ? { scale: 0.92 } : undefined}
              disabled={cell !== null || !!winner || aiThinking}
              className="flex h-22 w-22 items-center justify-center rounded-2xl bg-white text-4xl font-extrabold shadow-lg"
              style={{ height: 84, width: 84 }}
            >
              {cell === "X" && <span className="text-orange-600">❌</span>}
              {cell === "O" && <span className="text-red-600">⭕</span>}
            </motion.button>
          ))}
        </div>

        {aiThinking && (
          <p className="mt-3 text-center text-sm text-white/80">La profe está pensando...</p>
        )}

        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">
                {winner === "player" ? "🎉" : winner === "draw" ? "🤝" : "😅"}
              </span>
              <p className="text-lg font-bold">
                {winner === "player"
                  ? "¡Ganaste!"
                  : winner === "draw"
                    ? "¡Empate!"
                    : "Ganó la profe, ¡prueba de nuevo!"}
              </p>
              {saving ? (
                <p className="text-sm text-white/80">Calculando premio...</p>
              ) : result ? (
                <>
                  <p className="text-2xl font-bold">
                    {result.diamonds_earned > 0
                      ? `+${result.diamonds_earned} 💎`
                      : winner === "ai"
                        ? "Esta vez sin premio"
                        : "Ya llegaste al límite de hoy"}
                  </p>
                  <p className="text-xs text-white/70">
                    Partidas jugadas hoy: {result.plays_today}/{result.daily_cap}
                  </p>
                </>
              ) : null}
              <motion.button
                onClick={restart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-6 py-2 font-bold text-red-600"
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

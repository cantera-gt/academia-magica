"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Laberinto Magico: laberinto generado al azar (backtracking) del tamano
// SIZE x SIZE. El alumno lo recorre con flechas desde la entrada (arriba
// a la izquierda) hasta la salida (abajo a la derecha).

const SIZE = 7;
const CELL = 40;

type Walls = { N: boolean; E: boolean; S: boolean; W: boolean };

function generateMaze(): Walls[][] {
  const grid: Walls[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ N: true, E: true, S: true, W: true }))
  );
  const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  const dirs: { name: keyof Walls; opp: keyof Walls; dr: number; dc: number }[] = [
    { name: "N", opp: "S", dr: -1, dc: 0 },
    { name: "S", opp: "N", dr: 1, dc: 0 },
    { name: "E", opp: "W", dr: 0, dc: 1 },
    { name: "W", opp: "E", dr: 0, dc: -1 },
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const options = dirs
      .map((d) => ({ ...d, nr: r + d.dr, nc: c + d.dc }))
      .filter((d) => d.nr >= 0 && d.nr < SIZE && d.nc >= 0 && d.nc < SIZE && !visited[d.nr][d.nc]);

    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(Math.random() * options.length)];
    grid[r][c][pick.name] = false;
    grid[pick.nr][pick.nc][pick.opp] = false;
    visited[pick.nr][pick.nc] = true;
    stack.push([pick.nr, pick.nc]);
  }

  return grid;
}

export default function LaberintoPage() {
  const supabase = createClient();
  const [maze, setMaze] = useState<Walls[][]>(() => generateMaze());
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const finish = useCallback(
    async (finalMoves: number) => {
      setSaving(true);
      const res = await finishGame(supabase, "laberinto", true, finalMoves);
      setResult(res);
      setSaving(false);
    },
    [supabase]
  );

  const move = useCallback(
    (dir: keyof Walls, dr: number, dc: number) => {
      if (won) return;
      setPos((p) => {
        if (maze[p.r][p.c][dir]) return p;
        const nr = p.r + dr;
        const nc = p.c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) return p;
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        if (nr === SIZE - 1 && nc === SIZE - 1) {
          setWon(true);
          finish(nextMoves);
        }
        return { r: nr, c: nc };
      });
    },
    [maze, moves, won, finish]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") move("N", -1, 0);
      else if (e.key === "ArrowDown") move("S", 1, 0);
      else if (e.key === "ArrowLeft") move("W", 0, -1);
      else if (e.key === "ArrowRight") move("E", 0, 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  function restart() {
    setMaze(generateMaze());
    setPos({ r: 0, c: 0 });
    setMoves(0);
    setWon(false);
    setResult(null);
  }

  const cells = useMemo(() => maze.flatMap((row, r) => row.map((walls, c) => ({ r, c, walls }))), [
    maze,
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-6">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-between text-white">
          <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
            ← Juegos
          </Link>
          <span className="text-sm font-semibold">🧭 {moves} movimientos</span>
        </div>

        <h1 className="mt-3 text-center text-2xl font-bold text-white">Laberinto Mágico 🌟</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Lleva a la exploradora 🧒 desde la entrada hasta el tesoro 💎.
        </p>

        <div
          className="relative mx-auto mt-4 rounded-2xl bg-white/90 p-1 shadow-lg"
          style={{ width: SIZE * CELL + 8, height: SIZE * CELL + 8 }}
        >
          {cells.map(({ r, c, walls }) => (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                top: r * CELL,
                left: c * CELL,
                width: CELL,
                height: CELL,
                borderTop: walls.N ? "2px solid #0f172a" : "2px solid transparent",
                borderRight: walls.E ? "2px solid #0f172a" : "2px solid transparent",
                borderBottom: walls.S ? "2px solid #0f172a" : "2px solid transparent",
                borderLeft: walls.W ? "2px solid #0f172a" : "2px solid transparent",
              }}
              className="flex items-center justify-center text-lg"
            >
              {r === SIZE - 1 && c === SIZE - 1 && "💎"}
              {pos.r === r && pos.c === c && (
                <motion.span layoutId="explorer" transition={SPRING_PLAYFUL} className="text-xl">
                  🧒
                </motion.span>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-5 grid w-40 grid-cols-3 gap-1.5">
          <div />
          <button
            onClick={() => move("N", -1, 0)}
            className="rounded-xl bg-white py-2 text-lg font-bold text-teal-700 shadow"
          >
            ⬆️
          </button>
          <div />
          <button
            onClick={() => move("W", 0, -1)}
            className="rounded-xl bg-white py-2 text-lg font-bold text-teal-700 shadow"
          >
            ⬅️
          </button>
          <button
            onClick={() => move("S", 1, 0)}
            className="rounded-xl bg-white py-2 text-lg font-bold text-teal-700 shadow"
          >
            ⬇️
          </button>
          <button
            onClick={() => move("E", 0, 1)}
            className="rounded-xl bg-white py-2 text-lg font-bold text-teal-700 shadow"
          >
            ➡️
          </button>
        </div>

        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-6 flex flex-col items-center gap-3 rounded-3xl bg-white/15 p-6 text-center text-white backdrop-blur"
            >
              <span className="text-5xl">🏆</span>
              <p className="text-lg font-bold">¡Llegaste al tesoro en {moves} movimientos!</p>
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
                onClick={restart}
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

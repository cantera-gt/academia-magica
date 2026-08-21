"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Pizarra para pintar: dibujos simples armados con formas SVG, cada una
// "pintable" por separado (estilo libro de colorear para tocar). No usa
// imagenes externas -- todo son formas vectoriales, asi que funciona sin
// depender de ningun banco de imagenes.

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#78350f",
  "#0f172a",
];

const BLANK = "#fef9f0";

type Drawing = {
  slug: string;
  name: string;
  icon: string;
  regionIds: string[];
  render: (fill: (id: string) => string, onPick: (id: string) => void) => React.ReactNode;
};

const DRAWINGS: Drawing[] = [
  {
    slug: "casa",
    name: "Casa",
    icon: "🏠",
    regionIds: ["sol", "techo", "pared", "puerta", "ventana1", "ventana2", "chimenea"],
    render: (fill, onPick) => (
      <svg viewBox="0 0 300 260" className="w-full">
        <circle
          cx="250"
          cy="45"
          r="28"
          fill={fill("sol")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("sol")}
          className="cursor-pointer"
        />
        <rect
          x="60"
          y="120"
          width="180"
          height="120"
          fill={fill("pared")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("pared")}
          className="cursor-pointer"
        />
        <polygon
          points="45,125 150,50 255,125"
          fill={fill("techo")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("techo")}
          className="cursor-pointer"
        />
        <rect
          x="205"
          y="65"
          width="20"
          height="45"
          fill={fill("chimenea")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("chimenea")}
          className="cursor-pointer"
        />
        <rect
          x="135"
          y="165"
          width="35"
          height="75"
          fill={fill("puerta")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("puerta")}
          className="cursor-pointer"
        />
        <rect
          x="80"
          y="150"
          width="35"
          height="35"
          fill={fill("ventana1")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("ventana1")}
          className="cursor-pointer"
        />
        <rect
          x="190"
          y="150"
          width="35"
          height="35"
          fill={fill("ventana2")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("ventana2")}
          className="cursor-pointer"
        />
      </svg>
    ),
  },
  {
    slug: "gato",
    name: "Gato",
    icon: "🐱",
    regionIds: ["oreja1", "oreja2", "cabeza", "cuerpo", "cola", "pata1", "pata2"],
    render: (fill, onPick) => (
      <svg viewBox="0 0 300 260" className="w-full">
        <ellipse
          cx="150"
          cy="180"
          rx="65"
          ry="55"
          fill={fill("cuerpo")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("cuerpo")}
          className="cursor-pointer"
        />
        <path
          d="M215,190 C260,180 270,140 250,110 C245,150 225,170 205,180 Z"
          fill={fill("cola")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("cola")}
          className="cursor-pointer"
        />
        <ellipse
          cx="115"
          cy="225"
          rx="16"
          ry="20"
          fill={fill("pata1")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("pata1")}
          className="cursor-pointer"
        />
        <ellipse
          cx="165"
          cy="225"
          rx="16"
          ry="20"
          fill={fill("pata2")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("pata2")}
          className="cursor-pointer"
        />
        <circle
          cx="120"
          cy="95"
          r="45"
          fill={fill("cabeza")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("cabeza")}
          className="cursor-pointer"
        />
        <polygon
          points="85,60 95,20 110,65"
          fill={fill("oreja1")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("oreja1")}
          className="cursor-pointer"
        />
        <polygon
          points="130,65 150,22 160,62"
          fill={fill("oreja2")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("oreja2")}
          className="cursor-pointer"
        />
        <circle cx="105" cy="95" r="5" fill="#1e293b" />
        <circle cx="138" cy="95" r="5" fill="#1e293b" />
        <path d="M112,112 Q120,118 128,112" fill="none" stroke="#1e293b" strokeWidth="3" />
      </svg>
    ),
  },
  {
    slug: "cohete",
    name: "Cohete",
    icon: "🚀",
    regionIds: ["punta", "cuerpo", "ventana", "aleta1", "aleta2", "llama"],
    render: (fill, onPick) => (
      <svg viewBox="0 0 300 260" className="w-full">
        <ellipse
          cx="150"
          cy="215"
          rx="30"
          ry="30"
          fill={fill("llama")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("llama")}
          className="cursor-pointer"
        />
        <polygon
          points="120,150 95,205 120,195"
          fill={fill("aleta1")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("aleta1")}
          className="cursor-pointer"
        />
        <polygon
          points="180,150 205,205 180,195"
          fill={fill("aleta2")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("aleta2")}
          className="cursor-pointer"
        />
        <rect
          x="115"
          y="90"
          width="70"
          height="110"
          rx="10"
          fill={fill("cuerpo")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("cuerpo")}
          className="cursor-pointer"
        />
        <path
          d="M115,90 Q150,20 185,90 Z"
          fill={fill("punta")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("punta")}
          className="cursor-pointer"
        />
        <circle
          cx="150"
          cy="115"
          r="20"
          fill={fill("ventana")}
          stroke="#1e293b"
          strokeWidth="3"
          onClick={() => onPick("ventana")}
          className="cursor-pointer"
        />
      </svg>
    ),
  },
];

export default function DibujosColorPage() {
  const supabase = createClient();
  const [drawingSlug, setDrawingSlug] = useState(DRAWINGS[0].slug);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  const drawing = useMemo(
    () => DRAWINGS.find((d) => d.slug === drawingSlug) ?? DRAWINGS[0],
    [drawingSlug]
  );

  function fillOf(id: string): string {
    return fills[`${drawingSlug}:${id}`] ?? BLANK;
  }

  function pick(id: string) {
    setFills((prev) => ({ ...prev, [`${drawingSlug}:${id}`]: color }));
  }

  function clearDrawing() {
    setFills((prev) => {
      const next = { ...prev };
      for (const id of drawing.regionIds) delete next[`${drawingSlug}:${id}`];
      return next;
    });
  }

  const filledCount = drawing.regionIds.filter(
    (id) => fills[`${drawingSlug}:${id}`] !== undefined
  ).length;

  async function finish() {
    const won = filledCount >= 3;
    const moves = Math.max(0, 40 - filledCount * 4);
    setSaving(true);
    const res = await finishGame(supabase, "dibujoscolor", won, moves);
    setResult(res);
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-400 via-fuchsia-500 to-purple-600 p-6">
      <div className="mx-auto max-w-lg">
        <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
          ← Juegos
        </Link>
        <h1 className="mt-3 text-center text-2xl font-bold text-white">Pizarra para Pintar 🎨</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Elige un color y toca el dibujo para pintarlo.
        </p>

        <div className="mt-4 flex justify-center gap-2">
          {DRAWINGS.map((d) => (
            <button
              key={d.slug}
              onClick={() => {
                setDrawingSlug(d.slug);
                setResult(null);
              }}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                d.slug === drawingSlug
                  ? "bg-white text-fuchsia-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {d.icon} {d.name}
            </button>
          ))}
        </div>

        <motion.div
          key={drawingSlug}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_PLAYFUL}
          className="mt-4 rounded-3xl bg-white p-4 shadow-lg"
        >
          {drawing.render(fillOf, pick)}
        </motion.div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`h-9 w-9 rounded-full border-4 transition ${
                color === c ? "border-white scale-110" : "border-white/30"
              }`}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={clearDrawing}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30"
            >
              🧹 Borrar
            </button>
            <motion.button
              onClick={finish}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_PLAYFUL}
              className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-fuchsia-700 shadow"
            >
              ✅ Listo, mostrar a la profe
            </motion.button>
          </div>

          <AnimatePresence>
            {saving && <p className="text-sm text-white/80">Calculando premio...</p>}
            {result && !saving && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING_PLAYFUL}
                className="rounded-2xl bg-white/15 px-5 py-3 text-center text-white backdrop-blur"
              >
                <p className="text-xl font-bold">
                  {result.diamonds_earned > 0
                    ? `+${result.diamonds_earned} 💎`
                    : filledCount < 3
                      ? "Pinta al menos 3 partes para ganar diamantes"
                      : "Ya llegaste al límite de hoy"}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  Partidas jugadas hoy: {result.plays_today}/{result.daily_cap}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

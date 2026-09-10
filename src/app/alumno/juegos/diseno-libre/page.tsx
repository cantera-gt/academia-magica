"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";

// Pizarra en blanco para dibujar libremente con el dedo/mouse (canvas 2D).
// Sin plantillas: el alumno diseña lo que quiera desde cero.

const PALETTE = [
  "#0f172a",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
];

const BRUSH_SIZES = [
  { label: "Fino", value: 3 },
  { label: "Medio", value: 8 },
  { label: "Grueso", value: 18 },
];

const CANVAS_W = 600;
const CANVAS_H = 450;

export default function DisenoLibrePage() {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [brush, setBrush] = useState(BRUSH_SIZES[1].value);
  const [erasing, setErasing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FinishGameResult | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
    setHasDrawn(true);
  }

  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const point = pointFromEvent(e);
    const last = lastPointRef.current ?? point;
    ctx.strokeStyle = erasing ? "#ffffff" : color;
    ctx.lineWidth = erasing ? brush * 2.5 : brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function endDraw() {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    setHasDrawn(false);
    setResult(null);
  }

  async function finish() {
    setSaving(true);
    const res = await finishGame(supabase, "disenolibre", hasDrawn, hasDrawn ? 8 : 40);
    setResult(res);
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-6">
      <div className="mx-auto max-w-lg">
        <Link href="/alumno/juegos" className="text-sm text-white/70 hover:text-white">
          ← Juegos
        </Link>
        <h1 className="mt-3 text-center text-2xl font-bold text-white">Pizarra Libre ✏️</h1>
        <p className="mt-1 text-center text-sm text-white/80">
          Dibuja lo que quieras desde cero, sin plantilla.
        </p>

        <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-lg">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="w-full touch-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setErasing(false);
              }}
              style={{ backgroundColor: c }}
              className={`h-8 w-8 rounded-full border-4 ${
                !erasing && color === c ? "border-white scale-110" : "border-white/30"
              } ${c === "#ffffff" ? "ring-1 ring-slate-300" : ""}`}
              aria-label={`Color ${c}`}
            />
          ))}
          <button
            onClick={() => setErasing((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              erasing ? "bg-white text-blue-700" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            🧼 Borrador
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.value}
              onClick={() => setBrush(b.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                brush === b.value ? "bg-white text-blue-700" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={clearCanvas}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30"
            >
              🗑️ Empezar de nuevo
            </button>
            <motion.button
              onClick={finish}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_PLAYFUL}
              className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-blue-700 shadow"
            >
              ✅ Terminé mi obra
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
                    : !hasDrawn
                      ? "Dibuja algo primero"
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

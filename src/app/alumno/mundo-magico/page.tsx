"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile } from "@/types/database";
import { SPRING_PLAYFUL, fadeOnly, staggerContainer, staggerItem } from "@/lib/motion";
import { finishGame, type FinishGameResult } from "@/lib/finish-game";
import { themeOf } from "@/lib/theme";
import DiamondCounter from "@/components/diamond-counter";
import HeroCanvas from "@/components/hero-canvas";
import {
  HEROES,
  HERO_ORDER,
  OUTFIT_ORDER,
  PALETTE,
  customCount,
  defaultDesign,
  mergeDesign,
  paintableLayers,
  type HeroDesign,
  type HeroId,
  type OutfitId,
} from "@/lib/heroes";

/**
 * Mundo Magico: el personaje del alumno.
 *
 * Hermano del garaje. Se elige personaje y vestuario, y se pinta cada prenda
 * tocandola en el propio muñeco o con los botones grandes de abajo.
 *
 * Si la migracion de hero_designs todavia no esta aplicada, la pagina funciona
 * igual y solo falla el guardado: se avisa y ya. Preferible a una pantalla en
 * blanco por un RPC que no existe.
 */

export default function MundoMagicoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [design, setDesign] = useState<HeroDesign>(defaultDesign(null));
  const [saved, setSaved] = useState<HeroDesign>(defaultDesign(null));
  const [piece, setPiece] = useState<string>("traje");
  const [loading, setLoading] = useState(true);
  const [posing, setPosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<FinishGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/alumno");
      return;
    }

    const { data: p } = await supabase.rpc("my_profile").maybeSingle();
    const prof = p as MyProfile | null;
    setProfile(prof);

    const { data: h } = await supabase.rpc("my_hero");
    const g = (h ?? {}) as { design?: unknown };
    const merged = mergeDesign(g.design, prof?.gender ?? null);
    setDesign(merged);
    setSaved(merged);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  const pieces = useMemo(
    () => paintableLayers(design.hero, design.outfit),
    [design.hero, design.outfit]
  );

  // Al cambiar de personaje o vestuario, la prenda elegida puede no existir.
  useEffect(() => {
    if (!pieces.some((p) => p.id === piece)) setPiece(pieces[0]?.id ?? "traje");
  }, [pieces, piece]);

  const base = useMemo(() => defaultDesign(profile?.gender ?? null), [profile?.gender]);
  const worked = useMemo(() => customCount(design, base), [design, base]);
  const dirty = useMemo(
    () => JSON.stringify(design) !== JSON.stringify(saved),
    [design, saved]
  );

  function paint(color: string) {
    setDesign((d) => ({ ...d, colors: { ...d.colors, [piece]: color } }));
    setReward(null);
  }

  function clearPiece() {
    setDesign((d) => {
      const colors = { ...d.colors };
      delete colors[piece];
      return { ...d, colors };
    });
    setReward(null);
  }

  function chooseHero(hero: HeroId) {
    setDesign((d) => (d.hero === hero ? d : { ...d, hero, colors: {} }));
    setReward(null);
  }

  function chooseOutfit(outfit: OutfitId) {
    setDesign((d) => (d.outfit === outfit ? d : { ...d, outfit, colors: {} }));
    setReward(null);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("save_hero_design", { p_design: design });
    if (e) {
      setError("No se ha podido guardar tu personaje. Puedes seguir jugando.");
      setSaving(false);
      return;
    }
    const stored = mergeDesign(data, profile?.gender ?? null);
    setDesign(stored);
    setSaved(stored);

    // Menos "movimientos" = mas diamantes. El suelo de 4 es el contrato de
    // finish_game: moves nunca puede ser 0, porque min(moves) es la marca
    // personal y un 0 seria imbatible para siempre.
    const moves = Math.max(4, 40 - worked * 4);
    const res = await finishGame(supabase, "mundo-magico", true, moves);
    setReward(res);
    if (res) setProfile((p) => (p ? { ...p, diamonds: res.total_diamonds } : p));
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Entrando en Mundo Mágico...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-slate-600">No hemos podido cargar tu perfil.</p>
          <Link href="/alumno/inicio" className="mt-3 inline-block text-purple-600 underline">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const theme = themeOf(profile.visual_theme);
  const spec = HEROES[design.hero];
  const pieceLabel = pieces.find((p) => p.id === piece)?.label ?? "Traje";

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header
        className={`flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r ${theme.headerGradient} px-6 py-6 text-white`}
      >
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Mundo Mágico ✨</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <DiamondCounter value={profile.diamonds} />
          </div>
          <Link
            href="/alumno/garaje"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Mi garaje 🚗
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {/* El personaje */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-100 to-purple-200 p-4 shadow-inner">
          <motion.div
            className="flex h-[360px] items-end justify-center sm:h-[440px]"
            animate={posing ? { y: [0, -18, 0, -9, 0] } : { y: 0 }}
            transition={posing ? { duration: 1.6, ease: "easeInOut" } : SPRING_PLAYFUL}
          >
            <HeroCanvas
              hero={design.hero}
              outfit={design.outfit}
              colors={design.colors}
              onPickPiece={setPiece}
              className="select-none drop-shadow-xl"
            />
          </motion.div>
          <p className="mt-1 text-center text-sm text-indigo-900/70">
            {design.nombre.trim()
              ? `${design.nombre.trim()} — toca una prenda para pintarla`
              : "Toca una prenda para pintarla"}
          </p>
        </div>

        {/* Elegir personaje */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Tu personaje
          </h2>
          <div className="flex flex-wrap gap-2">
            {HERO_ORDER.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => chooseHero(h)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold shadow transition ${
                  design.hero === h
                    ? "bg-purple-600 text-white"
                    : "bg-white text-slate-600 hover:bg-purple-50"
                }`}
              >
                {HEROES[h].emoji} {HEROES[h].label}
              </button>
            ))}
          </div>
        </section>

        {/* Vestuario */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Su ropa
          </h2>
          <div className="flex flex-wrap gap-2">
            {OUTFIT_ORDER.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => chooseOutfit(o)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold shadow transition ${
                  design.outfit === o
                    ? "bg-purple-600 text-white"
                    : "bg-white text-slate-600 hover:bg-purple-50"
                }`}
              >
                {spec.outfits[o].label}
              </button>
            ))}
          </div>
        </section>

        {/* Que pinto */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            ¿Qué pintas?
          </h2>
          <motion.div
            variants={staggerContainer(0.05)}
            initial="initial"
            animate="animate"
            className="flex flex-wrap gap-2"
          >
            {pieces.map((p) => (
              <motion.button
                key={p.id}
                variants={staggerItem}
                type="button"
                onClick={() => setPiece(p.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow transition ${
                  piece === p.id
                    ? "bg-purple-600 text-white"
                    : "bg-white text-slate-600 hover:bg-purple-50"
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
                <span
                  className="h-4 w-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: design.colors[p.id] ?? p.color }}
                />
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* Paleta */}
        <section className="mt-6 rounded-3xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Color de: {pieceLabel}
            </h2>
            {design.colors[piece] && (
              <button
                type="button"
                onClick={clearPiece}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
              >
                Color original
              </button>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => paint(c)}
                aria-label={`Pintar de ${c}`}
                className={`aspect-square rounded-xl border-4 transition ${
                  design.colors[piece] === c
                    ? "border-purple-600 scale-110"
                    : "border-white hover:scale-105"
                } shadow`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </section>

        {/* Nombre */}
        <section className="mt-6 rounded-3xl bg-white p-4 shadow">
          <label
            htmlFor="nombre"
            className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
          >
            El nombre de tu héroe
          </label>
          <input
            id="nombre"
            value={design.nombre}
            maxLength={14}
            onChange={(e) => {
              const v = e.target.value
                .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]/g, "")
                .slice(0, 14);
              setDesign((d) => ({ ...d, nombre: v }));
              setReward(null);
            }}
            placeholder="Capitán Diamante"
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-center text-xl font-black text-slate-700 outline-none focus:border-purple-400"
          />
        </section>

        {/* Acciones */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white shadow disabled:opacity-40"
          >
            {saving ? "Guardando..." : dirty ? "Guardar mi héroe 💎" : "Guardado"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPosing(true);
              window.setTimeout(() => setPosing(false), 1700);
            }}
            className="rounded-full bg-white px-6 py-3 font-bold text-slate-600 shadow hover:bg-slate-50"
          >
            ¡Pose de héroe! 💥
          </button>
          <span className="text-sm text-slate-500">
            {worked === 0
              ? "Vístelo a tu gusto y gana diamantes"
              : `${worked} ${worked === 1 ? "cambio" : "cambios"} en tu héroe`}
          </span>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <AnimatePresence>
          {reward && (
            <motion.div
              variants={fadeOnly}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-4 rounded-3xl bg-amber-50 p-4 text-center shadow"
            >
              <p className="text-lg font-bold text-amber-700">
                ¡Héroe guardado! +{reward.diamonds_earned} 💎
              </p>
              {reward.capped && (
                <p className="mt-1 text-sm text-amber-600">
                  Ya has ganado todos los diamantes de hoy en los juegos. Mañana más.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

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
import VehicleCanvas from "@/components/vehicle-canvas";
import {
  MODELS,
  MODEL_ORDER,
  PALETTE,
  customCount,
  defaultDesign,
  mergeDesign,
  paintableLayers,
  type VehicleDesign,
  type VehicleModel,
} from "@/lib/vehicle";

/**
 * El garaje: el coche del alumno, para pintarlo a su gusto.
 *
 * No se cambian piezas, se cambian COLORES. Las capas del coche vienen de un
 * render 3D despiezado, y solo traen lo que se veia en la imagen original, asi
 * que sustituir una rueda dejaria un agujero a la vista.
 *
 * Dos formas de elegir que se pinta, a proposito:
 *   1. tocando directamente la zona en el coche (lo divertido)
 *   2. con los botones grandes de abajo (lo que funciona con 4 años)
 * Las dos mueven el mismo estado.
 *
 * Pintar es gratis. Lo que da diamantes es guardar el coche, y paga mas cuanto
 * mas trabajado este.
 */

export default function GarajePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [design, setDesign] = useState<VehicleDesign>(defaultDesign(null));
  const [saved, setSaved] = useState<VehicleDesign>(defaultDesign(null));
  const [zone, setZone] = useState<string>("carroceria");
  const [loading, setLoading] = useState(true);
  const [driving, setDriving] = useState(false);
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

    const { data: garage } = await supabase.rpc("my_garage");
    const g = (garage ?? {}) as { design?: unknown };
    const merged = mergeDesign(g.design, prof?.gender ?? null);
    setDesign(merged);
    setSaved(merged);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  const zones = useMemo(() => paintableLayers(design.model), [design.model]);

  // Si al cambiar de coche la zona elegida no existe, vuelve a la carroceria.
  useEffect(() => {
    if (!zones.some((z) => z.id === zone)) setZone(zones[0]?.id ?? "carroceria");
  }, [zones, zone]);

  const base = useMemo(() => defaultDesign(profile?.gender ?? null), [profile?.gender]);
  const worked = useMemo(() => customCount(design, base), [design, base]);
  const dirty = useMemo(
    () => JSON.stringify(design) !== JSON.stringify(saved),
    [design, saved]
  );

  function paint(color: string) {
    setDesign((d) => ({ ...d, colors: { ...d.colors, [zone]: color } }));
    setReward(null);
  }

  function clearZone() {
    setDesign((d) => {
      const colors = { ...d.colors };
      delete colors[zone];
      return { ...d, colors };
    });
    setReward(null);
  }

  function chooseModel(model: VehicleModel) {
    setDesign((d) => (d.model === model ? d : { ...d, model, colors: {} }));
    setReward(null);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const { data, error: e } = await supabase.rpc("save_vehicle_design", { p_design: design });
    if (e) {
      setError("No se ha podido guardar el coche.");
      setSaving(false);
      return;
    }
    const stored = mergeDesign(data, profile?.gender ?? null);
    setDesign(stored);
    setSaved(stored);

    // Menos "movimientos" = mas diamantes, asi que un coche mas trabajado
    // premia mas. El suelo de 4 es el contrato de finish_game: moves nunca
    // puede ser 0, porque min(moves) es la marca personal y un 0 seria
    // imbatible para siempre.
    const moves = Math.max(4, 40 - worked * 5);
    const res = await finishGame(supabase, "garaje", true, moves);
    setReward(res);
    if (res) setProfile((p) => (p ? { ...p, diamonds: res.total_diamonds } : p));
    setSaving(false);
  }

  function drive() {
    setDriving(true);
    window.setTimeout(() => setDriving(false), 2600);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Abriendo el garaje...</p>
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
  const zoneLabel = zones.find((z) => z.id === zone)?.label ?? "Carrocería";

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header
        className={`flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r ${theme.headerGradient} px-6 py-6 text-white`}
      >
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Mi garaje 🔧</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <DiamondCounter value={profile.diamonds} />
          </div>
          <Link
            href="/alumno/cuarto"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Mi cuarto 🏠
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {/* El coche */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-slate-200 to-slate-300 p-4 shadow-inner">
          <motion.div
            animate={driving ? { x: [0, 26, -18, 0] } : { x: 0 }}
            transition={driving ? { duration: 2.4, ease: "easeInOut" } : SPRING_PLAYFUL}
          >
            <VehicleCanvas
              model={design.model}
              colors={design.colors}
              onPickZone={setZone}
              className="mx-auto max-w-xl select-none"
            />
          </motion.div>
          <p className="mt-1 text-center text-sm text-slate-600">
            Toca una parte del coche para pintarla
          </p>
        </div>

        {/* Elegir coche */}
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Tu coche
          </h2>
          <div className="flex flex-wrap gap-2">
            {MODEL_ORDER.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => chooseModel(m)}
                className={`rounded-2xl px-4 py-3 text-sm font-bold shadow transition ${
                  design.model === m
                    ? "bg-purple-600 text-white"
                    : "bg-white text-slate-600 hover:bg-purple-50"
                }`}
              >
                {MODELS[m].emoji} {MODELS[m].label}
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
            variants={staggerContainer(0.06)}
            initial="initial"
            animate="animate"
            className="flex flex-wrap gap-2"
          >
            {zones.map((z) => (
              <motion.button
                key={z.id}
                variants={staggerItem}
                type="button"
                onClick={() => setZone(z.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow transition ${
                  zone === z.id
                    ? "bg-purple-600 text-white"
                    : "bg-white text-slate-600 hover:bg-purple-50"
                }`}
              >
                <span>{z.emoji}</span>
                <span>{z.label}</span>
                {design.colors[z.id] && (
                  <span
                    className="h-4 w-4 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: design.colors[z.id] }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* Paleta */}
        <section className="mt-6 rounded-3xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Color de: {zoneLabel}
            </h2>
            {design.colors[zone] && (
              <button
                type="button"
                onClick={clearZone}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
              >
                Quitar pintura
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
                  design.colors[zone] === c
                    ? "border-purple-600 scale-110"
                    : "border-white hover:scale-105"
                } shadow`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </section>

        {/* Matricula */}
        <section className="mt-6 rounded-3xl bg-white p-4 shadow">
          <label
            htmlFor="matricula"
            className="mb-2 block text-sm font-bold uppercase tracking-wide text-slate-500"
          >
            Tu matrícula
          </label>
          <input
            id="matricula"
            value={design.matricula}
            maxLength={10}
            onChange={(e) => {
              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÑ ]/g, "").slice(0, 10);
              setDesign((d) => ({ ...d, matricula: v }));
              setReward(null);
            }}
            placeholder="MI COCHE"
            className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-center text-xl font-black tracking-widest text-slate-700 outline-none focus:border-purple-400"
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
            {saving ? "Guardando..." : dirty ? "Guardar mi coche 💎" : "Guardado"}
          </button>
          <button
            type="button"
            onClick={drive}
            className="rounded-full bg-white px-6 py-3 font-bold text-slate-600 shadow hover:bg-slate-50"
          >
            ¡A rodar! 🏁
          </button>
          <span className="text-sm text-slate-500">
            {worked === 0
              ? "Píntalo a tu gusto y gana diamantes"
              : `${worked} ${worked === 1 ? "cambio" : "cambios"} en tu coche`}
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
                ¡Coche guardado! +{reward.diamonds_earned} 💎
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

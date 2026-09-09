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
import VehicleSvg from "@/components/vehicle-svg";
import {
  PALETTE,
  REGION_LABEL,
  REGION_ORDER,
  SLOT_LABEL,
  SLOT_ORDER,
  VARIANTS,
  defaultDesign,
  isVariantAvailable,
  mergeDesign,
  ownedKey,
  type PaintRegion,
  type VehicleDesign,
  type VehicleSlot,
} from "@/lib/vehicle";

/**
 * El garaje: el coche del alumno, pintable pieza a pieza.
 *
 * Dos formas de elegir que se pinta, a proposito:
 *   1. tocando directamente la pieza en el coche (lo divertido)
 *   2. con los botones grandes de abajo (lo que funciona con 4 años)
 * Las dos mueven el mismo estado.
 *
 * Los colores son gratis. Las piezas de pago se compran aqui mismo con
 * purchase_store_item, sin tener que salir a la tienda.
 */

type GarageItem = {
  id: string;
  name: string;
  description: string | null;
  price_diamonds: number;
  vehicle_slot: string;
  vehicle_variant: string;
};

type Tab = "pintar" | "piezas";

export default function GarajePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [design, setDesign] = useState<VehicleDesign>(defaultDesign(null));
  const [saved, setSaved] = useState<VehicleDesign>(defaultDesign(null));
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pintar");
  const [region, setRegion] = useState<PaintRegion>("carroceria");
  const [driving, setDriving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<FinishGameResult | null>(null);
  const [buying, setBuying] = useState<GarageItem | null>(null);
  const [busy, setBusy] = useState(false);
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
    const g = (garage ?? {}) as { design?: unknown; owned?: string[] };
    const merged = mergeDesign(g.design, prof?.gender ?? null);
    setDesign(merged);
    setSaved(merged);
    setOwned(new Set(g.owned ?? []));

    if (prof?.gender) {
      const { data: si } = await supabase
        .from("store_items")
        .select("id, name, description, price_diamonds, vehicle_slot, vehicle_variant")
        .eq("zone", "garaje")
        .eq("gender", prof.gender)
        .eq("active", true);
      setItems(((si as unknown) as GarageItem[]) ?? []);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  const itemFor = useCallback(
    (slot: VehicleSlot, variant: string) =>
      items.find((i) => i.vehicle_slot === slot && i.vehicle_variant === variant) ?? null,
    [items]
  );

  const dirty = useMemo(
    () => JSON.stringify(design) !== JSON.stringify(saved),
    [design, saved]
  );

  /** Cuantas ranuras estan en algo distinto a lo de serie. Cuanto mas trabajado
   *  esta el coche, mas diamantes da al guardarlo. */
  const customCount = useMemo(() => {
    const base = defaultDesign(profile?.gender ?? null);
    let n = 0;
    for (const slot of SLOT_ORDER) if (design.parts[slot] !== base.parts[slot]) n++;
    for (const r of REGION_ORDER) if (design.colors[r] !== base.colors[r]) n++;
    if (design.matricula.trim()) n++;
    return n;
  }, [design, profile?.gender]);

  function paint(color: string) {
    setDesign((d) => ({ ...d, colors: { ...d.colors, [region]: color } }));
    setReward(null);
  }

  function chooseVariant(slot: VehicleSlot, variant: string) {
    setDesign((d) => ({ ...d, parts: { ...d.parts, [slot]: variant } }));
    setReward(null);
  }

  async function buy(item: GarageItem) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.rpc("purchase_store_item", { p_item_id: item.id });
    if (e) {
      setError("No se ha podido comprar. ¿Te faltan diamantes?");
    } else {
      setOwned((prev) => new Set(prev).add(ownedKey(item.vehicle_slot as VehicleSlot, item.vehicle_variant)));
      setProfile((p) => (p ? { ...p, diamonds: p.diamonds - item.price_diamonds } : p));
      chooseVariant(item.vehicle_slot as VehicleSlot, item.vehicle_variant);
      setBuying(null);
    }
    setBusy(false);
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

    // Menos "movimientos" = mas diamantes, asi que un coche mas trabajado premia mas.
    const moves = Math.max(0, 40 - customCount * 5);
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

  if (!profile?.gender) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-slate-600">Primero elige tu personaje.</p>
          <Link href="/alumno/inicio" className="mt-3 inline-block text-purple-600 underline">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const theme = themeOf(profile.visual_theme);

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
        {/* ------------------------- EL COCHE ------------------------- */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-200 to-slate-300 p-3 shadow-inner">
          <VehicleSvg
            design={design}
            selectedRegion={tab === "pintar" ? region : null}
            onSelectRegion={(r) => {
              setRegion(r);
              setTab("pintar");
            }}
            driving={driving}
          />
          <p className="pb-1 text-center text-xs font-semibold text-slate-500">
            Toca una parte del coche para pintarla
          </p>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <motion.button
            onClick={drive}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_PLAYFUL}
            className="rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-amber-950 shadow"
          >
            🏁 ¡Arrancar!
          </motion.button>
          <motion.button
            onClick={save}
            disabled={saving || !dirty}
            whileHover={{ scale: dirty ? 1.04 : 1 }}
            whileTap={{ scale: dirty ? 0.96 : 1 }}
            transition={SPRING_PLAYFUL}
            className={`rounded-2xl px-5 py-2.5 text-sm font-bold shadow transition ${
              dirty ? `${theme.accentSolid} text-white` : "bg-slate-200 text-slate-400"
            }`}
          >
            {saving ? "Guardando..." : dirty ? "💾 Guardar mi coche" : "✅ Guardado"}
          </motion.button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-center text-sm font-semibold text-rose-700"
            >
              {error}
            </motion.p>
          )}
          {reward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING_PLAYFUL}
              className="mt-3 rounded-2xl bg-white px-5 py-3 text-center shadow"
            >
              <p className="text-lg font-bold text-slate-800">
                {reward.diamonds_earned > 0
                  ? `¡Coche guardado! +${reward.diamonds_earned} 💎`
                  : "¡Coche guardado! Ya has llegado al premio máximo de hoy."}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Veces que has guardado hoy: {reward.plays_today}/{reward.daily_cap}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------- PESTAÑAS ------------------------- */}
        <div className="mt-5 flex gap-2">
          {(["pintar", "piezas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                tab === t ? `${theme.accentSolid} text-white shadow` : "bg-white text-slate-500 shadow-sm"
              }`}
            >
              {t === "pintar" ? "🎨 Pintar" : "🔧 Piezas"}
            </button>
          ))}
        </div>

        {/* ------------------------- PINTAR ------------------------- */}
        {tab === "pintar" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeOnly}
            className="mt-4 rounded-3xl bg-white p-4 shadow"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              ¿Qué parte pintas?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REGION_ORDER.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                    region === r
                      ? `${theme.accentSolid} text-white shadow`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{REGION_LABEL[r].emoji}</span>
                  {REGION_LABEL[r].label}
                  <span
                    className="ml-1 h-4 w-4 rounded-full border-2 border-white/70 shadow-inner"
                    style={{ backgroundColor: design.colors[r] }}
                  />
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Elige el color
            </p>
            <div className="mt-2 grid grid-cols-9 gap-2">
              {PALETTE.map((col) => (
                <motion.button
                  key={col}
                  onClick={() => paint(col)}
                  whileTap={{ scale: 0.88 }}
                  transition={SPRING_PLAYFUL}
                  style={{ backgroundColor: col }}
                  aria-label={`Pintar de ${col}`}
                  className={`aspect-square rounded-full border-4 transition ${
                    design.colors[region] === col
                      ? "border-slate-800 scale-110"
                      : "border-white shadow"
                  }`}
                />
              ))}
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Matrícula
            </p>
            <input
              value={design.matricula}
              onChange={(e) => {
                setDesign((d) => ({ ...d, matricula: e.target.value.toUpperCase().slice(0, 10) }));
                setReward(null);
              }}
              placeholder="TU NOMBRE"
              maxLength={10}
              className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-2.5 text-center text-lg font-bold tracking-widest text-slate-700 outline-none focus:border-slate-400"
            />
          </motion.div>
        )}

        {/* ------------------------- PIEZAS ------------------------- */}
        {tab === "piezas" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer(0.05)}
            className="mt-4 space-y-3"
          >
            {SLOT_ORDER.map((slot) => (
              <motion.div key={slot} variants={staggerItem} className="rounded-3xl bg-white p-4 shadow">
                <p className="text-sm font-bold text-slate-700">
                  {SLOT_LABEL[slot].emoji} {SLOT_LABEL[slot].label}
                </p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {VARIANTS[slot]
                    .filter((v) => !v.onlyFor || v.onlyFor === profile.gender)
                    .map((v) => {
                      const has = isVariantAvailable(slot, v, owned);
                      const active = design.parts[slot] === v.id;
                      const item = itemFor(slot, v.id);
                      return (
                        <motion.button
                          key={v.id}
                          whileTap={{ scale: 0.94 }}
                          transition={SPRING_PLAYFUL}
                          onClick={() => (has ? chooseVariant(slot, v.id) : item && setBuying(item))}
                          className={`flex min-w-[92px] shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center transition ${
                            active
                              ? `${theme.accentSolid} text-white shadow`
                              : has
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          <span className="text-2xl">{has ? v.emoji : "🔒"}</span>
                          <span className="text-[11px] font-bold leading-tight">{v.label}</span>
                          {!has && item && (
                            <span className="text-[11px] font-bold text-amber-600">
                              {item.price_diamonds} 💎
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ------------------------- COMPRAR PIEZA ------------------------- */}
      <AnimatePresence>
        {buying && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeOnly}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            onClick={() => !busy && setBuying(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_PLAYFUL}
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-4xl">🔒</p>
              <h3 className="mt-2 text-lg font-extrabold text-slate-800">{buying.name}</h3>
              {buying.description && (
                <p className="mt-1 text-sm text-slate-500">{buying.description}</p>
              )}
              <p className="mt-3 text-2xl font-bold text-amber-600">
                {buying.price_diamonds} 💎
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tienes {profile.diamonds} 💎
              </p>

              {profile.diamonds < buying.price_diamonds ? (
                <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Te faltan {buying.price_diamonds - profile.diamonds} 💎. Haz más ejercicios y
                  vuelve a por ella.
                </p>
              ) : (
                <motion.button
                  onClick={() => buy(buying)}
                  disabled={busy}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_PLAYFUL}
                  className={`mt-4 w-full rounded-2xl ${theme.accentSolid} px-5 py-3 font-bold text-white shadow`}
                >
                  {busy ? "Comprando..." : "Comprar y ponerla"}
                </motion.button>
              )}

              <button
                onClick={() => !busy && setBuying(null)}
                className="mt-2 w-full rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-500"
              >
                Ahora no
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, StoreItem, ItemCategory, ItemZone, Character } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";
import DiamondCounter from "@/components/diamond-counter";
import { resolveItemIcon } from "@/lib/store-icons";

const CATEGORY_ICON: Record<ItemCategory, string> = {
  decoracion: "🎀",
  mueble: "🛋️",
  mascota: "🐾",
  traje: "👗",
  accesorio: "✨",
  fondo: "🖼️",
  color_ropa: "🎨",
  extra: "📖",
  deporte: "⚽",
};

const ZONE_LABEL: Record<ItemZone, string> = {
  habitacion: "Habitación 🏠",
  estudio: "Zona de estudio 📚",
  jardin: "Jardín 🌳",
};

const ZONE_TABS: ItemZone[] = ["habitacion", "estudio", "jardin"];

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  decoracion: "Decoración",
  mueble: "Muebles",
  mascota: "Mascotas",
  traje: "Trajes",
  accesorio: "Accesorios",
  fondo: "Fondos",
  color_ropa: "Colores de ropa",
  extra: "Extras",
  deporte: "Deporte",
};

// Posicion (en % del ancho/alto del retrato del personaje) de cada accesorio
// 2D superpuesto. Se busca por el nombre del item porque hoy solo hay un
// puñado de accesorios con arte; si mas adelante hay muchos, esto puede
// pasar a una columna en la base de datos.
// Calibrado contra el retrato real (girl_7-10_1.webp / boy_7-10_1.webp): el
// personaje ocupa el 100% del alto del contenedor y el pelo arranca en el
// borde superior, por eso el top es negativo (el accesorio "flota" por
// encima del contenedor para quedar sobre la cabeza en vez de tapar la cara).
const ACCESSORY_OVERLAY: Record<string, { top: number; left: number; width: number }> = {
  "Gorro de Fiesta": { top: -21, left: 50, width: 30 },
  "Corona de Diamantes": { top: -11, left: 50, width: 34 },
};

export default function TiendaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [zone, setZone] = useState<ItemZone>("habitacion");
  const [items, setItems] = useState<StoreItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/alumno");
      return;
    }

    const { data: p } = await supabase.rpc("my_profile").maybeSingle();
    const myProfile = p as MyProfile | null;
    setProfile(myProfile);

    if (!myProfile?.gender) {
      setLoading(false);
      return;
    }

    if (myProfile.character_id) {
      const { data: charData } = await supabase
        .from("characters")
        .select("id, gender, display_name, image_url, thumbnail_url, age_min, age_max, sort_order")
        .eq("id", myProfile.character_id)
        .maybeSingle();
      setCharacter((charData as Character) ?? null);
    }

    const { data: storeData } = await supabase
      .from("store_items")
      .select(
        "id, gender, name, description, category, price_diamonds, image_url, sort_order, garment_slot, color_hex, model_url, bone_target, content_url, placement, zone"
      )
      .eq("gender", myProfile.gender)
      .eq("active", true)
      // El personaje ahora es una imagen 2D fija (decision 10/08/2026, ya no
      // hay personalizacion 3D de ropa enganchada a hueso) -> se sigue
      // ocultando "color_ropa" (pensado para el sistema 3D viejo).
      // "accesorio" SI se muestra: son PNG con transparencia que se
      // superponen sobre el retrato 2D (ver ACCESSORY_OVERLAY arriba).
      .neq("category", "color_ropa")
      .order("category")
      .order("sort_order");
    setItems((storeData as StoreItem[]) ?? []);

    const { data: invData } = await supabase
      .from("student_inventory")
      .select("item_id, equipped")
      .eq("student_id", user.id);
    setOwned(new Set((invData ?? []).map((r: { item_id: string }) => r.item_id)));
    setEquipped(
      new Set((invData ?? []).filter((r: { equipped: boolean }) => r.equipped).map((r: { item_id: string }) => r.item_id))
    );

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups: Record<string, StoreItem[]> = {};
    for (const item of items) {
      if (item.zone !== zone) continue;
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [items, zone]);

  async function buy(item: StoreItem) {
    if (buyingId) return;
    setErrorMsg(null);
    setBuyingId(item.id);

    const { data, error } = await supabase.rpc("purchase_store_item", {
      p_item_id: item.id,
    });

    if (error) {
      setErrorMsg(error.message.replace(/^.*: /, ""));
      setBuyingId(null);
      return;
    }

    const result = data as { success: boolean; remaining_diamonds: number };
    setProfile((prev) => (prev ? { ...prev, diamonds: result.remaining_diamonds } : prev));
    setOwned((prev) => new Set(prev).add(item.id));
    setJustBought(item.id);
    setTimeout(() => setJustBought(null), 1600);
    setBuyingId(null);
  }

  const EQUIPPABLE: ItemCategory[] = ["accesorio", "color_ropa"];

  async function toggleEquip(item: StoreItem) {
    if (equippingId) return;
    setErrorMsg(null);
    setEquippingId(item.id);
    const nextEquipped = !equipped.has(item.id);

    const { error } = await supabase.rpc("set_item_equipped", {
      p_item_id: item.id,
      p_equipped: nextEquipped,
    });

    if (error) {
      setErrorMsg(error.message.replace(/^.*: /, ""));
      setEquippingId(null);
      return;
    }

    setEquipped((prev) => {
      const next = new Set(prev);
      if (nextEquipped) {
        // Un color de ropa solo puede tener uno equipado por slot: desequipa
        // en el estado local cualquier otro color del mismo garment_slot.
        if (item.category === "color_ropa") {
          for (const other of items) {
            if (
              other.category === "color_ropa" &&
              other.garment_slot === item.garment_slot &&
              other.id !== item.id
            ) {
              next.delete(other.id);
            }
          }
        }
        next.add(item.id);
      } else {
        next.delete(item.id);
      }
      return next;
    });
    setEquippingId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Cargando...</p>
      </main>
    );
  }

  if (!profile?.gender) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-slate-600">Primero elegí tu personaje.</p>
          <Link href="/alumno/inicio" className="mt-3 inline-block text-purple-600 underline">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-6 text-white">
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Tienda ✨</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/alumno/cuarto"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Mi cuarto 🏠
          </Link>
          <DiamondCounter value={profile.diamonds} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        {character && (
          <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow sm:flex-row sm:items-end sm:justify-center">
            <div className="relative h-56 w-40 shrink-0 overflow-visible">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.image_url}
                alt={character.display_name}
                className="absolute bottom-0 left-1/2 h-full -translate-x-1/2 object-contain drop-shadow-lg"
              />
              {items
                .filter(
                  (item) =>
                    item.category === "accesorio" &&
                    equipped.has(item.id) &&
                    ACCESSORY_OVERLAY[item.name]
                )
                .map((item) => {
                  const pos = ACCESSORY_OVERLAY[item.name];
                  return (
                    <motion.img
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={SPRING_PLAYFUL}
                      src={item.image_url ?? undefined}
                      alt={item.name}
                      style={{
                        position: "absolute",
                        top: `${pos.top}%`,
                        // Framer Motion controla el transform del elemento
                        // (por la animacion de scale), asi que no podemos
                        // centrar con transform: translateX(-50%) porque lo
                        // pisa. Centramos restando la mitad del ancho en el
                        // left directamente.
                        left: `calc(${pos.left}% - ${pos.width / 2}%)`,
                        width: `${pos.width}%`,
                      }}
                      className="pointer-events-none drop-shadow"
                    />
                  );
                })}
            </div>
            <p className="text-center text-sm font-semibold text-slate-600 sm:text-left">
              ¡Así te queda, {profile.display_name}! Comprá accesorios ✨ y
              tocá &quot;Ponérselo&quot; para probarlos.
            </p>
          </div>
        )}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {ZONE_TABS.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                zone === z
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-500 shadow"
              }`}
            >
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.p
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {Object.keys(grouped).length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Todavía no hay items en esta zona para tu personaje.
          </p>
        )}

        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              {CATEGORY_ICON[category as ItemCategory]}{" "}
              {CATEGORY_LABEL[category as ItemCategory] ?? category}
            </h2>
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer(0.05)}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
              {catItems.map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = equipped.has(item.id);
                const canAfford = profile.diamonds >= item.price_diamonds;
                const isBuying = buyingId === item.id;
                const isEquipping = equippingId === item.id;
                const bought = justBought === item.id;
                const isEquippable = EQUIPPABLE.includes(item.category);

                return (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                    whileHover={!isOwned ? { y: -3 } : undefined}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow"
                  >
                    {item.category === "color_ropa" && item.color_hex ? (
                      <span
                        className="h-10 w-10 rounded-full border border-slate-200 shadow-inner"
                        style={{ backgroundColor: item.color_hex }}
                      />
                    ) : item.image_url ? (
                      <span className="relative block h-16 w-16 overflow-hidden rounded-xl bg-slate-50">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <span className="text-4xl">
                        {resolveItemIcon(item.name, CATEGORY_ICON[item.category])}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-xs text-slate-400">{item.description}</span>
                    )}

                    <AnimatePresence mode="wait">
                      {isOwned && isEquippable ? (
                        <motion.button
                          key="equip"
                          onClick={() => toggleEquip(item)}
                          disabled={isEquipping}
                          whileHover={{ scale: isEquipping ? 1 : 1.05 }}
                          whileTap={{ scale: isEquipping ? 1 : 0.95 }}
                          transition={SPRING_PLAYFUL}
                          className={`mt-1 w-full rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-60 ${
                            isEquipped
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isEquipping ? "..." : isEquipped ? "Puesto ✓" : "Ponérselo"}
                        </motion.button>
                      ) : isOwned ? (
                        <motion.span
                          key="owned"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                        >
                          {bought ? "¡Comprado! 🎉" : "Ya lo tenés ✓"}
                        </motion.span>
                      ) : (
                        <motion.button
                          key="buy"
                          onClick={() => buy(item)}
                          disabled={!canAfford || isBuying}
                          whileHover={{ scale: canAfford && !isBuying ? 1.05 : 1 }}
                          whileTap={{ scale: canAfford && !isBuying ? 0.95 : 1 }}
                          transition={SPRING_PLAYFUL}
                          className="mt-1 w-full rounded-lg bg-purple-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300"
                        >
                          {isBuying ? "..." : `💎 ${item.price_diamonds}`}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>
    </main>
  );
}

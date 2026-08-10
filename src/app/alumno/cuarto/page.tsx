"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, InventoryItem, ItemCategory } from "@/types/database";
import { staggerContainer, staggerItem, SPRING_PLAYFUL } from "@/lib/motion";

const CATEGORY_ICON: Record<ItemCategory, string> = {
  decoracion: "🎀",
  mueble: "🛋️",
  mascota: "🐾",
  traje: "👗",
  accesorio: "✨",
  fondo: "🖼️",
  color_ropa: "🎨",
  extra: "📖",
};

const ROOM_BG: Record<string, string> = {
  girl: "from-pink-300 via-fuchsia-200 to-purple-200",
  boy: "from-sky-300 via-cyan-200 to-blue-200",
};

export default function CuartoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/alumno");
      return;
    }

    const { data: p } = await supabase.rpc("my_profile").maybeSingle();
    setProfile(p as MyProfile | null);

    const { data } = await supabase
      .from("student_inventory")
      .select(
        "id, item_id, placed_in_room, position, store_items(id, gender, name, description, category, price_diamonds, image_url, sort_order)"
      )
      .eq("student_id", user.id);

    setInventory(((data as unknown) as InventoryItem[]) ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePlacement(inv: InventoryItem) {
    if (busyId) return;
    setBusyId(inv.id);
    const newState = !inv.placed_in_room;

    setInventory((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, placed_in_room: newState } : i))
    );

    const { error } = await supabase
      .from("student_inventory")
      .update({ placed_in_room: newState })
      .eq("id", inv.id);

    if (error) {
      setInventory((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, placed_in_room: !newState } : i))
      );
    }
    setBusyId(null);
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

  const placed = inventory.filter((i) => i.placed_in_room);
  const available = inventory.filter((i) => !i.placed_in_room);
  const bgGradient = ROOM_BG[profile.gender] ?? ROOM_BG.girl;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-white">
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            Cuarto de {profile.display_name} 🏠
          </h1>
        </div>
        <Link
          href="/alumno/tienda"
          className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
        >
          Ir a la tienda ✨
        </Link>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <LayoutGroup>
          {/* La habitacion */}
          <div
            className={`min-h-[280px] rounded-3xl bg-gradient-to-br ${bgGradient} p-6 shadow-inner`}
          >
            {placed.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-slate-500">
                <p className="text-5xl">🪄</p>
                <p className="mt-2 font-medium">
                  Tu cuarto está vacío. Elegí items de abajo para decorarlo.
                </p>
              </div>
            ) : (
              <motion.div
                layout
                className="flex flex-wrap gap-4"
              >
                <AnimatePresence>
                  {placed.map((inv) => (
                    <motion.button
                      key={inv.id}
                      layout
                      layoutId={inv.id}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={SPRING_PLAYFUL}
                      onClick={() => togglePlacement(inv)}
                      whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
                      className="flex w-24 flex-col items-center gap-1 rounded-2xl bg-white/70 p-3 text-center shadow backdrop-blur"
                      title="Quitar del cuarto"
                    >
                      <span className="text-4xl">
                        {CATEGORY_ICON[inv.store_items.category]}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {inv.store_items.name}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Inventario disponible */}
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Tu inventario
            </h2>
            {available.length === 0 ? (
              <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow">
                {inventory.length === 0
                  ? "Todavía no compraste nada. Andá a la tienda a gastar tus diamantes."
                  : "Ya colocaste todo lo que tenés en tu cuarto."}
              </p>
            ) : (
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer(0.05)}
                className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
              >
                <AnimatePresence>
                  {available.map((inv) => (
                    <motion.button
                      key={inv.id}
                      layout
                      layoutId={inv.id}
                      variants={staggerItem}
                      exit={{ opacity: 0, scale: 0.6 }}
                      onClick={() => togglePlacement(inv)}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING_PLAYFUL}
                      className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center shadow"
                      title="Colocar en el cuarto"
                    >
                      <span className="text-3xl">
                        {CATEGORY_ICON[inv.store_items.category]}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {inv.store_items.name}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </LayoutGroup>
      </div>
    </main>
  );
}

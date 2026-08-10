"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, StoreItem, ItemCategory } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";
import DiamondCounter from "@/components/diamond-counter";

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

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  decoracion: "Decoración",
  mueble: "Muebles",
  mascota: "Mascotas",
  traje: "Trajes",
  accesorio: "Accesorios",
  fondo: "Fondos",
  color_ropa: "Colores de ropa",
  extra: "Extras",
};

export default function TiendaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
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

    const { data: storeData } = await supabase
      .from("store_items")
      .select("id, gender, name, description, category, price_diamonds, image_url, sort_order")
      .eq("gender", myProfile.gender)
      .eq("active", true)
      .order("category")
      .order("sort_order");
    setItems((storeData as StoreItem[]) ?? []);

    const { data: invData } = await supabase
      .from("student_inventory")
      .select("item_id")
      .eq("student_id", user.id);
    setOwned(new Set((invData ?? []).map((r: { item_id: string }) => r.item_id)));

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups: Record<string, StoreItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

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

        {items.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Todavía no hay items en la tienda para tu personaje.
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
                const canAfford = profile.diamonds >= item.price_diamonds;
                const isBuying = buyingId === item.id;
                const bought = justBought === item.id;

                return (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                    whileHover={!isOwned ? { y: -3 } : undefined}
                    className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow"
                  >
                    <span className="text-4xl">{CATEGORY_ICON[item.category]}</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-xs text-slate-400">{item.description}</span>
                    )}

                    <AnimatePresence mode="wait">
                      {isOwned ? (
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

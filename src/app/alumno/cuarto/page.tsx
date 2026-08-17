"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, InventoryItem, ItemCategory, ItemZone } from "@/types/database";
import { staggerContainer, staggerItem, SPRING_PLAYFUL } from "@/lib/motion";
import { resolveItemIcon } from "@/lib/store-icons";
import RoomScene from "@/components/room-scene";
import DiamondCounter from "@/components/diamond-counter";
import ThemePicker from "@/components/theme-picker";
import { themeOf } from "@/lib/theme";

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

// Solo estas categorias se "colocan" en el cuarto (muebles, mascotas, decoracion,
// deporte). La ropa/accesorios se equipan en el personaje desde la tienda, y los
// "extra" (libros, stickers, diploma) se leen en la biblioteca, no se colocan.
const PLACEABLE_CATEGORIES: ItemCategory[] = ["decoracion", "mueble", "mascota", "deporte"];

const ITEM_SIZE = 76; // px, tamano fijo de cada item colocado en el cuarto

type DraftEntry = {
  placed: boolean;
  x: number; // 0-100, centro del item como % del ancho del cuarto
  y: number; // 0-100, centro del item como % del alto del cuarto
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function CuartoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState<ItemZone>("habitacion");
  const [reading, setReading] = useState<InventoryItem | null>(null);
  const [draft, setDraft] = useState<Record<string, DraftEntry>>({});
  const [saving, setSaving] = useState(false);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [confirmSell, setConfirmSell] = useState<InventoryItem | null>(null);
  const [roomSize, setRoomSize] = useState({ w: 0, h: 0 });
  const roomRef = useRef<HTMLDivElement | null>(null);

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
        "id, item_id, placed_in_room, position, store_items(id, gender, name, description, category, price_diamonds, image_url, sort_order, zone)"
      )
      .eq("student_id", user.id);

    setInventory(((data as unknown) as InventoryItem[]) ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Mide el tamano real del cuarto para poder convertir % <-> pixeles al arrastrar.
  // Depende tambien de "loading": el div del cuarto recien existe en el DOM
  // cuando loading pasa a false, asi que sin esta dependencia el efecto podia
  // correr una sola vez con roomRef.current todavia en null (primera carga) y
  // nunca mas volver a medir -> los items colocados quedaban invisibles hasta
  // que el usuario cambiaba de pestana de zona.
  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const measure = () => setRoomSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [zone, loading]);

  const zoneInventory = useMemo(
    () =>
      inventory.filter(
        (i) => i.store_items.zone === zone && PLACEABLE_CATEGORIES.includes(i.store_items.category)
      ),
    [inventory, zone]
  );

  const extras = useMemo(
    () => inventory.filter((i) => i.store_items.zone === zone && i.store_items.category === "extra"),
    [inventory, zone]
  );

  // Reconstruye el borrador cada vez que cambia la zona (o se recarga el inventario)
  useEffect(() => {
    const next: Record<string, DraftEntry> = {};
    let placedCount = 0;
    zoneInventory.forEach((inv) => {
      const hasPos = inv.position && typeof inv.position.x === "number";
      let x = hasPos ? inv.position!.x : 30 + (placedCount % 4) * 18;
      let y = hasPos ? inv.position!.y : 35 + Math.floor((placedCount % 8) / 4) * 28;
      if (inv.placed_in_room) placedCount++;
      next[inv.id] = { placed: inv.placed_in_room, x: clamp(x, 6, 94), y: clamp(y, 10, 90) };
    });
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, inventory]);

  const dirty = useMemo(() => {
    return zoneInventory.some((inv) => {
      const d = draft[inv.id];
      if (!d) return false;
      const origX = inv.position?.x ?? d.x;
      const origY = inv.position?.y ?? d.y;
      return (
        d.placed !== inv.placed_in_room ||
        (d.placed && (Math.round(d.x) !== Math.round(origX) || Math.round(d.y) !== Math.round(origY)))
      );
    });
  }, [draft, zoneInventory]);

  function placeItem(invId: string) {
    setDraft((prev) => {
      const placedCount = Object.values(prev).filter((d) => d.placed).length;
      const existing = prev[invId];
      return {
        ...prev,
        [invId]: {
          placed: true,
          x: existing?.placed ? existing.x : clamp(25 + (placedCount % 4) * 18, 6, 94),
          y: existing?.placed ? existing.y : clamp(30 + Math.floor((placedCount % 8) / 4) * 28, 10, 90),
        },
      };
    });
  }

  // Coloca el item en un punto exacto (x,y en % del cuarto) — se usa cuando lo
  // sueltan arrastrando desde la biblioteca.
  function placeItemAt(invId: string, x: number, y: number) {
    setDraft((prev) => ({ ...prev, [invId]: { placed: true, x: clamp(x, 6, 94), y: clamp(y, 10, 90) } }));
  }

  // true si el punto (viewport) cayo dentro del lienzo del cuarto
  function pointInRoom(point: { x: number; y: number }) {
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }

  function roomRelativePercent(point: { x: number; y: number }) {
    const rect = roomRef.current!.getBoundingClientRect();
    return {
      x: clamp(((point.x - rect.left) / rect.width) * 100, 6, 94),
      y: clamp(((point.y - rect.top) / rect.height) * 100, 10, 90),
    };
  }

  function unplaceItem(invId: string) {
    setDraft((prev) => ({ ...prev, [invId]: { ...prev[invId], placed: false } }));
  }

  function returnAllToLibrary() {
    setDraft((prev) => {
      const next: Record<string, DraftEntry> = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], placed: false };
      }
      return next;
    });
  }

  // Reposiciona un item que YA esta en el cuarto. Si lo sueltan fuera del
  // lienzo, se interpreta como "sacarlo" y vuelve a la biblioteca.
  function handleDragEnd(invId: string, info: { point: { x: number; y: number } }) {
    const rect = roomRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    if (!pointInRoom(info.point)) {
      unplaceItem(invId);
      return;
    }
    const { x, y } = roomRelativePercent(info.point);
    setDraft((prev) => ({ ...prev, [invId]: { ...prev[invId], x, y } }));
  }

  // Se llama cuando sueltan un item ARRASTRADO desde la biblioteca.
  function handleLibraryDrop(invId: string, info: { point: { x: number; y: number } }) {
    if (!pointInRoom(info.point)) return; // lo soltaron afuera: no hace nada, la tarjeta vuelve sola
    const { x, y } = roomRelativePercent(info.point);
    placeItemAt(invId, x, y);
  }

  async function saveDraft() {
    if (saving) return;
    setSaving(true);
    const updates = zoneInventory
      .filter((inv) => {
        const d = draft[inv.id];
        if (!d) return false;
        const origX = inv.position?.x ?? d.x;
        const origY = inv.position?.y ?? d.y;
        return (
          d.placed !== inv.placed_in_room ||
          (d.placed && (Math.round(d.x) !== Math.round(origX) || Math.round(d.y) !== Math.round(origY)))
        );
      })
      .map((inv) => {
        const d = draft[inv.id];
        return supabase
          .from("student_inventory")
          .update({
            placed_in_room: d.placed,
            position: d.placed ? { x: Math.round(d.x), y: Math.round(d.y) } : inv.position,
          })
          .eq("id", inv.id);
      });

    await Promise.all(updates);
    await load();
    setSaving(false);
  }

  async function confirmAndSell(inv: InventoryItem) {
    if (sellingId) return;
    setSellingId(inv.id);
    const { error } = await supabase.rpc("sell_store_item", { p_item_id: inv.item_id });
    if (!error) {
      setInventory((prev) => prev.filter((i) => i.id !== inv.id));
      await load();
    }
    setSellingId(null);
    setConfirmSell(null);
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

  const placedIds = zoneInventory.filter((inv) => draft[inv.id]?.placed).map((inv) => inv.id);
  const libraryItems = zoneInventory.filter((inv) => !draft[inv.id]?.placed);
  const anyPlaced = placedIds.length > 0;

  const theme = themeOf(profile.visual_theme);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className={`flex items-center justify-between bg-gradient-to-r ${theme.headerGradient} px-6 py-6 text-white`}>
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">
            Cuarto de {profile.display_name} 🏠
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemePicker
            current={profile.visual_theme}
            onChange={(t) => setProfile((p) => (p ? { ...p, visual_theme: t } : p))}
          />
          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <DiamondCounter value={profile.diamonds} />
          </div>
          <Link
            href="/alumno/tienda"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Ir a la tienda ✨
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {ZONE_TABS.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                zone === z ? "bg-indigo-600 text-white" : "bg-white text-slate-500 shadow"
              }`}
            >
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>

        {/* La habitacion: lienzo donde se arrastran los items */}
        <div
          ref={roomRef}
          className="relative min-h-[320px] overflow-hidden rounded-3xl shadow-inner sm:min-h-[380px]"
        >
          <RoomScene zone={zone} gender={profile.gender} />
          <div className="absolute inset-0 rounded-3xl bg-white/5" />

          {!anyPlaced && (
            <div className="relative flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <p className="text-5xl drop-shadow">🪄</p>
              <p className="mt-2 rounded-full bg-white/85 px-4 py-1 font-medium text-slate-600 shadow">
                Arrastrá items de tu biblioteca acá abajo para decorar
              </p>
            </div>
          )}

          {roomSize.w > 0 && (
            <AnimatePresence>
              {zoneInventory
                .filter((inv) => draft[inv.id]?.placed)
                .map((inv) => {
                  const d = draft[inv.id];
                  if (!d) return null;
                  const px = (d.x / 100) * roomSize.w - ITEM_SIZE / 2;
                  const py = (d.y / 100) * roomSize.h - ITEM_SIZE / 2;
                  return (
                    <motion.div
                      key={inv.id}
                      drag
                      dragConstraints={roomRef}
                      dragMomentum={false}
                      dragElastic={0}
                      initial={{ opacity: 0, scale: 0.4, x: px, y: py }}
                      animate={{ opacity: 1, scale: 1, x: px, y: py }}
                      exit={{ opacity: 0, scale: 0.4 }}
                      transition={SPRING_PLAYFUL}
                      onDragEnd={(_e, info) => handleDragEnd(inv.id, info)}
                      whileDrag={{ scale: 1.12, zIndex: 30, cursor: "grabbing" }}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: ITEM_SIZE,
                      height: ITEM_SIZE,
                      touchAction: "none",
                    }}
                    className="group flex cursor-grab flex-col items-center justify-center rounded-2xl bg-white/90 p-1.5 shadow-lg backdrop-blur"
                    title={inv.store_items.name}
                  >
                    <button
                      onClick={() => unplaceItem(inv.id)}
                      className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                      title="Quitar del cuarto"
                    >
                      ✕
                    </button>
                    {inv.store_items.image_url ? (
                      <span className="relative block h-11 w-11 overflow-hidden rounded-lg">
                        <Image
                          src={inv.store_items.image_url}
                          alt={inv.store_items.name}
                          fill
                          sizes="44px"
                          draggable={false}
                          className="pointer-events-none object-contain"
                        />
                      </span>
                    ) : (
                      <span className="pointer-events-none select-none text-3xl">
                        {resolveItemIcon(inv.store_items.name, CATEGORY_ICON[inv.store_items.category])}
                      </span>
                    )}
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>

        {/* Barra de acciones del cuarto */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={saveDraft}
            disabled={!dirty || saving}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Guardando..." : "💾 Guardar cuarto"}
          </button>
          <button
            onClick={returnAllToLibrary}
            disabled={!anyPlaced}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            📦 Enviar todo a la biblioteca
          </button>
          {dirty && (
            <span className="text-xs font-semibold text-amber-600">
              Tenés cambios sin guardar
            </span>
          )}
        </div>

        <LayoutGroup>
          {/* Biblioteca de objetos conseguidos */}
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-800">Tu biblioteca de objetos</h2>
            {zoneInventory.length === 0 ? (
              <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow">
                Todavía no compraste nada para esta zona. Andá a la tienda a gastar tus diamantes.
              </p>
            ) : libraryItems.length === 0 ? (
              <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow">
                Ya colocaste todo lo que tenés para esta zona.
              </p>
            ) : (
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer(0.05)}
                className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
              >
                <AnimatePresence>
                  {libraryItems.map((inv) => {
                    const refund = Math.floor(inv.store_items.price_diamonds * 0.8);
                    return (
                      <motion.div
                        key={inv.id}
                        variants={staggerItem}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center shadow"
                      >
                        <motion.div
                          role="button"
                          tabIndex={0}
                          onClick={() => placeItem(inv.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") placeItem(inv.id);
                          }}
                          drag
                          dragSnapToOrigin
                          dragConstraints={false}
                          dragElastic={0.15}
                          onDragEnd={(_e, info) => handleLibraryDrop(inv.id, info)}
                          whileHover={{ scale: 1.06, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          whileDrag={{ scale: 1.15, zIndex: 50, cursor: "grabbing", boxShadow: "0 12px 24px rgba(0,0,0,0.25)" }}
                          transition={SPRING_PLAYFUL}
                          style={{ touchAction: "none" }}
                          title="Arrastrá al cuarto, o tocá para colocarlo"
                          className="flex cursor-grab flex-col items-center gap-1"
                        >
                          {inv.store_items.image_url ? (
                            <span className="relative block h-10 w-10 overflow-hidden rounded-lg bg-slate-50">
                              <Image
                                src={inv.store_items.image_url}
                                alt={inv.store_items.name}
                                fill
                                sizes="40px"
                                className="object-contain"
                              />
                            </span>
                          ) : (
                            <span className="text-3xl">
                              {resolveItemIcon(inv.store_items.name, CATEGORY_ICON[inv.store_items.category])}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-600">
                            {inv.store_items.name}
                          </span>
                        </motion.div>
                        <button
                          onClick={() => setConfirmSell(inv)}
                          className="mt-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                          title={`Vender por ${refund} diamantes`}
                        >
                          💰 Vender (+{refund})
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Biblioteca: libros, stickers y diplomas — se leen, no se colocan */}
          {extras.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-bold text-slate-800">Tu biblioteca de lectura 📚</h2>
              <motion.div
                initial="initial"
                animate="animate"
                variants={staggerContainer(0.05)}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                {extras.map((inv) => (
                  <motion.button
                    key={inv.id}
                    variants={staggerItem}
                    onClick={() => setReading(inv)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING_PLAYFUL}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center shadow"
                    title="Leer"
                  >
                    <span className="text-3xl">📖</span>
                    <span className="text-xs font-medium text-slate-600">{inv.store_items.name}</span>
                    <span className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Leer
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}
        </LayoutGroup>
      </div>

      <AnimatePresence>
        {reading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            onClick={() => setReading(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={SPRING_PLAYFUL}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-amber-50 p-6 shadow-xl"
            >
              <h3 className="mb-3 text-lg font-bold text-slate-800">{reading.store_items.name}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {(reading.store_items.content_url ?? "").replaceAll("{name}", profile.display_name)}
              </p>
              <button
                onClick={() => setReading(null)}
                className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmar venta */}
      <AnimatePresence>
        {confirmSell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            onClick={() => (sellingId ? null : setConfirmSell(null))}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={SPRING_PLAYFUL}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
            >
              <p className="text-4xl">💰</p>
              <h3 className="mt-2 text-lg font-bold text-slate-800">
                ¿Vender &quot;{confirmSell.store_items.name}&quot;?
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Vas a recibir{" "}
                <strong>{Math.floor(confirmSell.store_items.price_diamonds * 0.8)} 💎</strong> (perdés
                un 20% del precio original de {confirmSell.store_items.price_diamonds} 💎). Esta acción
                no se puede deshacer.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmSell(null)}
                  disabled={!!sellingId}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmAndSell(confirmSell)}
                  disabled={!!sellingId}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {sellingId ? "Vendiendo..." : "Sí, vender"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile } from "@/types/database";
import { SPRING_PLAYFUL, staggerContainer, staggerItem } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";
import { themeOf } from "@/lib/theme";
import DiamondCounter from "@/components/diamond-counter";

/**
 * La zona de entretenimiento: una sola puerta para las cuatro cosas que el
 * alumno hace cuando no esta estudiando.
 *
 * Antes eran cuatro botones sueltos en la barra del inicio, que ademas convivian
 * con la tienda y el panel de padres: seis destinos en una fila, demasiado para
 * un nino de cuatro anos. Aqui se agrupan en cuatro tarjetas grandes.
 *
 * Recibe un profesor, que da la bienvenida y explica que hay en cada sitio. No
 * es un profesor al azar en cada visita: sale del id del alumno, asi que a cada
 * nino le recibe siempre el mismo y se convierte en "su" profesor de la zona de
 * juegos. Se le puede escuchar con su propia voz, la misma que usa en clase.
 */

type Teacher = {
  id: string;
  name: string;
  flag_emoji: string | null;
  body_image_url: string | null;
  voice_name: string;
};

const ZONAS = [
  {
    href: "/alumno/cuarto",
    titulo: "Mi cuarto",
    emoji: "🏠",
    texto: "Decora tu habitación con lo que compras en la tienda",
    color: "from-amber-400 to-orange-500",
  },
  {
    href: "/alumno/juegos",
    titulo: "El recreo",
    emoji: "🎮",
    texto: "Diez juegos, y cada partida te da diamantes",
    color: "from-emerald-400 to-teal-500",
  },
  {
    href: "/alumno/garaje",
    titulo: "Mi garaje",
    emoji: "🚗",
    texto: "Elige tu coche y píntalo a tu gusto",
    color: "from-sky-400 to-blue-600",
  },
  {
    href: "/alumno/mundo-magico",
    titulo: "Mundo Mágico",
    emoji: "✨",
    texto: "Elige tu héroe, cámbiale la ropa y los colores",
    color: "from-fuchsia-400 to-purple-600",
  },
];

/** Numero estable a partir del id: el mismo alumno, el mismo profesor. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export default function EntretenimientoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

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

    // Solo profesores que hablan espanol: el texto de bienvenida va en espanol,
    // y James da clase en ingles.
    const { data: ts } = await supabase
      .from("teachers")
      .select("id, name, flag_emoji, body_image_url, voice_name, speak_lang, sort_order")
      .eq("active", true)
      .like("speak_lang", "es%")
      .order("sort_order");

    const lista = ((ts as (Teacher & { speak_lang: string })[]) ?? []).filter(
      (t) => t.body_image_url
    );
    if (lista.length > 0) {
      setTeacher(lista[hashId(user.id) % lista.length]);
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    load();
    return () => stopSpeaking();
  }, [load]);

  const bienvenida = useMemo(() => {
    const nombre = profile?.display_name ?? "";
    const quien = teacher?.name ?? "";
    return (
      `¡Hola${nombre ? ", " + nombre : ""}! Soy ${quien}. ` +
      `Esta es la zona de entretenimiento: aquí vienes a jugar cuando terminas de estudiar. ` +
      `En Mi cuarto decoras tu habitación con lo que compras en la tienda. ` +
      `En el recreo hay diez juegos, y cada partida te da diamantes. ` +
      `En Mi garaje eliges tu coche y lo pintas como quieras. ` +
      `Y en Mundo Mágico eliges tu héroe, le cambias la ropa y los colores. ` +
      `Elige lo que más te apetezca. ¡A pasarlo bien!`
    );
  }, [profile?.display_name, teacher?.name]);

  function escuchar() {
    if (!teacher) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speakText(
      bienvenida,
      teacher.voice_name,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Abriendo la zona de juegos...</p>
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

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <header
        className={`flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r ${theme.headerGradient} px-6 py-6 text-white`}
      >
        <div>
          <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
            ← Mi inicio
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Entretenimiento 🎉</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <DiamondCounter value={profile.diamonds} />
          </div>
          <Link
            href="/alumno/tienda"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Tienda ✨
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        {/* La bienvenida del profesor */}
        {teacher && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_PLAYFUL}
            className="mb-8 flex items-end gap-3 sm:gap-5"
          >
            <div className="relative h-32 w-24 shrink-0 sm:h-44 sm:w-32">
              <Image
                src={teacher.body_image_url as string}
                alt={teacher.name}
                fill
                sizes="128px"
                className="object-contain object-bottom drop-shadow-lg"
                priority
              />
            </div>
            <div className="relative flex-1 rounded-3xl rounded-bl-md bg-white p-4 shadow-lg sm:p-5">
              <p className="mb-1 text-sm font-bold text-purple-600">
                {teacher.name} {teacher.flag_emoji}
              </p>
              <p className="text-slate-700">{bienvenida}</p>
              <button
                type="button"
                onClick={escuchar}
                className="mt-3 rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-200"
              >
                {speaking ? "⏹ Parar" : "🔊 Escúchame"}
              </button>
            </div>
          </motion.section>
        )}

        {/* Las cuatro zonas */}
        <motion.div
          variants={staggerContainer(0.07)}
          initial="initial"
          animate="animate"
          className="grid gap-4 sm:grid-cols-2"
        >
          {ZONAS.map((z) => (
            <motion.div key={z.href} variants={staggerItem}>
              <Link
                href={z.href}
                className={`flex h-full items-center gap-4 rounded-3xl bg-gradient-to-br ${z.color} p-5 text-white shadow-lg transition hover:brightness-110`}
              >
                <span className="text-5xl drop-shadow" aria-hidden>
                  {z.emoji}
                </span>
                <span>
                  <span className="block text-xl font-black">{z.titulo}</span>
                  <span className="block text-sm text-white/90">{z.texto}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

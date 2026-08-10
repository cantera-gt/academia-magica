"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, Subject, Character, CharacterGender } from "@/types/database";
import type { AccessoryAttachment } from "@/components/character-viewer";
import {
  staggerContainer,
  staggerItem,
  SPRING_PLAYFUL,
} from "@/lib/motion";
import DiamondCounter from "@/components/diamond-counter";
import CharacterViewer from "@/components/character-viewer";

export default function AlumnoInicioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [equippedAccessories, setEquippedAccessories] = useState<AccessoryAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/alumno");
        return;
      }

      const { data: p } = await supabase.rpc("my_profile").maybeSingle();
      setProfile(p as MyProfile);

      const { data: subs } = await supabase.rpc("assigned_subjects", {
        p_student_id: user.id,
      });
      setSubjects((subs as Subject[]) ?? []);

      const { data: chars } = await supabase
        .from("characters")
        .select("*")
        .order("sort_order");
      setCharacters((chars as Character[]) ?? []);

      const { data: equipped } = await supabase
        .from("student_inventory")
        .select("store_items(model_url, bone_target)")
        .eq("student_id", user.id)
        .eq("equipped", true);

      type EquippedRow = { store_items: { model_url: string | null; bone_target: string | null } | { model_url: string | null; bone_target: string | null }[] | null };
      const accessories = ((equipped as unknown as EquippedRow[]) ?? [])
        .map((row) => (Array.isArray(row.store_items) ? row.store_items[0] : row.store_items))
        .filter((si): si is { model_url: string; bone_target: string } => !!si?.model_url && !!si?.bone_target)
        .map((si) => ({ modelUrl: si.model_url, boneTarget: si.bone_target }));
      setEquippedAccessories(accessories);

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function chooseGender(g: CharacterGender) {
    setSaving(true);
    await supabase.from("profiles").update({ gender: g }).eq("id", profile!.id);
    setProfile((p) => (p ? { ...p, gender: g } : p));
    setSaving(false);
  }

  async function chooseCharacter(characterId: string) {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ character_id: characterId })
      .eq("id", profile!.id);

    await supabase.from("student_characters").upsert(
      { student_id: profile!.id, character_id: characterId },
      { onConflict: "student_id,character_id" }
    );

    setProfile((p) => (p ? { ...p, character_id: characterId } : p));
    setSaving(false);
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-indigo-500">
        <p className="text-white">Cargando...</p>
      </main>
    );
  }

  // Paso 1: elegir genero
  if (!profile.gender) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-3xl font-bold text-white"
        >
          ¡Hola, {profile.display_name}! ¿Sos nena o nene?
        </motion.h1>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.15, 0.1)}
          className="flex flex-wrap justify-center gap-8"
        >
          {(
            [
              { g: "girl" as const, label: "Nena", gradient: "from-pink-400 to-fuchsia-500", emoji: "🌸" },
              { g: "boy" as const, label: "Nene", gradient: "from-blue-500 to-cyan-400", emoji: "⚡" },
            ]
          ).map((opt) => (
            <motion.button
              key={opt.g}
              variants={staggerItem}
              disabled={saving}
              onClick={() => chooseGender(opt.g)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className={`flex w-52 flex-col items-center gap-3 rounded-3xl bg-gradient-to-br ${opt.gradient} p-10 text-white shadow-xl disabled:opacity-50`}
            >
              <span className="text-6xl">{opt.emoji}</span>
              <span className="text-xl font-bold">{opt.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </main>
    );
  }

  // Paso 2: elegir personaje (3D) segun el genero
  if (!profile.character_id) {
    const options = characters.filter((c) => c.gender === profile.gender);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-3xl font-bold text-white"
        >
          Elegí tu personaje
        </motion.h1>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.15, 0.1)}
          className="flex flex-wrap justify-center gap-6"
        >
          {options.map((c) => (
            <motion.button
              key={c.id}
              variants={staggerItem}
              disabled={saving}
              onClick={() => chooseCharacter(c.id)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="flex w-56 flex-col items-center gap-2 rounded-3xl bg-white/15 p-4 text-white shadow-xl backdrop-blur disabled:opacity-50"
            >
              <CharacterViewer
                modelUrl={c.model_url}
                heightM={c.height_m}
                autoRotate
                className="h-64 w-full"
              />
              <span className="text-lg font-bold">{c.display_name}</span>
            </motion.button>
          ))}
        </motion.div>
        {options.length === 0 && (
          <p className="text-white/80">
            Todavía no hay personajes cargados para esta opción.
          </p>
        )}
      </main>
    );
  }

  const character = characters.find((c) => c.id === profile.character_id);

  return (
    <main className="min-h-screen bg-slate-50">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white"
      >
        <div className="flex items-center gap-3">
          {character && (
            <CharacterViewer
              modelUrl={character.model_url}
              heightM={character.height_m}
              autoRotate
              fit="bust"
              accessories={equippedAccessories}
              className="h-20 w-20"
            />
          )}
          <div>
            <p className="text-sm opacity-90">{character?.display_name}</p>
            <h1 className="text-2xl font-bold">
              ¡Hola, {profile.display_name}! Vamos a aprender jugando 🎉
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/alumno/tienda"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Tienda ✨
          </Link>
          <Link
            href="/alumno/cuarto"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Mi cuarto 🏠
          </Link>
          <DiamondCounter value={profile.diamonds} />
        </div>
      </motion.header>

      <div className="mx-auto max-w-5xl p-6">
        <h2 className="text-xl font-bold text-slate-800">Tus materias</h2>
        {subjects.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl bg-white p-5 text-sm text-slate-500 shadow"
          >
            Todavía no tenés materias asignadas. Pedile a tu administrador
            que te asigne algunas desde su panel.
          </motion.p>
        )}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.05, 0.15)}
          className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {subjects.map((s) => (
            <motion.div key={s.id} variants={staggerItem}>
              <Link href={`/alumno/materia/${s.id}`}>
                <motion.div
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_PLAYFUL}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow"
                  style={{ borderTop: `4px solid ${s.color ?? "#a855f7"}` }}
                >
                  <span className="text-4xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {s.name}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

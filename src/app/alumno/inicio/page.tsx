"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, Subject, CharacterType } from "@/types/database";
import {
  staggerContainer,
  staggerItem,
  SPRING_PLAYFUL,
} from "@/lib/motion";
import DiamondCounter from "@/components/diamond-counter";

const CHARACTERS: { type: CharacterType; label: string; emoji: string; gradient: string }[] = [
  {
    type: "princess",
    label: "Princesa Mágica",
    emoji: "👑",
    gradient: "from-pink-400 to-fuchsia-500",
  },
  {
    type: "superhero",
    label: "Superestudiante",
    emoji: "🦸",
    gradient: "from-blue-500 to-cyan-400",
  },
];

export default function AlumnoInicioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
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

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function chooseCharacter(type: CharacterType) {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ active_character: type })
      .eq("id", profile!.id);

    await supabase.from("student_characters").upsert(
      { student_id: profile!.id, character_type: type },
      { onConflict: "student_id,character_type" }
    );

    setProfile((p) => (p ? { ...p, active_character: type } : p));
    setSaving(false);
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-indigo-500">
        <p className="text-white">Cargando...</p>
      </main>
    );
  }

  if (!profile.active_character) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-3xl font-bold text-white"
        >
          ¡Hola, {profile.display_name}! Elegí tu personaje
        </motion.h1>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.15, 0.1)}
          className="flex flex-wrap justify-center gap-6"
        >
          {CHARACTERS.map((c) => (
            <motion.button
              key={c.type}
              variants={staggerItem}
              disabled={saving}
              onClick={() => chooseCharacter(c.type)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className={`flex w-48 flex-col items-center gap-3 rounded-3xl bg-gradient-to-br ${c.gradient} p-8 text-white shadow-xl disabled:opacity-50`}
            >
              <span className="text-6xl">{c.emoji}</span>
              <span className="text-lg font-bold">{c.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </main>
    );
  }

  const character = CHARACTERS.find((c) => c.type === profile.active_character)!;

  return (
    <main className="min-h-screen bg-slate-50">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`flex items-center justify-between bg-gradient-to-r ${character.gradient} px-6 py-6 text-white`}
      >
        <div>
          <p className="text-sm opacity-90">
            {character.emoji} {character.label}
          </p>
          <h1 className="text-2xl font-bold">
            ¡Hola, {profile.display_name}! Vamos a aprender jugando 🎉
          </h1>
        </div>
        <DiamondCounter value={profile.diamonds} />
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
            <motion.div
              key={s.id}
              variants={staggerItem}
              whileHover={{ scale: 1.06, y: -3 }}
              transition={SPRING_PLAYFUL}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow"
              style={{ borderTop: `4px solid ${s.color ?? "#a855f7"}` }}
            >
              <span className="text-4xl">{s.icon}</span>
              <span className="text-sm font-semibold text-slate-700">
                {s.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-6 text-sm text-slate-400">
          Los ejercicios jugables llegan en el próximo paso — por ahora podés
          ver tus materias y tu personaje.
        </p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type {
  MyProfile,
  AssignedSubjectWithStatus,
  Character,
  CharacterGender,
  AgeBracket,
  SubjectScore,
} from "@/types/database";
import {
  staggerContainer,
  staggerItem,
  SPRING_PLAYFUL,
} from "@/lib/motion";
import DiamondCounter from "@/components/diamond-counter";
import { StreakBadge, LevelBar } from "@/components/streak-level-bar";
import ThemePicker from "@/components/theme-picker";
import { themeOf } from "@/lib/theme";

const SUBSCRIPTION_BADGE: Record<string, { label: string; className: string } | null> = {
  activa: null,
  sin_vencimiento: null,
  por_vencer: { label: "Vence pronto", className: "bg-amber-100 text-amber-800" },
  vencida: { label: "Vencida", className: "bg-red-100 text-red-700" },
};

export default function AlumnoInicioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [subjects, setSubjects] = useState<AssignedSubjectWithStatus[]>([]);
  const [scores, setScores] = useState<Record<string, SubjectScore>>({});
  const [characters, setCharacters] = useState<Character[]>([]);
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

      const { data: subs } = await supabase.rpc("assigned_subjects_with_status", {
        p_student_id: user.id,
      });
      setSubjects((subs as AssignedSubjectWithStatus[]) ?? []);

      const { data: subjectScores } = await supabase.rpc("my_subject_scores");
      const scoreMap: Record<string, SubjectScore> = {};
      for (const sc of (subjectScores as SubjectScore[]) ?? []) {
        scoreMap[sc.subject_id] = sc;
      }
      setScores(scoreMap);

      const { data: chars } = await supabase
        .from("characters")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      setCharacters((chars as Character[]) ?? []);

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

  async function chooseAge(a: AgeBracket) {
    setSaving(true);
    await supabase.from("profiles").update({ age_bracket: a }).eq("id", profile!.id);
    setProfile((p) => (p ? { ...p, age_bracket: a } : p));
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

  // Paso 2: elegir edad
  if (!profile.age_bracket) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-3xl font-bold text-white"
        >
          ¿Cuántos años tenés?
        </motion.h1>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.15, 0.1)}
          className="flex flex-wrap justify-center gap-6"
        >
          {(
            [
              { a: "4-7" as const, label: "4 a 7 años", emoji: "🧸" },
              { a: "7-10" as const, label: "7 a 10 años", emoji: "🎈" },
              { a: "10-12" as const, label: "10 a 12 años", emoji: "🚀" },
            ]
          ).map((opt) => (
            <motion.button
              key={opt.a}
              variants={staggerItem}
              disabled={saving}
              onClick={() => chooseAge(opt.a)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_PLAYFUL}
              className="flex w-44 flex-col items-center gap-3 rounded-3xl bg-white/15 p-8 text-white shadow-xl backdrop-blur disabled:opacity-50"
            >
              <span className="text-5xl">{opt.emoji}</span>
              <span className="text-lg font-bold">{opt.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </main>
    );
  }

  // Paso 3: elegir personaje (2D fijo) segun genero + edad
  if (!profile.character_id) {
    const options = characters.filter(
      (c) => c.gender === profile.gender && c.age_min === Number(profile.age_bracket!.split("-")[0])
    );
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
              className="flex w-48 flex-col items-center gap-2 rounded-3xl bg-white/15 p-4 text-white shadow-xl backdrop-blur disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url}
                alt={c.display_name}
                className="h-64 w-auto object-contain drop-shadow-xl"
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
  const theme = themeOf(profile.visual_theme);

  return (
    <main className="min-h-screen bg-slate-50">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`flex items-center justify-between bg-gradient-to-r ${theme.headerGradient} px-6 py-4 text-white`}
      >
        <div className="flex items-center gap-3">
          {character && (
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={character.thumbnail_url}
                alt={character.display_name}
                className="h-full w-full object-cover object-top"
              />
            </span>
          )}
          <div>
            <p className="text-sm opacity-90">{character?.display_name}</p>
            <h1 className="text-2xl font-bold">
              ¡Hola, {profile.display_name}! Vamos a aprender jugando 🎉
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemePicker
            current={profile.visual_theme}
            onChange={(t) => setProfile((p) => (p ? { ...p, visual_theme: t } : p))}
          />
          <Link
            href="/alumno/panel-padres"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Panel para padres 👨‍👩‍👧
          </Link>
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
          <Link
            href="/alumno/juegos"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
          >
            Juegos 🎮
          </Link>
          <DiamondCounter value={profile.diamonds} />
        </div>
      </motion.header>

      <div className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <StreakBadge value={profile.current_streak} />
          <LevelBar
            level={profile.level}
            title={profile.level_title}
            xpInto={profile.xp_into_level}
            xpNeeded={profile.xp_for_next_level}
          />
        </div>
      </div>

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
          {subjects.map((s) => {
            const badge = SUBSCRIPTION_BADGE[s.status];
            const blocked = s.status === "vencida";
            const tile = (
              <motion.div
                whileHover={blocked ? undefined : { scale: 1.06, y: -3 }}
                whileTap={blocked ? undefined : { scale: 0.97 }}
                transition={SPRING_PLAYFUL}
                className={`relative flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow ${
                  blocked ? "opacity-60" : ""
                }`}
                style={{ borderTop: `4px solid ${s.color ?? "#a855f7"}` }}
              >
                {badge && (
                  <span
                    className={`absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
                <span className="text-4xl">{blocked ? "🔒" : s.icon}</span>
                <span className="text-sm font-semibold text-slate-700">
                  {s.name}
                </span>
                {blocked ? (
                  <span className="text-[11px] font-bold text-red-600">
                    Pedile a tu familia que renueve esta materia
                  </span>
                ) : (
                  scores[s.id] && scores[s.id].topics_total > 0 && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-600">
                      {scores[s.id].topics_passed}/{scores[s.id].topics_total} temas
                      {scores[s.id].avg_exam_pct !== null
                        ? ` · ${scores[s.id].avg_exam_pct}%`
                        : ""}
                    </span>
                  )
                )}
              </motion.div>
            );
            return (
              <motion.div key={s.id} variants={staggerItem}>
                {blocked ? tile : <Link href={`/alumno/materia/${s.id}`}>{tile}</Link>}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}

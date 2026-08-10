"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Subject, SubjectTopic, SubjectTeacher, MySubjectTeacher } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";

type Stage = "loading" | "choose_teacher" | "ready" | "empty" | "error";

export default function MateriaTopicsPage() {
  const params = useParams();
  const subjectId = String(params.id);
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("loading");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [teachers, setTeachers] = useState<SubjectTeacher[]>([]);
  const [myTeacher, setMyTeacher] = useState<MySubjectTeacher | null>(null);
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    const { data, error } = await supabase.rpc("subject_topics", {
      p_subject_id: subjectId,
    });
    if (error) {
      setErrorMsg(error.message);
      setStage("error");
      return;
    }
    const list = (data as SubjectTopic[]) ?? [];
    setTopics(list);
    setStage(list.length === 0 ? "empty" : "ready");
  }, [supabase, subjectId]);

  const load = useCallback(async () => {
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id, slug, name, category, icon, color, sort_order, active")
      .eq("id", subjectId)
      .maybeSingle();
    setSubject((subjectData as Subject) ?? null);

    const { data: teachersData } = await supabase.rpc("subject_teachers", {
      p_subject_id: subjectId,
    });
    const teacherList = (teachersData as SubjectTeacher[]) ?? [];
    setTeachers(teacherList);

    if (teacherList.length > 0) {
      const { data: myTeacherData } = await supabase.rpc("my_subject_teacher", {
        p_subject_id: subjectId,
      });
      const mine = ((myTeacherData as MySubjectTeacher[]) ?? [])[0] ?? null;
      setMyTeacher(mine);
      if (!mine) {
        setStage("choose_teacher");
        return;
      }
    }

    await loadTopics();
  }, [supabase, subjectId, loadTopics]);

  useEffect(() => {
    load();
  }, [load]);

  async function chooseTeacher(teacherId: string) {
    if (choosingId) return;
    setChoosingId(teacherId);
    const { error } = await supabase.rpc("choose_subject_teacher", {
      p_subject_id: subjectId,
      p_teacher_id: teacherId,
    });
    if (!error) {
      const picked = teachers.find((t) => t.teacher_id === teacherId) ?? null;
      setMyTeacher(picked as MySubjectTeacher | null);
      await loadTopics();
    }
    setChoosingId(null);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-6 py-8 text-white">
        <Link href="/alumno/inicio" className="text-sm text-white/70 hover:text-white">
          ← Mis materias
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-4xl">{subject?.icon ?? "📘"}</span>
          <h1 className="text-2xl font-bold">{subject?.name ?? "Materia"}</h1>
        </div>
        {myTeacher && stage !== "choose_teacher" && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={myTeacher.image_url}
              alt={myTeacher.name}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold">
                Tu profe: {myTeacher.name} {myTeacher.flag_emoji}
              </p>
            </div>
            <button
              onClick={() => setStage("choose_teacher")}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
            >
              Cambiar
            </button>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-2xl p-6">
        {stage === "loading" && (
          <p className="mt-6 text-center text-slate-500">Cargando...</p>
        )}

        {stage === "error" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeSlideUp}
            className="mt-6 rounded-2xl bg-white p-6 text-center text-slate-600 shadow"
          >
            <p>{errorMsg}</p>
            <Link href="/alumno/inicio" className="mt-4 inline-block text-purple-600 underline">
              Volver
            </Link>
          </motion.div>
        )}

        {stage === "choose_teacher" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeSlideUp}
          >
            <h2 className="mb-1 text-lg font-bold text-slate-800">
              {myTeacher ? "Cambiá tu profe" : "Elegí tu profe"} de {subject?.name ?? "esta materia"}
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Te va a acompañar en cada ejercicio.
            </p>
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer(0.06)}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {teachers.map((t) => (
                <motion.button
                  key={t.teacher_id}
                  variants={staggerItem}
                  disabled={!!choosingId}
                  onClick={() => chooseTeacher(t.teacher_id)}
                  whileHover={{ scale: choosingId ? 1 : 1.05, y: -3 }}
                  whileTap={{ scale: choosingId ? 1 : 0.96 }}
                  transition={SPRING_PLAYFUL}
                  className={`flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center shadow disabled:opacity-50 ${
                    myTeacher?.teacher_id === t.teacher_id ? "ring-2 ring-purple-500" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <span className="text-sm font-bold text-slate-800">{t.name}</span>
                  <span className="text-xs text-slate-400">
                    {t.flag_emoji} {t.nationality}
                  </span>
                </motion.button>
              ))}
            </motion.div>
            {myTeacher && (
              <button
                onClick={() => setStage("ready")}
                className="mt-4 text-sm text-purple-600 underline"
              >
                Cancelar
              </button>
            )}
          </motion.div>
        )}

        {stage === "empty" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeSlideUp}
            className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-600 shadow"
          >
            <p className="text-5xl">🚧</p>
            <p className="mt-3 font-semibold">
              Todavía no hay temas de {subject?.name ?? "esta materia"}.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              ¡Volvé pronto, tu administrador está preparando más!
            </p>
          </motion.div>
        )}

        {stage === "ready" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer(0.06)}
            className="mt-2 flex flex-col gap-3"
          >
            <AnimatePresence>
              {topics.map((t) => {
                const hasContent = t.practice_count + t.exam_count > 0;
                return (
                  <motion.div key={t.topic_id} variants={staggerItem}>
                    <Link
                      href={hasContent ? `/alumno/materia/${subjectId}/tema/${t.topic_id}` : "#"}
                      aria-disabled={!hasContent}
                      className={`flex items-center gap-4 rounded-2xl bg-white p-4 shadow transition-transform ${
                        hasContent ? "hover:-translate-y-0.5" : "pointer-events-none opacity-50"
                      }`}
                    >
                      <span className="text-3xl">
                        {t.passed ? "🏆" : hasContent ? "📖" : "🔒"}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">
                          {hasContent
                            ? `${t.practice_count} ejercicios + Test final`
                            : "Próximamente"}
                          {t.recommended_age != null && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500">
                              Recomendado: {t.recommended_age} años
                            </span>
                          )}
                        </p>
                      </div>
                      {t.exam_best_stars > 0 ? (
                        <div className="flex gap-0.5 text-lg">
                          {[1, 2, 3].map((n) => (
                            <span key={n} className={n <= t.exam_best_stars ? "" : "opacity-25"}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      ) : hasContent ? (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-600">
                          Empezar
                        </span>
                      ) : null}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}

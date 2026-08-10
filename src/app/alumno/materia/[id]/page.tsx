"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Subject, SubjectTopic } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp } from "@/lib/motion";

type Stage = "loading" | "ready" | "empty" | "error";

export default function MateriaTopicsPage() {
  const params = useParams();
  const subjectId = String(params.id);
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("loading");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id, slug, name, category, icon, color, sort_order, active")
      .eq("id", subjectId)
      .maybeSingle();
    setSubject((subjectData as Subject) ?? null);

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

  useEffect(() => {
    load();
  }, [load]);

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

        {stage === "empty" && (
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeSlideUp}
            className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-600 shadow"
          >
            <p className="text-5xl">🚧</p>
            <p className="mt-3 font-semibold">
              Todavía no hay temas de {subject?.name ?? "esta materia"} para tu edad.
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
            className="mt-6 flex flex-col gap-3"
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

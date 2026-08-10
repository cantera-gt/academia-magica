"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { PlayableExercise, AttemptResult, Subject } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";

type Stage = "loading" | "intro" | "playing" | "feedback" | "summary" | "empty" | "error";

export default function JugarMateriaPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = String(params.id);
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("loading");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [exercises, setExercises] = useState<PlayableExercise[]>([]);
  const [index, setIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [diamondsThisRound, setDiamondsThisRound] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const load = useCallback(async () => {
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id, slug, name, category, icon, color, sort_order, active")
      .eq("id", subjectId)
      .maybeSingle();
    setSubject((subjectData as Subject) ?? null);

    const { data, error } = await supabase.rpc("playable_exercises", {
      p_subject_id: subjectId,
    });

    if (error) {
      setErrorMsg(error.message);
      setStage("error");
      return;
    }

    const list = (data as PlayableExercise[]) ?? [];
    setExercises(list);
    setStage(list.length === 0 ? "empty" : "intro");
  }, [supabase, subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  function startRound() {
    setIndex(0);
    setCorrectCount(0);
    setDiamondsThisRound(0);
    setTextValue("");
    setStartedAt(Date.now());
    setStage("playing");
  }

  async function submitAnswer(value: string) {
    if (submitting || !value) return;
    setSubmitting(true);
    const current = exercises[index];
    const timeSpent = Math.round((Date.now() - startedAt) / 1000);

    const { data, error } = await supabase.rpc("submit_exercise_attempt", {
      p_exercise_id: current.id,
      p_given_answer: { value },
      p_time_spent_seconds: timeSpent,
    });

    if (error) {
      setErrorMsg(error.message);
      setStage("error");
      setSubmitting(false);
      return;
    }

    const res = data as AttemptResult;
    setResult(res);
    if (res.is_correct) {
      setCorrectCount((c) => c + 1);
      setDiamondsThisRound((d) => d + res.diamonds_earned);
    }
    setStage("feedback");
    setSubmitting(false);
  }

  function nextExercise() {
    if (index + 1 >= exercises.length) {
      setStage("summary");
      return;
    }
    setIndex((i) => i + 1);
    setTextValue("");
    setResult(null);
    setStartedAt(Date.now());
    setStage("playing");
  }

  const current = exercises[index];
  const bg = "bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500";

  return (
    <main className={`min-h-screen ${bg} p-6`}>
      <div className="mx-auto max-w-lg">
        <Link
          href="/alumno/inicio"
          className="inline-block text-sm text-white/70 hover:text-white"
        >
          ← Mis materias
        </Link>

        <AnimatePresence mode="wait">
          {stage === "loading" && (
            <motion.p key="loading" className="mt-10 text-center text-white">
              Cargando...
            </motion.p>
          )}

          {stage === "error" && (
            <motion.div
              key="error"
              initial="initial"
              animate="animate"
              variants={fadeSlideUp}
              className="mt-10 rounded-2xl bg-white/10 p-6 text-center text-white backdrop-blur"
            >
              <p>{errorMsg}</p>
              <Link href="/alumno/inicio" className="mt-4 inline-block underline">
                Volver
              </Link>
            </motion.div>
          )}

          {stage === "empty" && (
            <motion.div
              key="empty"
              initial="initial"
              animate="animate"
              variants={fadeSlideUp}
              className="mt-10 rounded-2xl bg-white/10 p-8 text-center text-white backdrop-blur"
            >
              <p className="text-5xl">🚧</p>
              <p className="mt-3 font-semibold">
                Todavía no hay ejercicios de {subject?.name ?? "esta materia"}.
              </p>
              <p className="mt-1 text-sm text-white/70">
                ¡Volvé pronto, tu administrador está preparando más!
              </p>
              <Link
                href="/alumno/inicio"
                className="mt-5 inline-block rounded-xl bg-white px-6 py-2 font-bold text-purple-700"
              >
                Volver a mis materias
              </Link>
            </motion.div>
          )}

          {stage === "intro" && subject && (
            <motion.div
              key="intro"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-white/10 p-8 text-center text-white backdrop-blur"
            >
              <span className="text-6xl">{subject.icon}</span>
              <h1 className="text-2xl font-bold">{subject.name}</h1>
              <p className="text-white/80">
                {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}{" "}
                te esperan. ¡Cada acierto te da diamantes! 💎
              </p>
              <motion.button
                onClick={startRound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-700 shadow-lg"
              >
                Empezar 🚀
              </motion.button>
            </motion.div>
          )}

          {stage === "playing" && current && (
            <motion.div
              key={`playing-${current.id}`}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-6"
            >
              <div className="mb-4 flex items-center justify-between text-sm text-white/80">
                <span>
                  Pregunta {index + 1} de {exercises.length}
                </span>
                <span>💎 +{current.diamond_reward}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((index) / exercises.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
                {current.prompt.hint && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-500">
                    💡 {current.prompt.hint}
                  </p>
                )}
                <h2 className="text-xl font-bold text-slate-800">
                  {current.prompt.text}
                </h2>

                {current.options ? (
                  <motion.div
                    initial="initial"
                    animate="animate"
                    variants={staggerContainer(0.06)}
                    className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    {current.options.map((opt) => (
                      <motion.button
                        key={opt}
                        variants={staggerItem}
                        disabled={submitting}
                        onClick={() => submitAnswer(opt)}
                        whileHover={{ scale: submitting ? 1 : 1.03 }}
                        whileTap={{ scale: submitting ? 1 : 0.97 }}
                        transition={SPRING_PLAYFUL}
                        className="rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-left font-semibold text-purple-800 hover:border-purple-400 hover:bg-purple-100 disabled:opacity-50"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <form
                    className="mt-6 flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAnswer(textValue.trim());
                    }}
                  >
                    <input
                      autoFocus
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      disabled={submitting}
                      placeholder="Escribí tu respuesta..."
                      className="rounded-xl border-2 border-purple-200 px-4 py-3 text-lg text-slate-800 outline-none focus:border-purple-400"
                    />
                    <motion.button
                      type="submit"
                      disabled={submitting || !textValue.trim()}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      transition={SPRING_PLAYFUL}
                      className="rounded-xl bg-purple-600 px-4 py-3 font-bold text-white disabled:opacity-50"
                    >
                      Responder
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {stage === "feedback" && result && current && (
            <motion.div
              key="feedback"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-6"
            >
              <motion.div
                animate={
                  result.is_correct
                    ? { scale: [0.7, 1.08, 1] }
                    : { x: [0, -10, 10, -8, 8, 0] }
                }
                transition={
                  result.is_correct
                    ? SPRING_PLAYFUL
                    : { duration: 0.45, ease: "easeOut" }
                }
                className={`rounded-3xl p-6 text-center shadow-xl ${
                  result.is_correct
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-gradient-to-br from-orange-400 to-rose-400"
                }`}
              >
                <p className="text-6xl">{result.is_correct ? "🎉" : "💫"}</p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  {result.is_correct ? "¡Correcto!" : "¡Casi!"}
                </h2>
                {result.is_correct ? (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-1 text-lg font-semibold text-white"
                  >
                    +{result.diamonds_earned} 💎
                  </motion.p>
                ) : (
                  <p className="mt-1 text-white/90">
                    La respuesta era:{" "}
                    <span className="font-bold">{result.correct_answer.value}</span>
                  </p>
                )}
                {result.explanation && (
                  <p className="mt-3 text-sm text-white/90">{result.explanation}</p>
                )}
              </motion.div>

              <motion.button
                onClick={nextExercise}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_PLAYFUL}
                className="mt-5 w-full rounded-xl bg-white px-6 py-3 text-lg font-bold text-purple-700 shadow-lg"
              >
                {index + 1 >= exercises.length ? "Ver resultado 🏆" : "Siguiente →"}
              </motion.button>
            </motion.div>
          )}

          {stage === "summary" && (
            <motion.div
              key="summary"
              initial="initial"
              animate="animate"
              variants={fadeSlideUp}
              className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-white/10 p-8 text-center text-white backdrop-blur"
            >
              <motion.span
                animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                transition={{ duration: 0.8 }}
                className="text-7xl"
              >
                🏆
              </motion.span>
              <h1 className="text-2xl font-bold">¡Ronda completa!</h1>
              <p className="text-white/90">
                {correctCount} de {exercises.length} correctas
              </p>
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING_PLAYFUL}
                className="text-3xl font-bold"
              >
                +{diamondsThisRound} 💎
              </motion.p>
              <div className="mt-3 flex gap-3">
                <motion.button
                  onClick={startRound}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_PLAYFUL}
                  className="rounded-xl bg-white/20 px-5 py-2 font-semibold"
                >
                  Jugar de nuevo
                </motion.button>
                <motion.button
                  onClick={() => router.push("/alumno/inicio")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_PLAYFUL}
                  className="rounded-xl bg-white px-5 py-2 font-bold text-purple-700"
                >
                  Mis materias
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type {
  PlayableTopicExercise,
  AttemptResult,
  FinishTopicResult,
  MySubjectTeacher,
  TopicDetail,
  MyProfile,
} from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";

type Stage =
  | "loading"
  | "intro"
  | "playing"
  | "feedback"
  | "exam_intro"
  | "summary"
  | "empty"
  | "error";

type Phase = "practice" | "exam";

export default function TemaPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = String(params.id);
  const topicId = String(params.topicId);
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("loading");
  const [exercises, setExercises] = useState<PlayableTopicExercise[]>([]);
  const [phase, setPhase] = useState<Phase>("practice");
  const [index, setIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [examCorrect, setExamCorrect] = useState(0);
  const [diamondsThisRound, setDiamondsThisRound] = useState(0);
  const [finishResult, setFinishResult] = useState<FinishTopicResult | null>(null);

  const [topicDetail, setTopicDetail] = useState<TopicDetail | null>(null);
  const [teacher, setTeacher] = useState<MySubjectTeacher | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const practiceList = exercises.filter((e) => !e.is_exam);
  const examList = exercises.filter((e) => e.is_exam);
  const currentList = phase === "practice" ? practiceList : examList;
  const current = currentList[index];

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("playable_topic_exercises", {
      p_topic_id: topicId,
    });

    if (error) {
      setErrorMsg(error.message);
      setStage("error");
      return;
    }

    const { data: topicRow } = await supabase
      .from("topics")
      .select("id, subject_id, name, recommended_age, prerequisites")
      .eq("id", topicId)
      .maybeSingle();
    setTopicDetail((topicRow as TopicDetail) ?? null);

    const { data: teacherData } = await supabase.rpc("my_subject_teacher", {
      p_subject_id: subjectId,
    });
    setTeacher(((teacherData as MySubjectTeacher[]) ?? [])[0] ?? null);

    const { data: profileData } = await supabase.rpc("my_profile").maybeSingle();
    setProfile((profileData as MyProfile) ?? null);

    const list = (data as PlayableTopicExercise[]) ?? [];
    setExercises(list);
    setStage(list.length === 0 ? "empty" : "intro");
  }, [supabase, topicId, subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  function startRound() {
    setPhase("practice");
    setIndex(0);
    setPracticeCorrect(0);
    setExamCorrect(0);
    setDiamondsThisRound(0);
    setFinishResult(null);
    setTextValue("");
    setStartedAt(Date.now());
    setStage(practiceList.length > 0 ? "playing" : "exam_intro");
    // No bloqueamos la UI por esto: solo deja constancia de "aca me quede"
    // para que el profesor pueda recomendar retomarlo despues, aunque el
    // alumno no llegue a terminar la practica+examen en esta sesion.
    supabase.rpc("mark_topic_started", { p_topic_id: topicId }).then(() => {});
  }

  function startExam() {
    setPhase("exam");
    setIndex(0);
    setTextValue("");
    setStartedAt(Date.now());
    setStage("playing");
  }

  async function finishTopic(finalPracticeCorrect: number, finalExamCorrect: number) {
    const { data, error } = await supabase.rpc("finish_topic", {
      p_topic_id: topicId,
      p_practice_correct: finalPracticeCorrect,
      p_practice_total: practiceList.length,
      p_exam_correct: finalExamCorrect,
      p_exam_total: examList.length,
    });

    if (!error && data) {
      setFinishResult(data as FinishTopicResult);
    }
    setStage("summary");
  }

  async function submitAnswer(value: string) {
    if (submitting || !value || !current) return;
    setSubmitting(true);
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
      setDiamondsThisRound((d) => d + res.diamonds_earned);
      if (phase === "practice") setPracticeCorrect((c) => c + 1);
      else setExamCorrect((c) => c + 1);
    }
    setStage("feedback");
    setSubmitting(false);
  }

  function nextExercise() {
    const isLastOfPhase = index + 1 >= currentList.length;

    if (!isLastOfPhase) {
      setIndex((i) => i + 1);
      setTextValue("");
      setResult(null);
      setStartedAt(Date.now());
      setStage("playing");
      return;
    }

    if (phase === "practice" && examList.length > 0) {
      setStage("exam_intro");
      return;
    }

    // Ultima pregunta (de practica sin examen, o del examen) -> cerrar tema
    finishTopic(practiceCorrect, examCorrect);
  }

  function greetingText(): string {
    if (!teacher) return "";
    const raw =
      showTranslation && teacher.greeting_es ? teacher.greeting_es : teacher.greeting_template;
    return raw.replace("{name}", profile?.display_name ?? "");
  }

  function handleSpeak() {
    if (!teacher) return;
    const lang = showTranslation && teacher.greeting_es ? "es-ES" : teacher.speak_lang;
    speakText(
      greetingText(),
      lang,
      teacher.voice_name_hints,
      () => setSpeaking(true),
      () => setSpeaking(false)
    );
  }

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const isExamPhase = phase === "exam" && stage !== "exam_intro";
  const bg = isExamPhase
    ? "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500"
    : "bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500";

  return (
    <main className={`min-h-screen ${bg} p-6`}>
      <div className="mx-auto max-w-lg">
        <Link
          href={`/alumno/materia/${subjectId}`}
          className="inline-block text-sm text-white/70 hover:text-white"
        >
          ← Temas
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
              <p className="mt-3 font-semibold">Todavía no hay ejercicios de este tema.</p>
              <Link
                href={`/alumno/materia/${subjectId}`}
                className="mt-5 inline-block rounded-xl bg-white px-6 py-2 font-bold text-purple-700"
              >
                Volver a los temas
              </Link>
            </motion.div>
          )}

          {stage === "intro" && (
            <motion.div
              key="intro"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-6 flex flex-col items-center gap-4"
            >
              {teacher && (
                <div className="flex w-full items-end gap-2">
                  <motion.div
                    animate={
                      speaking
                        ? { y: [0, -6, 0], rotate: [0, -2, 2, 0] }
                        : { y: 0, rotate: 0 }
                    }
                    transition={{ duration: 0.6, repeat: speaking ? Infinity : 0 }}
                    className="w-24 shrink-0 sm:w-28"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={teacher.body_image_url ?? teacher.image_url}
                      alt={teacher.name}
                      className="w-full drop-shadow-xl"
                    />
                  </motion.div>
                  <div className="mb-4 flex-1 rounded-2xl rounded-bl-none bg-white p-4 text-left shadow-xl">
                    <p className="text-sm font-bold text-purple-700">
                      {teacher.name} {teacher.flag_emoji}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{greetingText()}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={handleSpeak}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 hover:bg-purple-200"
                      >
                        {speaking ? "🔊 Hablando..." : "🔊 Escuchar"}
                      </button>
                      {teacher.greeting_es && (
                        <button
                          onClick={() => setShowTranslation((v) => !v)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                        >
                          {showTranslation ? "🔁 Ver en original" : "🔁 Traducir al español"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full rounded-2xl bg-white/10 p-6 text-center text-white backdrop-blur">
                <span className="text-5xl">📖</span>
                <p className="mt-2 text-white/80">
                  {practiceList.length} ejercicio{practiceList.length !== 1 ? "s" : ""} de práctica
                  {examList.length > 0 && (
                    <>
                      {" "}
                      + un Test final de {examList.length} pregunta
                      {examList.length !== 1 ? "s" : ""} 🏆
                    </>
                  )}
                </p>

                {topicDetail?.recommended_age != null && (
                  <p className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    Recomendado desde los {topicDetail.recommended_age} años
                  </p>
                )}

                {topicDetail?.prerequisites && (
                  <div className="mt-4 rounded-xl bg-black/15 p-4 text-left text-sm text-white/90">
                    <p className="mb-1 font-bold">💡 Para esta lección conviene:</p>
                    <p>{topicDetail.prerequisites}</p>
                  </div>
                )}

                <motion.button
                  onClick={startRound}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_PLAYFUL}
                  className="mt-4 rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-700 shadow-lg"
                >
                  Empezar 🚀
                </motion.button>
              </div>
            </motion.div>
          )}

          {stage === "exam_intro" && (
            <motion.div
              key="exam_intro"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-10 flex flex-col items-center gap-4 rounded-3xl bg-white/10 p-8 text-center text-white backdrop-blur"
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
                transition={{ duration: 0.8 }}
                className="text-6xl"
              >
                🏆
              </motion.span>
              <h1 className="text-2xl font-bold">¡Práctica completa!</h1>
              <p className="text-white/80">
                Ahora viene el Test final ({examList.length} pregunta
                {examList.length !== 1 ? "s" : ""}). ¡Respondé con atención!
              </p>
              <motion.button
                onClick={startExam}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-8 py-3 text-lg font-bold text-orange-600 shadow-lg"
              >
                Empezar el Test 🏆
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
                  {isExamPhase ? "Test 🏆" : "Pregunta"} {index + 1} de {currentList.length}
                </span>
                <span>💎 +{current.diamond_reward}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${(index / currentList.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
                {current.prompt.hint && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-500">
                    💡 {current.prompt.hint}
                  </p>
                )}
                <h2 className="text-xl font-bold text-slate-800">{current.prompt.text}</h2>

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
                  result.is_correct ? SPRING_PLAYFUL : { duration: 0.45, ease: "easeOut" }
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
                {index + 1 >= currentList.length ? "Ver resultado 🏆" : "Siguiente →"}
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
                {finishResult?.passed ? "🏆" : "📚"}
              </motion.span>
              <h1 className="text-2xl font-bold">
                {finishResult?.passed ? "¡Test aprobado!" : "¡Tema completo!"}
              </h1>

              {finishResult?.exam_pct !== null && finishResult?.exam_pct !== undefined && (
                <>
                  <p className="text-white/90">Test final: {finishResult.exam_pct}%</p>
                  <div className="flex gap-1 text-3xl">
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={n <= finishResult.stars ? "" : "opacity-25"}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  {!finishResult.passed && (
                    <p className="text-sm text-white/70">
                      Necesitás 60% o más para aprobar el Test. ¡Volvé a intentarlo!
                    </p>
                  )}
                </>
              )}

              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING_PLAYFUL}
                className="text-3xl font-bold"
              >
                +{diamondsThisRound + (finishResult?.bonus_diamonds ?? 0)} 💎
              </motion.p>
              {finishResult?.is_first_pass && finishResult.bonus_diamonds > 0 && (
                <p className="text-sm text-white/80">
                  Incluye +{finishResult.bonus_diamonds} 💎 de bono por aprobar el Test por
                  primera vez
                </p>
              )}

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
                  onClick={() => router.push(`/alumno/materia/${subjectId}`)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_PLAYFUL}
                  className="rounded-xl bg-white px-5 py-2 font-bold text-purple-700"
                >
                  Ver temas
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

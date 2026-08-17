"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type {
  PlayableTopicExercise,
  AttemptResult,
  FinishTopicResult,
  MySubjectTeacher,
  TopicDetail,
  MyProfile,
  ExerciseOption,
} from "@/types/database";
import DragDropExercise from "@/components/drag-drop-exercise";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL, EASE_OUT } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";
import TeacherChatWidget from "@/components/teacher-chat-widget";

function optLabel(opt: string | ExerciseOption): string {
  return typeof opt === "string" ? opt : opt.label;
}

function optImage(opt: string | ExerciseOption): string | null {
  return typeof opt === "string" ? null : (opt.image ?? null);
}

function approxAgeFromBracket(bracket: string | null | undefined): number | null {
  if (bracket === "4-7") return 5;
  if (bracket === "7-10") return 8;
  if (bracket === "10-12") return 11;
  return null;
}

type Stage =
  | "loading"
  | "intro"
  | "playing"
  | "feedback"
  | "lesson_intro"
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
  const [subjectName, setSubjectName] = useState<string>("esta materia");
  const [subjectSlug, setSubjectSlug] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [promptSpeaking, setPromptSpeaking] = useState(false);
  const [pendingLessonName, setPendingLessonName] = useState<string | null>(null);

  // Andamiaje adaptativo: cuantas veces fallo el alumno ESTE ejercicio en
  // fila. 0 = intento normal. 1 = ya mostramos pista + resaltamos la
  // correcta. 2 = ya redujimos las opciones a 2. Se reinicia cada vez que
  // se avanza a un ejercicio nuevo. Solo aplica en fase de practica (el
  // Test final siempre es de un solo intento, como antes).
  const [failStreak, setFailStreak] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [revealCorrectLabel, setRevealCorrectLabel] = useState<string | null>(null);

  const NEUTRAL_ES_VOICE = "es-ES-ElviraNeural";
  const NEUTRAL_DE_VOICE = "de-DE-KatjaNeural";

  function defaultVoice(): string {
    if (teacher?.voice_name) return teacher.voice_name;
    return subjectSlug === "aleman" ? NEUTRAL_DE_VOICE : NEUTRAL_ES_VOICE;
  }

  function speakPrompt() {
    if (!current) return;
    speakText(
      current.prompt.text,
      defaultVoice(),
      () => setPromptSpeaking(true),
      () => setPromptSpeaking(false)
    );
  }

  // Opciones que se muestran de verdad: si ya fallo 2 veces seguidas este
  // ejercicio, se reducen a la correcta + 1 distractor (elegido una sola
  // vez por render, no se reordena en cada tilde de reloj).
  const [reducedOptions, setReducedOptions] = useState<(string | ExerciseOption)[] | null>(null);

  const practiceList = exercises.filter((e) => !e.is_exam);
  const examList = exercises.filter((e) => e.is_exam);
  const currentList = phase === "practice" ? practiceList : examList;
  const current = currentList[index];
  const visibleOptions = reducedOptions ?? current?.options ?? null;
  const lessonCount = new Set(practiceList.map((e) => e.lesson_id).filter(Boolean)).size;

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

    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("name, slug")
      .eq("id", subjectId)
      .maybeSingle();
    if (subjectRow?.name) setSubjectName(subjectRow.name);
    if (subjectRow?.slug) setSubjectSlug(subjectRow.slug);

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
    setFailStreak(0);
    setReducedOptions(null);
    setRevealCorrectLabel(null);
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
    setFailStreak(0);
    setReducedOptions(null);
    setRevealCorrectLabel(null);
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

    // Andamiaje adaptativo: en practica, si el tipo de ejercicio admite
    // reintento (opcion multiple o arrastrar-soltar) y todavia no gastamos
    // los 2 niveles de ayuda, dejamos que lo vuelva a intentar en el mismo
    // ejercicio en vez de pasar a la pantalla de resultado.
    const retryableType = current.type === "multiple_choice" || current.type === "drag_drop";
    const canRetry = phase === "practice" && retryableType && !res.is_correct && failStreak < 2;

    if (canRetry) {
      const nextFail = failStreak + 1;
      setFailStreak(nextFail);
      setRevealCorrectLabel(res.correct_answer.value);
      setShakeKey((k) => k + 1);
      if (nextFail >= 2 && current.options) {
        const correctOpt = current.options.find((o) => optLabel(o) === res.correct_answer.value);
        const others = current.options.filter((o) => optLabel(o) !== res.correct_answer.value);
        const oneOther = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : undefined;
        const pair = [correctOpt, oneOther].filter(Boolean) as (string | ExerciseOption)[];
        setReducedOptions(pair.length === 2 ? pair : null);
      }
      setSubmitting(false);
      return;
    }

    setResult(res);
    setRevealCorrectLabel(null);
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
      const next = currentList[index + 1];
      const changingLesson =
        phase === "practice" &&
        !!current?.lesson_id &&
        !!next?.lesson_id &&
        next.lesson_id !== current.lesson_id;
      setIndex((i) => i + 1);
      setTextValue("");
      setResult(null);
      setFailStreak(0);
      setReducedOptions(null);
      setRevealCorrectLabel(null);
      setStartedAt(Date.now());
      if (changingLesson) {
        setPendingLessonName(next.lesson_name);
        setStage("lesson_intro");
      } else {
        setStage("playing");
      }
      return;
    }

    if (phase === "practice" && examList.length > 0) {
      setStage("exam_intro");
      return;
    }

    // Ultima pregunta (de practica sin examen, o del examen) -> cerrar tema
    finishTopic(practiceCorrect, examCorrect);
  }

  function continueLesson() {
    setStage("playing");
  }

  function greetingText(): string {
    if (!teacher) return "";
    const raw =
      showTranslation && teacher.greeting_es ? teacher.greeting_es : teacher.greeting_template;
    return raw.replace("{name}", profile?.display_name ?? "");
  }

  // Voz neutra en espanol para cuando se muestra la traduccion de un
  // profesor que da su materia en otro idioma (ej. James en Ingles).
  const FALLBACK_ES_VOICE = "es-ES-AlvaroNeural";

  function handleSpeak() {
    if (!teacher) return;
    const voice =
      showTranslation && teacher.greeting_es ? FALLBACK_ES_VOICE : teacher.voice_name;
    speakText(
      greetingText(),
      voice,
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

        <AnimatePresence mode="popLayout">
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
                  {lessonCount > 1 && <> en {lessonCount} lecciones</>}
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

          {stage === "lesson_intro" && (
            <motion.div
              key="lesson_intro"
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
                📘
              </motion.span>
              <h1 className="text-2xl font-bold">¡Muy bien!</h1>
              <p className="text-white/80">
                Ahora sigue: <span className="font-semibold">{pendingLessonName}</span>
              </p>
              <motion.button
                onClick={continueLesson}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_PLAYFUL}
                className="mt-2 rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-600 shadow-lg"
              >
                Continuar →
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
                  className="h-full w-full origin-left rounded-full bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index / currentList.length }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                />
              </div>

              <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
                {current.prompt.hint && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-500">
                    💡 {current.prompt.hint}
                  </p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-800">{current.prompt.text}</h2>
                  <button
                    onClick={speakPrompt}
                    aria-label="Escuchar enunciado"
                    className="shrink-0 rounded-full bg-purple-100 p-2 text-purple-700 hover:bg-purple-200"
                  >
                    {promptSpeaking ? "🔊" : "🔈"}
                  </button>
                </div>

                {failStreak > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                  >
                    💡 {current.prompt.hint_after_fail ?? "¡Casi! Fijate bien y probá de nuevo."}
                  </motion.p>
                )}

                {current.prompt.image_url && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative h-40 w-40 overflow-hidden rounded-2xl bg-purple-50 sm:h-48 sm:w-48">
                      <Image
                        src={current.prompt.image_url}
                        alt=""
                        fill
                        sizes="192px"
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                )}

                {current.type === "drag_drop" && current.prompt.drop_target && visibleOptions ? (
                  <DragDropExercise
                    key={shakeKey}
                    dropTarget={current.prompt.drop_target}
                    options={visibleOptions}
                    submitting={submitting}
                    revealCorrectLabel={revealCorrectLabel}
                    onDrop={(label) => submitAnswer(label)}
                  />
                ) : visibleOptions ? (
                  <motion.div
                    key={shakeKey}
                    animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      initial="initial"
                      animate="animate"
                      variants={staggerContainer(0.06)}
                      className={
                        current.prompt.display_mode === "scene"
                          ? "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
                          : "mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
                      }
                    >
                      {visibleOptions.map((opt) => {
                        const label = optLabel(opt);
                        const image = optImage(opt);
                        const isRevealed = revealCorrectLabel === label;
                        const scene = current.prompt.display_mode === "scene";
                        return (
                          <motion.button
                            key={label}
                            variants={staggerItem}
                            disabled={submitting}
                            onClick={() => submitAnswer(label)}
                            whileHover={{ scale: submitting ? 1 : 1.03 }}
                            whileTap={{ scale: submitting ? 1 : 0.97 }}
                            transition={SPRING_PLAYFUL}
                            className={
                              (scene
                                ? "flex flex-col items-center gap-2 rounded-2xl p-3 text-center font-semibold text-purple-800 "
                                : "flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-purple-800 ") +
                              "border-2 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 disabled:opacity-50 " +
                              (isRevealed
                                ? "border-emerald-400 ring-4 ring-emerald-200"
                                : "border-purple-200")
                            }
                          >
                            {image && (
                              <span
                                className={
                                  scene
                                    ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white"
                                    : "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white"
                                }
                              >
                                <Image src={image} alt="" fill sizes={scene ? "80px" : "48px"} className="object-contain p-1" />
                              </span>
                            )}
                           {(!scene || !image) && <span>{label}</span>}
                          </motion.button>
                        );
                      })}
                    </motion.div>
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
              {result.streak_extended && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={SPRING_PLAYFUL}
                  className="mb-3 flex items-center justify-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-extrabold text-orange-700"
                >
                  <span className="text-lg">🔥</span>
                  ¡Racha de {result.current_streak} {result.current_streak === 1 ? "día" : "días"}!
                </motion.div>
              )}

              {result.leveled_up && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: -10 }}
                  animate={{ opacity: 1, scale: [0.6, 1.15, 1], y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mb-3 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 p-4 text-center shadow-lg"
                >
                  <p className="text-3xl">🏆</p>
                  <p className="mt-1 text-lg font-extrabold text-amber-900">
                    ¡Subiste a Nivel {result.level}!
                  </p>
                  {result.level_title && (
                    <p className="text-sm font-bold text-amber-800">{result.level_title}</p>
                  )}
                </motion.div>
              )}

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
                    className="mt-1 flex items-center justify-center gap-3 text-lg font-semibold text-white"
                  >
                    <span>+{result.diamonds_earned} 💎</span>
                    {result.xp_earned > 0 && <span>+{result.xp_earned} ⭐ XP</span>}
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

      <TeacherChatWidget
        subjectId={subjectId}
        subjectName={subjectName}
        subjectSlug={subjectSlug}
        topicId={topicId}
        topicName={topicDetail?.name ?? undefined}
        teacher={teacher}
        studentName={profile?.display_name}
        studentAge={approxAgeFromBracket(profile?.age_bracket)}
        exercise={
          stage === "playing" && current
            ? {
                id: current.id,
                prompt: current.prompt.text,
                hint: current.prompt.hint,
                type: current.type,
                options: current.options ? current.options.map(optLabel) : current.options,
              }
            : null
        }
      />
    </main>
  );
}

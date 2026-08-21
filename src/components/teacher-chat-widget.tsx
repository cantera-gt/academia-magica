"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MySubjectTeacher } from "@/types/database";
import { SPRING_PLAYFUL } from "@/lib/motion";
import { speakText, stopSpeaking } from "@/lib/speech";
import { stripMarkdown } from "@/lib/text-sanitize";

// Voz neutra para cuando la materia todavia no tiene un profesor asignado
// (ej. Alemán, Arte, Música...) pero el alumno igual puede preguntar.
const NEUTRAL_VOICE = "es-ES-ElviraNeural";

// Respuestas rapidas para que arrancar la charla no dependa de escribir o
// hablar — util sobre todo para los mas chicos (4-7) que recien aprenden
// a escribir.
const QUICK_REPLIES = ["No entiendo la pregunta", "Dame una pista", "¿Cómo empiezo?"];

export interface TeacherChatExerciseContext {
    id?: string;
    prompt: string;
    hint?: string;
    type?: string;
    options?: string[] | null;
}

interface TeacherChatWidgetProps {
    subjectId: string;
    subjectName: string;
    subjectSlug?: string;
    topicId?: string;
    topicName?: string;
    teacher: MySubjectTeacher | null;
    studentName?: string;
    studentAge?: number | null;
    exercise?: TeacherChatExerciseContext | null;
}

interface ChatTurn {
    role: "user" | "assistant";
    content: string;
}

// Tipos minimos del Web Speech API (no forman parte de lib.dom.d.ts porque
// es una API no estandar todavia, pero esta soportada en Chrome/Edge/Android).
interface MinimalSpeechRecognitionEvent {
    results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface MinimalSpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}

interface SpeechRecognitionConstructor {
    new (): MinimalSpeechRecognition;
}

// Chequeo de soporte de reconocimiento de voz (Web Speech API), sin costo
// ni registro. No esta disponible en todos los navegadores (ej. Safari en
// iOS es poco confiable), asi que siempre dejamos el campo de texto como
// alternativa.
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function TeacherChatWidget({
    subjectId,
    subjectName,
    subjectSlug,
    topicId,
    topicName,
    teacher,
    studentName,
    studentAge,
    exercise,
}: TeacherChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatTurn[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [listening, setListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
        setMicSupported(!!getSpeechRecognition());
  }, []);

  const prevExerciseIdRef = useRef<string | undefined>(exercise?.id);
    useEffect(() => {
          const prevId = prevExerciseIdRef.current;
          const nextId = exercise?.id;
          if (prevId && nextId && prevId !== nextId) {
                  setMessages([]);
                  stopSpeaking();
          }
          prevExerciseIdRef.current = nextId;
    }, [exercise?.id]);

  useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
        return () => {
                stopSpeaking();
                recognitionRef.current?.stop();
        };
  }, []);

  function startListening() {
        const Recognition = getSpeechRecognition();
        if (!Recognition) return;
        const recognition = new Recognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
                const transcript = event.results[0]?.[0]?.transcript ?? "";
                setListening(false);
                if (transcript.trim()) sendMessage(transcript);
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
        setListening(true);
        recognition.start();
  }

  function stopListening() {
        recognitionRef.current?.stop();
        setListening(false);
  }

  async function sendMessage(rawText: string) {
        const question = rawText.trim();
        if (!question || loading) return;

      const FALLBACK = "Uy, se me trabó la lengua. ¿Me lo puedes preguntar de nuevo?";
        const nextMessages = [...messages, { role: "user" as const, content: question }];
        setMessages(nextMessages);
        setInputValue("");
        setLoading(true);
        setStreaming(false);
        stopSpeaking();

      try {
              const res = await fetch("/api/ask-teacher", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                                    question,
                                    subjectId,
                                    subjectName,
                                    subjectSlug,
                                    topicId,
                                    topicName,
                                    teacherName: teacher?.name ?? "tu profe",
                                    teacherNationality: teacher?.nationality,
                                    studentName,
                                    studentAge,
                                    exercise,
                                    history: nextMessages.slice(-6),
                        }),
              });

          if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as { error?: string } | null;
                    void data;
                    setMessages((m) => [...m, { role: "assistant", content: FALLBACK }]);
                    return;
          }

          const reader = res.body?.getReader();
              let finalText = "";

          if (reader) {
                    const decoder = new TextDecoder();
                    const first = await reader.read();
                    if (!first.done && first.value) finalText += decoder.decode(first.value, { stream: true });

                setStreaming(true);
                    setMessages((m) => [...m, { role: "assistant", content: finalText }]);

                if (!first.done) {
                            while (true) {
                                          const { done, value } = await reader.read();
                                          if (done) break;
                                          if (value) {
                                                          finalText += decoder.decode(value, { stream: true });
                                                          setMessages((m) => {
                                                                            const copy = [...m];
                                                                            copy[copy.length - 1] = { role: "assistant", content: finalText };
                                                                            return copy;
                                                          });
                                          }
                            }
                }
          } else {
                    finalText = await res.text();
                    setMessages((m) => [...m, { role: "assistant", content: finalText }]);
          }

          finalText = stripMarkdown(finalText);
              if (!finalText) {
                        finalText = FALLBACK;
              }
              setMessages((m) => {
                        const copy = [...m];
                        copy[copy.length - 1] = { role: "assistant", content: finalText };
                        return copy;
              });

          speakText(
                    finalText,
                    teacher?.voice_name ?? NEUTRAL_VOICE,
                    () => setSpeaking(true),
                    () => setSpeaking(false)
                  );
      } catch {
              setMessages((m) => [...m, { role: "assistant", content: FALLBACK }]);
      } finally {
              setLoading(false);
              setStreaming(false);
      }
  }

  function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        sendMessage(inputValue);
  }

  function replay(text: string) {
        speakText(text, teacher?.voice_name ?? NEUTRAL_VOICE, () => setSpeaking(true), () => setSpeaking(false));
  }

  return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
              <AnimatePresence>
                {open && (
                    <motion.div
                                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 16, scale: 0.95 }}
                                  transition={SPRING_PLAYFUL}
                                  className="flex h-[26rem] w-[21rem] max-w-[90vw] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
                                >
                                <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-3 text-white">
                                  {teacher ? (
                                                  <img
                                                                      src={teacher.image_url}
                                                                      alt={teacher.name}
                                                                      className="h-9 w-9 rounded-full object-cover"
                                                                    />
                                                ) : (
                                                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                                                                    🧑‍🏫
                                                  </span>
                                              )}
                                              <div className="flex-1 leading-tight">
                                                              <p className="text-sm font-bold">{teacher?.name ?? "Tu profe"}</p>
                                                              <p className="text-[11px] text-white/70">Pregúntame tus dudas</p>
                                              </div>
                                              <button
                                                                onClick={() => setOpen(false)}
                                                                className="rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white"
                                                                aria-label="Cerrar chat"
                                                              >
                                                              ✕
                                              </button>
                                </div>
                    
                                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
                                  {messages.length === 0 && (
                                                  <div className="space-y-2">
                                                                    <div className="rounded-2xl rounded-bl-none bg-slate-100 p-3 text-sm text-slate-600">
                                                                                        ¿Tienes una duda de {subjectName}? Pregúntame por texto o con el micrófono 🎤 —
                                                                                        te voy a ayudar a encontrar la respuesta tú mismo/a.
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                      {QUICK_REPLIES.map((qr) => (
                                                                          <button
                                                                                                    key={qr}
                                                                                                    type="button"
                                                                                                    onClick={() => sendMessage(qr)}
                                                                                                    disabled={loading}
                                                                                                    className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 disabled:opacity-40"
                                                                                                  >
                                                                            {qr}
                                                                          </button>
                                                                        ))}
                                                                    </div>
                                                  </div>
                                              )}
                                  {messages.map((m, i) => (
                                                  <div
                                                                      key={i}
                                                                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                                                    >
                                                                    <div
                                                                                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                                                                                                  m.role === "user"
                                                                                                                    ? "rounded-br-none bg-purple-600 text-white"
                                                                                                                    : "rounded-bl-none bg-slate-100 text-slate-700"
                                                                                            }`}
                                                                                        >
                                                                                        <p>{m.content}</p>
                                                                      {m.role === "assistant" && (
                                                                                                                <button
                                                                                                                                          onClick={() => replay(m.content)}
                                                                                                                                          className="mt-1 text-[11px] font-bold text-purple-500 hover:text-purple-700"
                                                                                                                                        >
                                                                                                                  {speaking ? "🔊 Hablando..." : "🔊 Escuchar"}
                                                                                                                  </button>
                                                                                        )}
                                                                    </div>
                                                  </div>
                                                ))}
                                  {loading && !streaming && (
                                                  <div className="flex justify-start">
                                                                    <div className="rounded-2xl rounded-bl-none bg-slate-100 px-3 py-2 text-sm text-slate-400">
                                                                                        Pensando...
                                                                    </div>
                                                  </div>
                                              )}
                                </div>
                    
                                <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 p-2">
                                              <button
                                                                type="button"
                                                                onClick={listening ? stopListening : startListening}
                                                                disabled={!micSupported || loading}
                                                                title={micSupported ? "Preguntar con la voz" : "Tu navegador no soporta el micrófono"}
                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-30 ${
                                                                                    listening ? "animate-pulse bg-red-500 text-white" : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                                                                }`}
                                                              >
                                                              🎤
                                              </button>
                                              <input
                                                                type="text"
                                                                value={inputValue}
                                                                onChange={(e) => setInputValue(e.target.value)}
                                                                placeholder={listening ? "Escuchando..." : "Escribe tu pregunta..."}
                                                                disabled={loading}
                                                                className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                                                              />
                                              <button
                                                                type="submit"
                                                                disabled={loading || !inputValue.trim()}
                                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white disabled:opacity-30"
                                                                aria-label="Enviar pregunta"
                                                              >
                                                              ➤
                                              </button>
                                </form>
                    </motion.div>
                  )}
              </AnimatePresence>
        
              <motion.button
                        onClick={() => setOpen((v) => !v)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        transition={SPRING_PLAYFUL}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-2xl text-white shadow-xl"
                        aria-label="Hablar con el profesor"
                      >
                {open ? "✕" : "🎤"}
              </motion.button>
        </div>
      );
}

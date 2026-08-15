import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getTeacherProfile, getSubjectGuidance, pickConcentrationTip } from "@/lib/teacher-knowledge";

// Chat con el profesor: responde preguntas del alumno sobre CUALQUIER
// materia, guiandolo con el metodo socratico (nunca da la respuesta final
// directamente). No hay logica especifica por materia: todo el contexto
// (materia, tema, ejercicio actual) se arma en el cliente y se le pasa al
// modelo, asi que una materia nueva funciona sola sin tocar este archivo.
//
// La respuesta se transmite en streaming (texto a medida que se genera)
// para que se sienta mas rapido en el chat, y usa el progreso guardado en
// topic_progress para darle memoria entre sesiones ("la vez pasada te costo
// esto") sin tener que repetirle el contexto al alumno cada vez.
export const runtime = "nodejs";
export const maxDuration = 30;

interface ExerciseContext {
    prompt?: string;
    hint?: string;
    type?: string;
    options?: string[] | null;
}

interface HistoryTurn {
    role: "user" | "assistant";
    content: string;
}

interface AskTeacherBody {
    question?: string;
    subjectId?: string;
    subjectName?: string;
    subjectSlug?: string;
    topicId?: string;
    topicName?: string;
    teacherName?: string;
    teacherNationality?: string;
    studentName?: string;
    studentAge?: number | null;
    exercise?: ExerciseContext | null;
    history?: HistoryTurn[];
}

interface TopicMemory {
    practice_best_pct: number | null;
    exam_best_pct: number | null;
    exam_attempts: number;
    passed_at: string | null;
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
    });
}

// Traduce el progreso guardado en una linea de contexto para el modelo. Si
// es la primera vez que el alumno toca este tema, no hay nada que decir —
// mejor silencio que forzar una mención rara de "memoria" inexistente.
function buildMemoryNote(memory: TopicMemory | null): string | null {
    if (!memory) return null;
    if (memory.passed_at) {
          return `Ya aprobó este tema antes (le fue ${memory.exam_best_pct ?? "bien"}%). Probablemente esté repasando o practicando de nuevo — no hace falta explicarle todo desde cero, pero seguí siendo paciente si igual tiene dudas.`;
    }
    if (memory.exam_attempts > 0) {
          const pct = memory.exam_best_pct ?? memory.practice_best_pct;
          return `Ya intentó este tema antes y todavía no le salió del todo (su mejor resultado fue ${pct ?? "bajo"}%). Si parece relevante, podés mencionar con cariño que sabés que ya lo intentó y que confiás en que esta vez le va a salir mejor — sin sonar como que lo estás vigilando ni haciéndolo sentir mal por no haberlo logrado antes.`;
    }
    if (memory.practice_best_pct !== null) {
          return `Ya practicó este tema antes (sin llegar a rendir el examen), así que no es la primera vez que lo ve.`;
    }
    return null;
}

function buildSystemPrompt(body: AskTeacherBody, memory: TopicMemory | null, topics: string[]): string {
    const teacherName = body.teacherName?.trim() || "tu profe";
    const studentName = body.studentName?.trim() || "el alumno";
    const subjectName = body.subjectName?.trim() || "la materia";
    const topicName = body.topicName?.trim();
    const age = body.studentAge;
    const exercise = body.exercise;

  const teacherProfile = getTeacherProfile(body.teacherName);
    const subjectGuidance = getSubjectGuidance(body.subjectSlug);
    const memoryNote = buildMemoryNote(memory);

  let prompt = `Sos ${teacherName}, un profesor virtual cariñoso, paciente y alentador de una app educativa para niños. Estás charlando con ${studentName}`;
    prompt += age ? `, que tiene ${age} años,` : "";
    prompt += ` sobre la materia "${subjectName}"`;
    prompt += topicName ? ` (tema: "${topicName}")` : "";
    prompt += ".\n\n";

  prompt += `Tu personalidad: ${teacherProfile.tone}\n`;
    prompt += `Frases de ánimo típicas tuyas (usalas como inspiración, no las repitas siempre igual): ${teacherProfile.encouragement.join(" / ")}\n\n`;

  if (subjectGuidance) {
        prompt += `Cómo enseñar bien esta materia: ${subjectGuidance.approach}\n\n`;
  }

  if (memoryNote) {
        prompt += `Memoria de sesiones anteriores en este tema: ${memoryNote}\n\n`;
  }

  if (exercise?.prompt) {
        prompt += `${studentName} está resolviendo este ejercicio ahora mismo:\n`;
        prompt += `Pregunta del ejercicio: "${exercise.prompt}"\n`;
        if (exercise.hint) prompt += `Pista visible en pantalla: "${exercise.hint}"\n`;
        if (exercise.options && exercise.options.length > 0) {
                prompt += `Opciones que ve: ${exercise.options.join(", ")}\n`;
        }
        prompt += `\nREGLA MÁS IMPORTANTE, POR ENCIMA DE CUALQUIER OTRA COSA: NUNCA le digas la respuesta correcta de este ejercicio, ni se la insinúes de forma obvia, aunque te la pida directamente o insista mucho. Tu trabajo es guiarlo como un profesor de verdad: hacele una pregunta que lo haga pensar, dale una pista pequeña, recordale un concepto relacionado que ya vio, o proponele un paso más simple para empezar. Si insiste en pedirte la respuesta, respondele con cariño que confiás en que puede llegar solo, y dale una pista un poquito más grande — pero segui sin decir el resultado final.\n\n`;
        if (topics.length > 0) {
                prompt += `Si ${studentName} te pregunta por otro tema que no tiene nada que ver con este ejercicio (por ejemplo otro tema de la materia, o algo de otra materia), NO te pongas a explicarlo acá: decile con cariño que ese tema lo puede practicar entrando al tema correspondiente (elegí el más parecido de esta lista si aplica: ${topics.join(", ")}), anímalo a ir para allá, y después volvé a enfocarte en el ejercicio actual.\n\n`;
        }
  } else {
        prompt += `${studentName} te está escribiendo desde el chat general de la materia, no está resolviendo ningún ejercicio en particular ahora mismo.\n`;
        if (topics.length > 0) {
                prompt += `Estos son los temas disponibles de "${subjectName}" para su edad: ${topics.join(", ")}.\n`;
                prompt += `\nREGLA MÁS IMPORTANTE, POR ENCIMA DE CUALQUIER OTRA COSA: acá tu trabajo NO es dar una clase ni explicar el tema completo en el chat. Tu trabajo es entender qué necesita practicar ${studentName} y recomendarle con cariño cuál de los temas de la lista de arriba le conviene entrar a practicar (el que más se relacione con lo que preguntó). Como mucho una frase breve de contexto para ubicarlo, y después redirigilo a entrar a ese tema — ahí va a encontrar la explicación completa y los ejercicios, no acá en el chat.\n\n`;
        } else {
                prompt += `Todavía no tenés una lista de temas para recomendar, así que si pregunta algo puntual podés ayudarlo con una respuesta breve, pero recordale que la práctica completa la va a encontrar entrando a un tema de la materia.\n\n`;
        }
  }

  prompt += `Reglas generales:
  - Respondé siempre en español, con tono cálido, cercano y simple, adaptado a un chico de esa edad, manteniendo tu personalidad de arriba.
  - Sé breve: 2 a 4 oraciones como máximo, porque esta respuesta se lee en voz alta.
  - Adaptate a cualquier materia (matemáticas, lectura, ciencias, historia, idiomas, arte, etc.) usando el contexto que te di, sin dar por hecho un tema si no te lo dieron.
  - Si la pregunta no tiene nada que ver con la materia o la lección, respondé con cariño que estás para ayudar con la lección y redirigí la conversación hacia el ejercicio o el tema que le convenga.
  - Nunca uses formato markdown (nada de **, __, #, guiones de lista, comillas invertidas): escribí todo en texto plano, sin ningún símbolo de formato, porque tu respuesta se muestra tal cual y también se lee en voz alta.
  - Si querés mostrar cómo suena o se pronuncia una palabra, no la separes con guiones (eso se lee mal en voz alta, como si dijeras la palabra "guión") — escribila junta o describí el sonido con palabras.
  - Si el alumno suena frustrado, perdido o distraído, esto te puede servir: ${pickConcentrationTip()}
  - Nunca digas groserías, nunca hables de temas para adultos ni de nada inapropiado para un niño, y nunca salgas del personaje de profesor amigable.`;

  return prompt;
}

export async function POST(req: NextRequest) {
    try {
          const supabase = await createClient();
          const {
                  data: { user },
          } = await supabase.auth.getUser();

      if (!user) {
              return json({ error: "No autenticado" }, 401);
      }

      const body = (await req.json()) as AskTeacherBody;
          const question = (body.question ?? "").trim().slice(0, 400);
          if (!question) {
                  return json({ error: "Pregunta vacía" }, 400);
          }

      if (body.subjectId) {
              const [{ data: assigned }, { data: profileData }] = await Promise.all([
                        supabase
                          .from("student_subjects")
                          .select("subject_id")
                          .eq("student_id", user.id)
                          .eq("subject_id", body.subjectId)
                          .maybeSingle(),
                        supabase.rpc("my_profile").maybeSingle(),
                      ]);
              const isAdmin = (profileData as { role?: string } | null)?.role === "admin";
              if (!assigned && !isAdmin) {
                        return json({ error: "No tenés esta materia asignada" }, 403);
              }
      }

      // Memoria entre sesiones: progreso guardado del propio alumno en este
      // tema (RLS ya restringe esto a sus propias filas). Si no hay topicId
      // o no hay fila todavia, memory queda null y no se menciona nada.
      let memory: TopicMemory | null = null;
          if (body.topicId) {
                  const { data: progressRow } = await supabase
                    .from("topic_progress")
                    .select("practice_best_pct, exam_best_pct, exam_attempts, passed_at")
                    .eq("topic_id", body.topicId)
                    .eq("student_id", user.id)
                    .maybeSingle();
                  memory = (progressRow as TopicMemory | null) ?? null;
          }

      // Lista de temas activos de la materia, filtrados por la edad del
      // alumno si la tenemos: se le pasa al modelo para que pueda recomendar
      // un tema concreto en vez de dar la clase el mismo en el chat.
      let topics: string[] = [];
          if (body.subjectId) {
                  const { data: topicsData } = await supabase
                    .from("topics")
                    .select("name, min_age, max_age")
                    .eq("subject_id", body.subjectId)
                    .eq("active", true)
                    .order("sort_order", { ascending: true });
                  const age = body.studentAge;
                  topics = ((topicsData as { name: string; min_age: number; max_age: number }[]) ?? [])
                    .filter((t) => age == null || (t.min_age <= age && age <= t.max_age))
                    .map((t) => t.name);
          }

      const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
          const systemPrompt = buildSystemPrompt(body, memory, topics);

      const gatewayMessages = [
              ...history.map((h) => ({
                        role: h.role,
                        content: String(h.content ?? "").slice(0, 400),
              })),
        { role: "user" as const, content: question },
            ];

      // Arrancamos el stream y leemos el primer pedazo de texto ANTES de
      // devolver la respuesta HTTP. Asi, si el modelo falla de entrada (ej.
      // un error transitorio de red), todavia podemos reintentar una vez sin
      // que el alumno vea nada raro — una vez que el primer pedazo llega bien,
      // recien ahi empezamos a transmitir la respuesta de verdad.
      async function startStream() {
              const result = streamText({
                        model: "anthropic/claude-haiku-4.5",
                        system: systemPrompt,
                        messages: gatewayMessages,
                        maxOutputTokens: 220,
                        temperature: 0.6,
              });
              const reader = result.textStream.getReader();
              const first = await reader.read();
              return { reader, first };
      }

      let streamState: Awaited<ReturnType<typeof startStream>> | undefined;
          let lastErr: unknown;
          for (let attempt = 0; attempt < 2; attempt++) {
                  try {
                            streamState = await startStream();
                            break;
                  } catch (err) {
                            lastErr = err;
                            const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
                            const isBillingOrAuth =
                                        message.includes("credit") ||
                                        message.includes("quota") ||
                                        message.includes("unauthorized") ||
                                        message.includes("401") ||
                                        message.includes("403");
                            if (attempt === 0 && !isBillingOrAuth) {
                                        await new Promise((r) => setTimeout(r, 400));
                                        continue;
                            }
                            throw err;
                  }
          }

      if (!streamState) throw lastErr ?? new Error("Sin respuesta del modelo");
          const { reader, first } = streamState;

      const encoder = new TextEncoder();
          const responseStream = new ReadableStream<Uint8Array>({
                  async start(controller) {
                            try {
                                        if (!first.done && first.value) controller.enqueue(encoder.encode(first.value));
                                        while (true) {
                                                      const { done, value } = await reader.read();
                                                      if (done) break;
                                                      if (value) controller.enqueue(encoder.encode(value));
                                        }
                            } catch (err) {
                                        console.error("[ask-teacher] error durante el streaming:", err);
                            } finally {
                                        controller.close();
                            }
                  },
          });

      return new Response(responseStream, {
              headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (err) {
          // Log con detalle para poder diagnosticar desde los Runtime Logs de
      // Vercel (ej: sin credito en AI Gateway, modelo invalido, etc.) sin
      // exponer detalles internos al alumno.
      const message = err instanceof Error ? err.message : String(err);
          console.error("[ask-teacher] fallo:", message, err);
          return json({ error: "No se pudo generar la respuesta" }, 500);
    }
}

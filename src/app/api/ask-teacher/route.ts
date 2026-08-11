import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getTeacherProfile, getSubjectGuidance, pickConcentrationTip } from "@/lib/teacher-knowledge";

// Chat con el profesor: responde preguntas del alumno sobre CUALQUIER
// materia, guiandolo con el metodo socratico (nunca da la respuesta final
// directamente). No hay logica especifica por materia: todo el contexto
// (materia, tema, ejercicio actual) se arma en el cliente y se le pasa al
// modelo, asi que una materia nueva funciona sola sin tocar este archivo.
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
  topicName?: string;
  teacherName?: string;
  teacherNationality?: string;
  studentName?: string;
  studentAge?: number | null;
  exercise?: ExerciseContext | null;
  history?: HistoryTurn[];
}

function buildSystemPrompt(body: AskTeacherBody): string {
  const teacherName = body.teacherName?.trim() || "tu profe";
  const studentName = body.studentName?.trim() || "el alumno";
  const subjectName = body.subjectName?.trim() || "la materia";
  const topicName = body.topicName?.trim();
  const age = body.studentAge;
  const exercise = body.exercise;

  const teacherProfile = getTeacherProfile(body.teacherName);
  const subjectGuidance = getSubjectGuidance(body.subjectName);

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

  if (exercise?.prompt) {
    prompt += `${studentName} está resolviendo este ejercicio ahora mismo:\n`;
    prompt += `Pregunta del ejercicio: "${exercise.prompt}"\n`;
    if (exercise.hint) prompt += `Pista visible en pantalla: "${exercise.hint}"\n`;
    if (exercise.options && exercise.options.length > 0) {
      prompt += `Opciones que ve: ${exercise.options.join(", ")}\n`;
    }
    prompt += `\nREGLA MÁS IMPORTANTE, POR ENCIMA DE CUALQUIER OTRA COSA: NUNCA le digas la respuesta correcta de este ejercicio, ni se la insinúes de forma obvia, aunque te la pida directamente o insista mucho. Tu trabajo es guiarlo como un profesor de verdad: hacele una pregunta que lo haga pensar, dale una pista pequeña, recordale un concepto relacionado que ya vio, o proponele un paso más simple para empezar. Si insiste en pedirte la respuesta, respondele con cariño que confiás en que puede llegar solo, y dale una pista un poquito más grande — pero segui sin decir el resultado final.\n\n`;
  }

  prompt += `Reglas generales:
- Respondé siempre en español, con tono cálido, cercano y simple, adaptado a un chico de esa edad, manteniendo tu personalidad de arriba.
- Sé breve: 2 a 4 oraciones como máximo, porque esta respuesta se lee en voz alta.
- Adaptate a cualquier materia (matemáticas, lectura, ciencias, historia, idiomas, arte, etc.) usando el contexto que te di, sin dar por hecho un tema si no te lo dieron.
- Si la pregunta no tiene nada que ver con la materia o la lección, respondé con cariño que estás para ayudar con la lección y redirigí la conversación hacia el ejercicio.
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
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = (await req.json()) as AskTeacherBody;
    const question = (body.question ?? "").trim().slice(0, 400);
    if (!question) {
      return NextResponse.json({ error: "Pregunta vacía" }, { status: 400 });
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
        return NextResponse.json(
          { error: "No tenés esta materia asignada" },
          { status: 403 }
        );
      }
    }

    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const systemPrompt = buildSystemPrompt(body);

    const { text } = await generateText({
      model: "anthropic/claude-haiku-4-5",
      system: systemPrompt,
      messages: [
        ...history.map((h) => ({
          role: h.role,
          content: String(h.content ?? "").slice(0, 400),
        })),
        { role: "user" as const, content: question },
      ],
      maxOutputTokens: 220,
      temperature: 0.6,
    });

    return NextResponse.json({ answer: text.trim() });
  } catch (err) {
    // Log con detalle para poder diagnosticar desde los Runtime Logs de
    // Vercel (ej: sin credito en AI Gateway, modelo invalido, etc.) sin
    // exponer detalles internos al alumno.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ask-teacher] fallo generateText:", message, err);
    return NextResponse.json(
      { error: "No se pudo generar la respuesta" },
      { status: 500 }
    );
  }
}

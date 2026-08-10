import type { SubjectTopic } from "@/types/database";

// Motor de recomendaciones del profesor: puramente derivado de los datos que
// ya devuelve subject_topics (ordenados por edad recomendada). No conoce
// nombres de materias/temas de antemano -> si mañana se agregan mas temas o
// mas materias, esto se actualiza solo, sin tocar codigo.

export type RecommendationOptionKind = "continue" | "review" | "next" | "replay";

export interface RecommendationOption {
  kind: RecommendationOptionKind;
  topic: SubjectTopic;
  label: string;
  reason: string;
}

export interface TeacherRecommendation {
  kind: "first_time" | "continue" | "mixed" | "all_done" | "no_content";
  message: string;
  options: RecommendationOption[];
}

const PASS_THRESHOLD = 60;
const REVIEW_THRESHOLD = 80; // por debajo de esto, aunque haya aprobado, conviene repasar

function hasContent(t: SubjectTopic): boolean {
  return t.practice_count + t.exam_count > 0;
}

function wasTouched(t: SubjectTopic): boolean {
  return t.last_played_at != null || t.practice_best_pct != null || t.exam_attempts > 0;
}

export function computeTeacherRecommendation(
  topics: SubjectTopic[],
  studentName: string,
  subjectName: string
): TeacherRecommendation {
  const playable = topics.filter(hasContent);

  if (playable.length === 0) {
    return {
      kind: "no_content",
      message: `Todavía estoy preparando el material de ${subjectName}. ¡Volvé pronto! 🚧`,
      options: [],
    };
  }

  const touched = playable.filter(wasTouched);

  if (touched.length === 0) {
    const first = playable[0];
    return {
      kind: "first_time",
      message: `¡Hola ${studentName}! Es tu primera vez en ${subjectName}. Empecemos por «${first.name}» 🚀`,
      options: [
        {
          kind: "next",
          topic: first,
          label: `Empezar «${first.name}»`,
          reason:
            first.recommended_age != null
              ? `Recomendado desde los ${first.recommended_age} años`
              : "Primer tema",
        },
      ],
    };
  }

  const lastTouched = [...touched].sort((a, b) =>
    (b.last_played_at ?? "").localeCompare(a.last_played_at ?? "")
  )[0];

  const reviewCandidates = playable
    .filter(
      (t) =>
        t.exam_attempts > 0 &&
        (t.exam_best_pct == null || t.exam_best_pct < REVIEW_THRESHOLD)
    )
    .sort((a, b) => (a.exam_best_pct ?? 0) - (b.exam_best_pct ?? 0));

  const nextNew = playable.find((t) => !touched.includes(t));

  const options: RecommendationOption[] = [];

  if (!lastTouched.passed) {
    options.push({
      kind: "continue",
      topic: lastTouched,
      label: `Seguir con «${lastTouched.name}»`,
      reason: "Es donde te quedaste",
    });
  }

  for (const rc of reviewCandidates) {
    if (options.some((o) => o.topic.topic_id === rc.topic_id)) continue;
    options.push({
      kind: "review",
      topic: rc,
      label: `Repasar «${rc.name}»`,
      reason:
        rc.exam_best_pct != null
          ? `Tu mejor resultado: ${rc.exam_best_pct}%`
          : "Todavía no lo aprobaste",
    });
    if (options.length >= 2) break;
  }

  if (nextNew && options.length < 3) {
    options.push({
      kind: "next",
      topic: nextNew,
      label: `Empezar «${nextNew.name}»`,
      reason:
        nextNew.recommended_age != null
          ? `Recomendado desde los ${nextNew.recommended_age} años`
          : "Tema nuevo",
    });
  }

  if (options.length === 0) {
    return {
      kind: "all_done",
      message: `¡Hola ${studentName}! Completaste todos los temas de ${subjectName} que tengo para vos. ¡Sos un crack! 🏆 Mientras preparo más, podés repasar cualquiera para practicar.`,
      options: playable.map((t) => ({
        kind: "replay",
        topic: t,
        label: `Repasar «${t.name}»`,
        reason: t.exam_best_stars > 0 ? "⭐".repeat(t.exam_best_stars) : "Repasar",
      })),
    };
  }

  const primary = options[0];
  let message: string;
  if (primary.kind === "continue") {
    message = `¡Hola ${studentName}! La última vez te quedaste en «${lastTouched.name}». ¿Seguimos? 💪`;
  } else if (primary.kind === "review") {
    message = `¡Hola ${studentName}! Vi que «${primary.topic.name}» te costó un poco${
      primary.topic.exam_best_pct != null ? ` (sacaste ${primary.topic.exam_best_pct}%)` : ""
    }. ¿Lo repasamos?`;
  } else {
    message = `¡Hola ${studentName}! ¿Qué te parece si hoy hacemos «${primary.topic.name}»?`;
  }

  if (
    reviewCandidates.length > 0 &&
    primary.kind !== "review" &&
    options.every((o) => o.topic.topic_id !== reviewCandidates[0].topic_id)
  ) {
    message += ` También podrías repasar «${reviewCandidates[0].name}» si querés reforzarlo.`;
  }

  return {
    kind: options.length > 1 ? "mixed" : "continue",
    message,
    options: options.slice(0, 3),
  };
}

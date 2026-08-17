"use client";

// "Mision tematica" por materia: un fondo (gradiente CSS, sin arte nuevo) +
// un marco narrativo (icono + nombre de mision + "unidad" que se va
// consiguiendo con cada ejercicio) para que resolver ejercicios se sienta
// como una mision con objetivo en vez de una tarjeta suelta. No depende de
// ilustraciones: solo gradientes Tailwind y emoji.
export interface SubjectTheme {
  gradient: string;
  icon: string;
  missionLabel: string;
  unitLabel: string;
  unitLabelPlural: string;
}

const DEFAULT_THEME: SubjectTheme = {
  gradient: "from-indigo-500 via-purple-500 to-fuchsia-500",
  icon: "🌟",
  missionLabel: "Misión mágica",
  unitLabel: "Estrella",
  unitLabelPlural: "estrellas",
};

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  matematicas: {
    gradient: "from-indigo-600 via-blue-600 to-cyan-500",
    icon: "🪐",
    missionLabel: "Misión espacial",
    unitLabel: "Planeta",
    unitLabelPlural: "planetas",
  },
  geometria: {
    gradient: "from-violet-600 via-indigo-600 to-blue-600",
    icon: "🔷",
    missionLabel: "Misión geométrica",
    unitLabel: "Figura",
    unitLabelPlural: "figuras",
  },
  fracciones: {
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    icon: "🍕",
    missionLabel: "Misión de fracciones",
    unitLabel: "Porción",
    unitLabelPlural: "porciones",
  },
  logica: {
    gradient: "from-slate-700 via-indigo-700 to-blue-700",
    icon: "🧩",
    missionLabel: "Misión de lógica",
    unitLabel: "Pista",
    unitLabelPlural: "pistas",
  },
  "ciencias-naturales": {
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    icon: "🌿",
    missionLabel: "Misión de campo",
    unitLabel: "Muestra",
    unitLabelPlural: "muestras",
  },
  fisica: {
    gradient: "from-cyan-600 via-sky-600 to-blue-600",
    icon: "⚡",
    missionLabel: "Misión de física",
    unitLabel: "Experimento",
    unitLabelPlural: "experimentos",
  },
  quimica: {
    gradient: "from-teal-600 via-emerald-600 to-lime-600",
    icon: "🧪",
    missionLabel: "Misión de química",
    unitLabel: "Pócima",
    unitLabelPlural: "pócimas",
  },
  "cuerpo-humano": {
    gradient: "from-rose-600 via-red-500 to-orange-500",
    icon: "🫀",
    missionLabel: "Misión del cuerpo humano",
    unitLabel: "Órgano",
    unitLabelPlural: "órganos",
  },
  tecnologia: {
    gradient: "from-slate-800 via-indigo-800 to-blue-700",
    icon: "🤖",
    missionLabel: "Misión tecnológica",
    unitLabel: "Circuito",
    unitLabelPlural: "circuitos",
  },
  historia: {
    gradient: "from-amber-700 via-orange-600 to-yellow-600",
    icon: "🏺",
    missionLabel: "Misión en el tiempo",
    unitLabel: "Reliquia",
    unitLabelPlural: "reliquias",
  },
  geografia: {
    gradient: "from-emerald-600 via-teal-500 to-sky-600",
    icon: "🗺️",
    missionLabel: "Misión exploradora",
    unitLabel: "Territorio",
    unitLabelPlural: "territorios",
  },
  civica: {
    gradient: "from-blue-700 via-indigo-600 to-violet-600",
    icon: "🏛️",
    missionLabel: "Misión cívica",
    unitLabel: "Ley",
    unitLabelPlural: "leyes",
  },
  cultura: {
    gradient: "from-orange-600 via-amber-500 to-rose-500",
    icon: "🎭",
    missionLabel: "Misión cultural",
    unitLabel: "Tradición",
    unitLabelPlural: "tradiciones",
  },
  espanol: {
    gradient: "from-red-600 via-orange-500 to-amber-500",
    icon: "📖",
    missionLabel: "Misión de las palabras",
    unitLabel: "Página",
    unitLabelPlural: "páginas",
  },
  ingles: {
    gradient: "from-blue-700 via-indigo-600 to-sky-500",
    icon: "🗣️",
    missionLabel: "English Mission",
    unitLabel: "Word",
    unitLabelPlural: "words",
  },
  aleman: {
    gradient: "from-slate-700 via-zinc-700 to-red-600",
    icon: "🗣️",
    missionLabel: "Deutsche Mission",
    unitLabel: "Wort",
    unitLabelPlural: "Wörter",
  },
  lectura: {
    gradient: "from-amber-600 via-orange-500 to-red-500",
    icon: "📚",
    missionLabel: "Misión lectora",
    unitLabel: "Capítulo",
    unitLabelPlural: "capítulos",
  },
  escritura: {
    gradient: "from-fuchsia-600 via-rose-500 to-orange-500",
    icon: "✍️",
    missionLabel: "Misión creativa",
    unitLabel: "Historia",
    unitLabelPlural: "historias",
  },
  "pensamiento-critico": {
    gradient: "from-slate-800 via-slate-700 to-indigo-700",
    icon: "🕵️",
    missionLabel: "Misión detective",
    unitLabel: "Caso",
    unitLabelPlural: "casos",
  },
  "resolucion-problemas": {
    gradient: "from-indigo-700 via-purple-700 to-fuchsia-600",
    icon: "🧩",
    missionLabel: "Misión de desafíos",
    unitLabel: "Desafío",
    unitLabelPlural: "desafíos",
  },
  arte: {
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    icon: "🎨",
    missionLabel: "Misión artística",
    unitLabel: "Obra",
    unitLabelPlural: "obras",
  },
  "educacion-fisica": {
    gradient: "from-emerald-500 via-lime-500 to-teal-500",
    icon: "🏅",
    missionLabel: "Misión deportiva",
    unitLabel: "Medalla",
    unitLabelPlural: "medallas",
  },
  musica: {
    gradient: "from-purple-600 via-fuchsia-600 to-pink-500",
    icon: "🎵",
    missionLabel: "Misión musical",
    unitLabel: "Nota",
    unitLabelPlural: "notas",
  },
};

export function subjectThemeOf(slug: string | null | undefined): SubjectTheme {
  if (!slug) return DEFAULT_THEME;
  return SUBJECT_THEMES[slug] ?? DEFAULT_THEME;
}

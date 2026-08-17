"use client";

import type { VisualTheme } from "@/types/database";

// Tema visual del alumno: cambia gradientes/iconos de la interfaz (NO las
// ilustraciones de la tienda, que siguen siendo las mismas). Pensado para
// que un varon o una nena de 10 anios que no quiere "todo rosa" pueda
// elegir un aire espacial o deportivo sin que tengamos que dibujar assets
// nuevos.
export interface ThemeConfig {
  key: VisualTheme;
  label: string;
  emoji: string;
  headerGradient: string;
  accentSolid: string;
  accentText: string;
  pickerGradient: string;
}

export const THEMES: Record<VisualTheme, ThemeConfig> = {
  princesa: {
    key: "princesa",
    label: "Princesa",
    emoji: "👑",
    headerGradient: "from-fuchsia-500 to-purple-600",
    accentSolid: "bg-purple-600",
    accentText: "text-purple-700",
    pickerGradient: "from-fuchsia-400 to-purple-500",
  },
  espacial: {
    key: "espacial",
    label: "Espacial",
    emoji: "🚀",
    headerGradient: "from-indigo-900 via-blue-800 to-slate-900",
    accentSolid: "bg-indigo-700",
    accentText: "text-indigo-700",
    pickerGradient: "from-indigo-700 via-blue-700 to-slate-800",
  },
  deportivo: {
    key: "deportivo",
    label: "Deportivo",
    emoji: "⚽",
    headerGradient: "from-emerald-500 to-teal-600",
    accentSolid: "bg-emerald-600",
    accentText: "text-emerald-700",
    pickerGradient: "from-emerald-400 to-teal-500",
  },
};

export function themeOf(visualTheme: VisualTheme | null | undefined): ThemeConfig {
  return THEMES[visualTheme ?? "princesa"] ?? THEMES.princesa;
}

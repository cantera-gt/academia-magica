"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AgeBracket, MyProfile } from "@/types/database";

// La edad del alumno solo se usaba en la pagina de materia, con estas dos
// funciones duplicadas en dos archivos. Viven aqui para que el recreo pueda
// adaptar la dificultad sin volver a copiarlas.

export function approxAgeFromBracket(bracket: AgeBracket | string | null | undefined): number | null {
  if (!bracket) return null;
  if (bracket === "4-7") return 5;
  if (bracket === "7-10") return 8;
  if (bracket === "10-12") return 11;
  return null;
}

export function ageFromBirthdate(birthdate: string | null | undefined): number | null {
  if (!birthdate) return null;
  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

// Edad efectiva: manda la fecha de nacimiento; si no hay, se aproxima por
// tramo; si tampoco, null.
export function studentAgeOf(
  profile: { birthdate?: string | null; age_bracket?: AgeBracket | null } | null | undefined
): number | null {
  if (!profile) return null;
  return ageFromBirthdate(profile.birthdate) ?? approxAgeFromBracket(profile.age_bracket);
}

// Tres tramos, no cinco. Con 4 a 12 anos, mas granularidad da la ilusion de
// precision sin mejorar la experiencia, y multiplica lo que hay que probar.
//   peque  4-6   leen poco o nada, memoria de trabajo corta, motricidad fina
//                aun en desarrollo: menos piezas, mas tiempo, menos castigo.
//   medio  7-8   es la dificultad que tenian TODOS los juegos hasta ahora,
//                asi que un nino de esta edad no nota ningun cambio.
//   mayor  9+    el juego de medio se les queda corto y lo abandonan.
export type Difficulty = "peque" | "medio" | "mayor";

export function difficultyForAge(age: number | null | undefined): Difficulty {
  if (age == null) return "medio"; // sin dato, el termino medio conocido
  if (age <= 6) return "peque";
  if (age <= 8) return "medio";
  return "mayor";
}

// Elige entre tres valores segun el tramo. Azucar para que cada juego declare
// su tabla de dificultad en una linea legible.
export function byDifficulty<T>(d: Difficulty, peque: T, medio: T, mayor: T): T {
  return d === "peque" ? peque : d === "mayor" ? mayor : medio;
}

// Carga el perfil del alumno y devuelve su tramo. Arranca en "medio" para
// que el juego sea jugable desde el primer fotograma: si la red tarda, el
// nino no se queda mirando una pantalla vacia, y al llegar el perfil la
// siguiente partida ya usa su dificultad.
export function useStudentDifficulty(): { difficulty: Difficulty; age: number | null } {
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase
      .rpc("my_profile")
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setAge(studentAgeOf(data as MyProfile | null));
      });
    return () => {
      alive = false;
    };
  }, []);

  return { difficulty: difficultyForAge(age), age };
}

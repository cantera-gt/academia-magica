"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SPRING_PLAYFUL, EASE_OUT } from "@/lib/motion";

// Racha diaria: dias seguidos con al menos un intento. A diferencia de los
// diamantes (moneda que se gasta), la racha y el nivel/XP nunca bajan solos
// -- son el "progreso permanente" que hace que volver todos los dias se
// sienta valioso (mismo principio que usan Duolingo/Prodigy).
export function StreakBadge({ value }: { value: number }) {
  const [popping, setPopping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value > prev.current) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 450);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  if (value <= 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-400">
        <span className="text-base grayscale">🔥</span>
        Empezá tu racha hoy
      </div>
    );
  }

  return (
    <motion.div
      animate={popping ? { scale: [1, 1.3, 1] } : { scale: 1 }}
      transition={SPRING_PLAYFUL}
      className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-extrabold text-orange-600"
    >
      <span className="text-base">🔥</span>
      {value} {value === 1 ? "día" : "días"} seguidos
    </motion.div>
  );
}

export function LevelBar({
  level,
  title,
  xpInto,
  xpNeeded,
}: {
  level: number;
  title: string | null;
  xpInto: number;
  xpNeeded: number | null;
}) {
  const pct = xpNeeded && xpNeeded > 0 ? Math.min(1, xpInto / xpNeeded) : 1;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
        {level}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-500">
          Nivel {level}
          {title ? ` · ${title}` : ""}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: pct }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

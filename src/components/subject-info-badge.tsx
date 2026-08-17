"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Circulo azul "i" al lado del nombre de una materia: al tocarlo muestra una
// frase corta de que se trabaja ahi. Vive casi siempre DENTRO de un <label>
// que envuelve un checkbox (para elegir la materia), asi que hay que frenar
// el click con preventDefault/stopPropagation para que no dispare el toggle
// del checkbox por error.
export default function SubjectInfoBadge({ description }: { description: string | null }) {
  const [open, setOpen] = useState(false);
  if (!description) return null;

  return (
    <span className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Más información sobre esta materia"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold leading-none text-white shadow-sm transition hover:bg-sky-600"
      >
        i
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 top-full z-50 mt-1.5 w-52 -translate-x-1/2 rounded-xl bg-slate-800 p-2.5 text-left text-xs font-normal leading-snug text-white shadow-xl"
            >
              {description}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}

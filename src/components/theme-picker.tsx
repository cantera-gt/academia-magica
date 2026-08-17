"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { THEMES } from "@/lib/theme";
import type { VisualTheme } from "@/types/database";
import { SPRING_PLAYFUL, fadeOnly } from "@/lib/motion";

// Boton "cambiar estilo" + modal simple con las 3 opciones. Se usa en el
// header de inicio/tienda/cuarto para que cualquier alumno (nuevo o ya
// creado) pueda elegir su onda sin pasar por el flujo de "elegir personaje".
export default function ThemePicker({
  current,
  onChange,
}: {
  current: VisualTheme;
  onChange: (t: VisualTheme) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pick(t: VisualTheme) {
    if (t === current) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ visual_theme: t }).eq(
      "id",
      (await supabase.auth.getUser()).data.user?.id ?? ""
    );
    setSaving(false);
    if (!error) {
      onChange(t);
      setOpen(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={SPRING_PLAYFUL}
        className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur"
      >
        🎨 Estilo
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeOnly}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_PLAYFUL}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-center text-lg font-extrabold text-slate-800">
                Elegí tu estilo
              </h3>
              <p className="mt-1 text-center text-sm text-slate-500">
                Cambia los colores de tu app. Podés cambiarlo cuando quieras.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3">
                {Object.values(THEMES).map((t) => (
                  <motion.button
                    key={t.key}
                    disabled={saving}
                    onClick={() => pick(t.key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_PLAYFUL}
                    className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${t.pickerGradient} p-4 text-left text-white shadow ${
                      current === t.key ? "ring-4 ring-offset-2 ring-slate-300" : ""
                    }`}
                  >
                    <span className="text-3xl">{t.emoji}</span>
                    <span className="text-base font-bold">{t.label}</span>
                    {current === t.key && <span className="ml-auto text-xl">✓</span>}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

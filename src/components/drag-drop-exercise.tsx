"use client";

import { useRef, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import Image from "next/image";
import type { DropTarget, ExerciseOption } from "@/types/database";
import { SPRING_PLAYFUL } from "@/lib/motion";

function optLabel(opt: string | ExerciseOption): string {
  return typeof opt === "string" ? opt : opt.label;
}
function optImage(opt: string | ExerciseOption): string | null {
  return typeof opt === "string" ? null : (opt.image ?? null);
}

interface DragDropExerciseProps {
  dropTarget: DropTarget;
  options: (string | ExerciseOption)[];
  submitting: boolean;
  revealCorrectLabel: string | null;
  onDrop: (label: string) => void;
}

// Ejercicio de arrastrar y soltar: el alumno arrastra una ficha (ej. un
// cristal de color) hasta la zona de destino (ej. un caldero). Al soltar
// dentro de la zona se llama a onDrop(label) — la logica de correcto/
// incorrecto sigue siendo la misma RPC de siempre, esto solo cambia como
// se elige la respuesta.
export default function DragDropExercise({
  dropTarget,
  options,
  submitting,
  revealCorrectLabel,
  onDrop,
}: DragDropExerciseProps) {
  const zoneRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-6">
      <div className="flex justify-center">
        <div
          ref={zoneRef}
          className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-3xl border-4 border-dashed border-purple-300 bg-purple-50 text-center sm:h-36 sm:w-36"
        >
          {dropTarget.image ? (
            <span className="relative h-16 w-16 overflow-hidden rounded-xl">
              <Image src={dropTarget.image} alt="" fill sizes="64px" className="object-contain" />
            </span>
          ) : (
            <span className="text-4xl">🎯</span>
          )}
          <span className="px-1 text-xs font-bold text-purple-600">{dropTarget.label}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {options.map((opt) => (
          <DragChip
            key={optLabel(opt)}
            label={optLabel(opt)}
            image={optImage(opt)}
            disabled={submitting}
            zoneRef={zoneRef}
            revealed={revealCorrectLabel === optLabel(opt)}
            onDropIn={() => onDrop(optLabel(opt))}
            onTapFallback={() => onDrop(optLabel(opt))}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Arrastrá la ficha correcta hasta el círculo (o tocala si preferís).
      </p>
    </div>
  );
}

function DragChip({
  label,
  image,
  disabled,
  zoneRef,
  revealed,
  onDropIn,
  onTapFallback,
}: {
  label: string;
  image: string | null;
  disabled: boolean;
  zoneRef: React.RefObject<HTMLDivElement | null>;
  revealed: boolean;
  onDropIn: () => void;
  onTapFallback: () => void;
}) {
  const controls = useAnimation();
  const [dragging, setDragging] = useState(false);

  function handleDragEnd(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setDragging(false);
    const zone = zoneRef.current?.getBoundingClientRect();
    if (zone) {
      const { x, y } = info.point;
      const inside = x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom;
      if (inside) {
        onDropIn();
        return;
      }
    }
    // No cayo en la zona: vuelve suavemente a su lugar.
    controls.start({ x: 0, y: 0, transition: SPRING_PLAYFUL });
  }

  return (
    <motion.button
      type="button"
      drag
      dragMomentum={false}
      dragElastic={0.15}
      animate={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (!dragging) onTapFallback();
      }}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={
        "relative z-10 flex h-20 w-20 cursor-grab flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white shadow-md active:cursor-grabbing disabled:opacity-50 " +
        (revealed ? "border-emerald-400 ring-4 ring-emerald-200" : "border-purple-200")
      }
      style={{ touchAction: "none" }}
    >
      {image ? (
        <span className="relative h-10 w-10 overflow-hidden">
          <Image src={image} alt="" fill sizes="40px" className="object-contain" />
        </span>
      ) : (
        <span className="text-2xl">✨</span>
      )}
      {!image && <span className="px-1 text-[10px] font-bold text-purple-700">{label}</span>}
    </motion.button>
  );
}

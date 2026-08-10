"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { SPRING_PLAYFUL, EASE_OUT } from "@/lib/motion";

export default function DiamondCounter({ value }: { value: number }) {
  const count = useMotionValue(value);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(value);
  const [popping, setPopping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.6,
      ease: EASE_OUT,
    });

    if (value > prevValue.current) {
      setPopping(true);
      const timeout = setTimeout(() => setPopping(false), 450);
      prevValue.current = value;
      return () => {
        controls.stop();
        clearTimeout(timeout);
      };
    }

    prevValue.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.div
      animate={popping ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={SPRING_PLAYFUL}
      className="rounded-full bg-white/20 px-4 py-2 text-lg font-bold backdrop-blur"
    >
      💎 {display}
    </motion.div>
  );
}

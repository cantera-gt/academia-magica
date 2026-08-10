"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export default function StatCard({
  href,
  label,
  value,
  cta,
}: {
  href?: string;
  label: string;
  value: number;
  cta?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.7, ease: EASE_OUT });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplay(v));
  }, [rounded]);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      whileHover={href ? { y: -2 } : undefined}
      whileTap={href ? { scale: 0.99 } : undefined}
      className="rounded-xl bg-white p-5 shadow transition hover:shadow-md"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-purple-700">{display}</p>
      {cta && <p className="mt-1 text-sm text-purple-600">{cta}</p>}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

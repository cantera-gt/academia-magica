import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import EnrollmentForm from "@/components/enrollment-form";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/types/database";

export const metadata: Metadata = { title: "Matrícula | Academia Mágica", description: "Solicita la matrícula en Academia Mágica y continúa al paso de pago.", alternates: { canonical: "/matricula" } };

export default async function EnrollmentPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_enrollment_subject_catalog");
  const subjects = (data ?? []) as Subject[];

  return <main className="min-h-screen bg-[#fffaf3] px-4 py-8 text-[#3b2a55] sm:px-8 sm:py-12"><div className="mx-auto max-w-6xl"><Link href="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-[#6c5ce7] hover:bg-[#6c5ce7]/10">← Volver a Academia Mágica</Link><div className="mt-5 grid gap-7 lg:grid-cols-[.62fr_1.38fr] lg:items-start"><aside className="rounded-[2rem] bg-gradient-to-br from-[#6c5ce7] to-[#ff6b9d] p-7 text-white shadow-xl lg:sticky lg:top-8"><p className="text-5xl">✨</p><h2 className="font-display mt-5 text-3xl font-extrabold">Tu plaza empieza aquí</h2><p className="mt-4 leading-relaxed text-white/85">Elige las materias que quieres aprender. Cuantas más añadas, menor será el precio de cada una.</p><div className="mt-6 space-y-2 rounded-2xl bg-white/12 p-4 text-sm"><p><strong>1–3:</strong> $10 por materia</p><p><strong>4–6:</strong> $8 por materia</p><p><strong>7–10:</strong> $7 por materia</p><p><strong>11 o más:</strong> $6 por materia</p></div><ul className="mt-7 space-y-3 font-bold"><li>✓ Acceso durante 3 meses</li><li>✓ Precio y total siempre visibles</li><li>✓ Datos protegidos</li></ul></aside><Suspense fallback={<div className="rounded-[2rem] bg-white p-8">Cargando formulario…</div>}><EnrollmentForm subjects={subjects} /></Suspense></div></div></main>;
}

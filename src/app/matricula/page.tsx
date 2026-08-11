import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import EnrollmentForm from "@/components/enrollment-form";

export const metadata: Metadata = { title: "Matrícula", description: "Solicita la matrícula en Academia Mágica y continúa al paso de pago.", alternates: { canonical: "/matricula" } };

export default function EnrollmentPage() {
  return <main className="min-h-screen bg-[#fffaf3] px-4 py-8 text-[#3b2a55] sm:px-8 sm:py-12"><div className="mx-auto max-w-4xl"><Link href="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-[#6c5ce7] hover:bg-[#6c5ce7]/10">← Volver a Academia Mágica</Link><div className="mt-5 grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-start"><aside className="rounded-[2rem] bg-gradient-to-br from-[#6c5ce7] to-[#ff6b9d] p-7 text-white shadow-xl lg:sticky lg:top-8"><p className="text-5xl">✨</p><h2 className="font-display mt-5 text-3xl font-extrabold">Tu plaza empieza aquí</h2><p className="mt-4 leading-relaxed text-white/85">Guardaremos tu solicitud y te llevaremos al siguiente paso para completar el pago.</p><ul className="mt-7 space-y-3 font-bold"><li>✓ Datos protegidos</li><li>✓ Confirmación con referencia</li><li>✓ Contacto por email o WhatsApp</li></ul></aside><Suspense fallback={<div className="rounded-[2rem] bg-white p-8">Cargando formulario…</div>}><EnrollmentForm /></Suspense></div></div></main>;
}
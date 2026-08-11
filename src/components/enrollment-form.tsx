"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ENROLLMENT_PRICE_TIERS, getEnrollmentPricing } from "@/lib/enrollment-pricing";
import type { Subject } from "@/types/database";

type ApplicantType = "legal_guardian" | "adult_student";
const inputClass = "mt-2 min-h-12 w-full rounded-2xl border border-[#3b2a55]/20 bg-white px-4 py-3 shadow-sm outline-none focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/15";
const categoryNames: Record<string, string> = { idiomas: "Idiomas", matematicas: "Matemáticas y lógica", ciencias: "Ciencias", humanidades: "Humanidades", transversales: "Habilidades transversales", complementarias: "Arte, deporte y tecnología" };

export default function EnrollmentForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [applicantType, setApplicantType] = useState<ApplicantType>("legal_guardian");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());
  const pricing = getEnrollmentPricing(selected.size);
  const grouped = useMemo(() => subjects.reduce<Record<string, Subject[]>>((result, subject) => {
    (result[subject.category] ??= []).push(subject);
    return result;
  }, {}), [subjects]);

  function toggleSubject(id: string) {
    setError("");
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (selected.size === 0) {
      setError("Selecciona al menos una materia para continuar.");
      document.getElementById("materias")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    if (form.get("website") || Date.now() - startedAt < 1500) {
      setSubmitting(false);
      setError("No hemos podido validar el formulario. Inténtalo de nuevo.");
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("submit_enrollment_application", {
      p_applicant_type: applicantType,
      p_contact_full_name: String(form.get("contact_full_name") ?? ""),
      p_contact_email: String(form.get("contact_email") ?? ""),
      p_whatsapp_phone: String(form.get("whatsapp_phone") ?? ""),
      p_country: String(form.get("country") ?? ""),
      p_city: String(form.get("city") ?? ""),
      p_subject_ids: Array.from(selected),
      p_student_first_name: applicantType === "legal_guardian" ? String(form.get("student_first_name") ?? "") : null,
      p_student_last_name: applicantType === "legal_guardian" ? String(form.get("student_last_name") ?? "") : null,
      p_student_email: applicantType === "legal_guardian" ? String(form.get("student_email") ?? "") || null : null,
      p_privacy_accepted: form.get("privacy_accepted") === "on",
      p_terms_accepted: form.get("terms_accepted") === "on",
      p_marketing_consent: form.get("marketing_consent") === "on",
      p_source: "landing",
      p_utm_source: searchParams.get("utm_source"),
      p_utm_medium: searchParams.get("utm_medium"),
      p_utm_campaign: searchParams.get("utm_campaign"),
    });
    if (rpcError || !data?.[0]?.public_reference || !data?.[0]?.payment_token) {
      setError(rpcError?.message ?? "No hemos podido guardar la matrícula. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }
    router.push(`/matricula/pago?ref=${encodeURIComponent(data[0].public_reference)}&pt=${encodeURIComponent(data[0].payment_token)}`);
  }

  return <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-[#3b2a55]/10 sm:p-8">
    <header><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Matrícula personalizada</p><h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">Elige qué quieres aprender</h1><p className="mt-3 text-[#3b2a55]/65">Selecciona las materias y verás tu precio final al instante.</p></header>

    <fieldset id="materias" className="mt-8 scroll-mt-6"><legend className="font-display text-xl font-extrabold">1. Selecciona tus materias</legend>
      {subjects.length === 0 ? <p role="alert" className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900">No pudimos cargar las materias. Actualiza la página.</p> : <div className="mt-5 space-y-6">{Object.entries(grouped).map(([category, items]) => <section key={category}><h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-[#3b2a55]/55">{categoryNames[category] ?? category}</h2><div className="grid gap-2 sm:grid-cols-2">{items.map((subject) => {
        const checked = selected.has(subject.id);
        return <label key={subject.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition focus-within:ring-4 focus-within:ring-[#6c5ce7]/15 ${checked ? "border-[#6c5ce7] bg-[#f2e9ff]" : "border-[#3b2a55]/10 hover:border-[#6c5ce7]/40"}`}><input type="checkbox" checked={checked} onChange={() => toggleSubject(subject.id)} className="size-5 accent-[#6c5ce7]" /><span className="text-xl" aria-hidden="true">{subject.icon ?? "✨"}</span><span className="font-extrabold leading-tight">{subject.name}</span>{checked && <span className="ml-auto font-black text-[#6c5ce7]" aria-hidden="true">✓</span>}</label>;
      })}</div></section>)}</div>}
    </fieldset>

    <section aria-live="polite" className="sticky bottom-3 z-10 mt-7 overflow-hidden rounded-3xl border-2 border-[#6c5ce7]/20 bg-white/95 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-[#f2e9ff] to-[#fff4cc] p-4 sm:grid-cols-4">
        <PriceStat label="Materias" value={String(pricing.subjectCount)} />
        <PriceStat label="Por materia" value={pricing.subjectCount ? `$${pricing.unitPriceUsd}` : "—"} />
        <PriceStat label="Acceso" value="3 meses" />
        <PriceStat label="Total" value={`$${pricing.totalUsd}`} highlight />
      </div>
      <div className="px-4 py-3 text-sm font-bold">{pricing.subjectCount === 0 ? <p>Selecciona una materia para calcular el precio.</p> : <><p className="text-emerald-700">{pricing.savingsUsd > 0 ? `Ahorras $${pricing.savingsUsd} con el descuento por cantidad.` : "Tu tarifa actual es de $10 por materia."}</p>{pricing.nextTier ? <p className="mt-1 text-[#3b2a55]/65">Añade {pricing.nextTier.remaining} {pricing.nextTier.remaining === 1 ? "materia" : "materias"} más y todas quedarán a ${pricing.nextTier.unitPriceUsd}.</p> : <p className="mt-1 text-emerald-700">¡Ya tienes nuestra mejor tarifa!</p>}</>}</div>
    </section>

    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{ENROLLMENT_PRICE_TIERS.map((tier) => {
      const active = selected.size >= tier.minimum && selected.size <= tier.maximum;
      return <div key={tier.minimum} className={`rounded-xl border p-3 text-center text-xs ${active ? "border-[#6c5ce7] bg-[#f2e9ff] text-[#6c5ce7]" : "border-[#3b2a55]/10 text-[#3b2a55]/55"}`}><strong className="block text-sm">{tier.label}</strong>${tier.unitPriceUsd} cada una</div>;
    })}</div>

    <fieldset className="mt-10"><legend className="font-display text-xl font-extrabold">2. ¿Quién realiza la matrícula?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{([["legal_guardian", "Soy tutor legal", "Matriculo a un alumno menor de edad"], ["adult_student", "Soy alumno mayor de edad", "Me matriculo a mí mismo/a"]] as const).map(([value, title, description]) => <label key={value} className={`cursor-pointer rounded-2xl border-2 p-4 ${applicantType === value ? "border-[#6c5ce7] bg-[#6c5ce7]/5" : "border-[#3b2a55]/10"}`}><input type="radio" name="applicant_type" value={value} checked={applicantType === value} onChange={() => setApplicantType(value)} className="mr-2 accent-[#6c5ce7]" /><span className="font-extrabold">{title}</span><span className="mt-1 block pl-6 text-sm text-[#3b2a55]/60">{description}</span></label>)}</div></fieldset>

    <div className="mt-8 grid gap-5 sm:grid-cols-2"><Field wide label="Nombre y apellidos de la persona de contacto *"><input className={inputClass} name="contact_full_name" autoComplete="name" maxLength={160} required /></Field><Field label="Email *"><input className={inputClass} name="contact_email" type="email" autoComplete="email" maxLength={254} required /></Field><Field label="Número de WhatsApp *"><input className={inputClass} name="whatsapp_phone" type="tel" autoComplete="tel" placeholder="Incluye el prefijo del país" maxLength={32} required /></Field><Field label="País *"><input className={inputClass} name="country" autoComplete="country-name" maxLength={100} required /></Field><Field label="Ciudad *"><input className={inputClass} name="city" autoComplete="address-level2" maxLength={120} required /></Field></div>

    {applicantType === "legal_guardian" && <fieldset className="mt-8 rounded-3xl bg-[#f2e9ff] p-5 sm:p-6"><legend className="font-display px-2 text-lg font-extrabold text-[#6c5ce7]">Datos del alumno menor</legend><p className="text-sm text-[#3b2a55]/60">El tutor legal seguirá siendo nuestra persona de contacto.</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><Field label="Nombre del alumno *"><input className={inputClass} name="student_first_name" maxLength={100} required /></Field><Field label="Apellidos del alumno *"><input className={inputClass} name="student_last_name" maxLength={120} required /></Field><Field wide label="Email del alumno (opcional)"><input className={inputClass} name="student_email" type="email" maxLength={254} /></Field></div></fieldset>}

    <div className="mt-7 space-y-3 text-sm"><Consent name="terms_accepted">He leído y acepto las <Link href="/condiciones-matricula" target="_blank" className="font-bold text-[#6c5ce7] underline">condiciones de matrícula</Link>. *</Consent><Consent name="privacy_accepted">Acepto el tratamiento de mis datos según la <Link href="/privacidad" target="_blank" className="font-bold text-[#6c5ce7] underline">política de privacidad</Link>. *</Consent><label className="flex items-start gap-3"><input type="checkbox" name="marketing_consent" className="mt-1 size-4 accent-[#6c5ce7]" /><span>Quiero recibir novedades educativas y ofertas. <strong>(Opcional)</strong></span></label><div className="absolute -left-[10000px]" aria-hidden="true"><label>Web<input name="website" tabIndex={-1} autoComplete="off" /></label></div></div>
    {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
    <button disabled={submitting || subjects.length === 0 || selected.size === 0} className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#ffd93d] px-7 py-4 text-lg font-extrabold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Guardando matrícula…" : selected.size === 0 ? "Selecciona al menos una materia" : `Continuar al pago · $${pricing.totalUsd}`}</button>
    <p className="mt-3 text-center text-xs text-[#3b2a55]/50">Precio final por 3 meses. El pago todavía no se realizará en este paso.</p>
  </form>;
}

function PriceStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) { return <div><p className="text-xs font-bold uppercase text-[#3b2a55]/55">{label}</p><p className={`mt-1 font-black ${highlight ? "text-3xl text-[#6c5ce7]" : "text-2xl"}`}>{value}</p></div>; }
function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="font-bold">{label}</span>{children}</label>; }
function Consent({ name, children }: { name: string; children: React.ReactNode }) { return <label className="flex items-start gap-3"><input type="checkbox" name={name} required className="mt-1 size-4 accent-[#6c5ce7]" /><span>{children}</span></label>; }

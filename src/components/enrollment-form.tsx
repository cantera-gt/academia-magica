"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ApplicantType = "legal_guardian" | "adult_student";
const inputClass = "mt-2 min-h-12 w-full rounded-2xl border border-[#3b2a55]/20 bg-white px-4 py-3 text-[#3b2a55] shadow-sm outline-none transition placeholder:text-[#3b2a55]/35 focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/15";

export default function EnrollmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [applicantType, setApplicantType] = useState<ApplicantType>("legal_guardian");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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

    if (rpcError || !data?.[0]?.public_reference) {
      setError(rpcError?.message ?? "No hemos podido guardar la matrícula. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }
    router.push(`/matricula/pago?ref=${encodeURIComponent(data[0].public_reference)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-[#3b2a55]/10 sm:p-8">
      <div className="mb-7"><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Datos de matrícula</p><h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">Empecemos esta aventura</h1><p className="mt-3 text-[#3b2a55]/65">Completa los datos de la persona de contacto. Al terminar pasarás al paso de pago.</p></div>
      <fieldset><legend className="font-display text-lg font-extrabold">¿Quién realiza la matrícula?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">
        {([[
          "legal_guardian", "Soy tutor legal", "Matriculo a un alumno menor de edad"
        ], ["adult_student", "Soy alumno mayor de edad", "Me matriculo a mí mismo/a"]] as const).map(([value, title, description]) => <label key={value} className={`cursor-pointer rounded-2xl border-2 p-4 transition ${applicantType === value ? "border-[#6c5ce7] bg-[#6c5ce7]/5" : "border-[#3b2a55]/10 hover:border-[#6c5ce7]/40"}`}><input type="radio" name="applicant_type" value={value} checked={applicantType === value} onChange={() => setApplicantType(value)} className="mr-2 accent-[#6c5ce7]" /><span className="font-extrabold">{title}</span><span className="mt-1 block pl-6 text-sm text-[#3b2a55]/60">{description}</span></label>)}
      </div></fieldset>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="font-bold">Nombre y apellidos de la persona de contacto *</span><input className={inputClass} name="contact_full_name" autoComplete="name" maxLength={160} required /></label>
        <label><span className="font-bold">Email *</span><input className={inputClass} name="contact_email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label><span className="font-bold">Número de WhatsApp *</span><input className={inputClass} name="whatsapp_phone" type="tel" autoComplete="tel" placeholder="Incluye el prefijo del país" maxLength={32} required /></label>
        <label><span className="font-bold">País *</span><input className={inputClass} name="country" autoComplete="country-name" maxLength={100} required /></label>
        <label><span className="font-bold">Ciudad *</span><input className={inputClass} name="city" autoComplete="address-level2" maxLength={120} required /></label>
      </div>
      {applicantType === "legal_guardian" && <fieldset className="mt-8 rounded-3xl bg-[#f2e9ff] p-5 sm:p-6"><legend className="font-display px-2 text-lg font-extrabold text-[#6c5ce7]">Datos del alumno menor</legend><p className="text-sm text-[#3b2a55]/60">El tutor legal seguirá siendo nuestra persona de contacto.</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><label><span className="font-bold">Nombre del alumno *</span><input className={inputClass} name="student_first_name" maxLength={100} required /></label><label><span className="font-bold">Apellidos del alumno *</span><input className={inputClass} name="student_last_name" maxLength={120} required /></label><label className="sm:col-span-2"><span className="font-bold">Email del alumno <span className="font-normal text-[#3b2a55]/50">(opcional)</span></span><input className={inputClass} name="student_email" type="email" maxLength={254} /></label></div></fieldset>}
      <div className="mt-7 space-y-3 text-sm">
        <label className="flex items-start gap-3"><input type="checkbox" name="terms_accepted" required className="mt-1 size-4 accent-[#6c5ce7]" /><span>He leído y acepto las <Link href="/condiciones-matricula" target="_blank" className="font-bold text-[#6c5ce7] underline">condiciones de matrícula</Link>. *</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" name="privacy_accepted" required className="mt-1 size-4 accent-[#6c5ce7]" /><span>Acepto el tratamiento de mis datos para gestionar la matrícula, según la <Link href="/privacidad" target="_blank" className="font-bold text-[#6c5ce7] underline">política de privacidad</Link>. *</span></label>
        <label className="flex items-start gap-3"><input type="checkbox" name="marketing_consent" className="mt-1 size-4 accent-[#6c5ce7]" /><span>Quiero recibir novedades educativas y ofertas. Puedo darme de baja cuando quiera. <strong>(Opcional)</strong></span></label>
        <div className="absolute -left-[10000px]" aria-hidden="true"><label>Web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      </div>
      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}
      <button disabled={submitting} className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#ffd93d] px-7 py-4 text-lg font-extrabold text-[#3b2a55] shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#6c5ce7] disabled:cursor-wait disabled:opacity-60">{submitting ? "Guardando matrícula…" : "Realizar matrícula y continuar al pago"}</button>
      <p className="mt-3 text-center text-xs text-[#3b2a55]/50">Tus datos se guardan de forma segura. El pago todavía no se realizará en este paso.</p>
    </form>
  );
}
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatShortDate, relativeActivity } from "@/lib/admin-format";
import type { AdminStudentDetail } from "@/types/admin";
import type { Subject, AdminSubjectSubscription } from "@/types/database";

type Tab = "summary" | "learning" | "activity" | "management";

const SUBSCRIPTION_BADGE: Record<string, { label: string; className: string }> = {
  vencida: { label: "Vencida", className: "bg-red-100 text-red-700" },
  por_vencer: { label: "Por vencer", className: "bg-amber-100 text-amber-800" },
  activa: { label: "Activa", className: "bg-emerald-100 text-emerald-700" },
  sin_vencimiento: { label: "Sin vencimiento", className: "bg-slate-100 text-slate-600" },
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params.id;
  const supabase = useMemo(() => createClient(), []);
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [showDiamonds, setShowDiamonds] = useState(false);
  const [diamondAmount, setDiamondAmount] = useState(25);
  const [diamondReason, setDiamondReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subscriptions, setSubscriptions] = useState<AdminSubjectSubscription[]>([]);
  const [extendingKey, setExtendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data, error: detailError }, { data: subjectRows }, { data: subscriptionRows }] = await Promise.all([
      supabase.rpc("admin_student_detail", { p_student_id: studentId }),
      supabase.from("subjects").select("id, slug, name, category, icon, color, sort_order, active").eq("active", true).order("sort_order"),
      supabase.rpc("admin_list_subject_subscriptions"),
    ]);
    if (detailError || !data) {
      setError(detailError?.message ?? "No se encontró el alumno.");
      setLoading(false);
      return;
    }
    const next = data as unknown as AdminStudentDetail;
    setDetail(next);
    setAssigned(new Set(next.assigned_subject_ids));
    setGuardianName(next.student.guardian_name ?? "");
    setGuardianEmail(next.student.guardian_email ?? "");
    setAdminNotes(next.student.admin_notes ?? "");
    setTagsText(next.student.tags.join(", "));
    setStatusReason(next.student.status_reason ?? "");
    setSubjects((subjectRows as Subject[] | null) ?? []);
    setSubscriptions(((subscriptionRows as AdminSubjectSubscription[] | null) ?? []).filter((row) => row.student_id === studentId));
    setLoading(false);
  }, [studentId, supabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!showDiamonds && !showStatus && !showDelete) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!adjusting) setShowDiamonds(false);
      if (!changingStatus) setShowStatus(false);
      if (!deleting) setShowDelete(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [adjusting, changingStatus, deleting, showDelete, showDiamonds, showStatus]);

  const subjectGroups = useMemo(() => subjects.reduce<Record<string, Subject[]>>((groups, subject) => {
    (groups[subject.category] ??= []).push(subject);
    return groups;
  }, {}), [subjects]);

  async function saveSubjects() {
    setSavingSubjects(true); setNotice(null);
    const { error: saveError } = await supabase.rpc("admin_set_student_subjects", { p_student_id: studentId, p_subject_ids: Array.from(assigned) });
    if (saveError) setNotice(saveError.message); else { setNotice("Materias guardadas y acción registrada."); await load(); }
    setSavingSubjects(false);
  }

  async function extendSubscription(subjectId: string, months: number) {
    setExtendingKey(subjectId); setNotice(null);
    const row = subscriptions.find((r) => r.subject_id === subjectId);
    const base = row?.expires_at && new Date(row.expires_at) > new Date() ? new Date(row.expires_at) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    const { error: extendError } = await supabase.rpc("admin_set_subject_expiry", { p_student_id: studentId, p_subject_id: subjectId, p_expires_at: next.toISOString() });
    if (extendError) setNotice(extendError.message); else { setNotice(`Vencimiento actualizado: +${months} meses.`); await load(); }
    setExtendingKey(null);
  }

  async function saveDetails() {
    setSavingDetails(true); setNotice(null);
    const tags = tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
    const { error: saveError } = await supabase.rpc("admin_update_student_details", {
      p_student_id: studentId, p_guardian_name: guardianName, p_guardian_email: guardianEmail,
      p_admin_notes: adminNotes, p_tags: tags,
    });
    if (saveError) setNotice(saveError.message); else { setNotice("Seguimiento y contacto guardados."); await load(); }
    setSavingDetails(false);
  }

  async function adjustDiamonds() {
    setAdjusting(true); setNotice(null);
    const { error: adjustmentError } = await supabase.rpc("admin_adjust_student_diamonds", {
      p_student_id: studentId, p_amount: diamondAmount, p_reason: diamondReason,
    });
    if (adjustmentError) setNotice(adjustmentError.message); else {
      setNotice(`Ajuste de ${diamondAmount > 0 ? "+" : ""}${diamondAmount} diamantes aplicado y auditado.`);
      setShowDiamonds(false); setDiamondReason(""); setDiamondAmount(25); await load();
    }
    setAdjusting(false);
  }

  async function changeStatus() {
    if (!detail) return;
    setChangingStatus(true); setNotice(null);
    const { error: statusError } = await supabase.rpc("admin_set_student_active", {
      p_student_id: studentId, p_is_active: !detail.student.is_active, p_reason: statusReason.trim() || null,
    });
    if (statusError) setNotice(statusError.message); else { setNotice(`Alumno ${detail.student.is_active ? "desactivado" : "activado"} correctamente.`); setShowStatus(false); await load(); }
    setChangingStatus(false);
  }

  async function deleteStudent() {
    setDeleting(true);
    const { data, error: deleteError } = await supabase.functions.invoke("delete-student", { body: { studentId } });
    if (deleteError || data?.error) { setNotice(data?.error ?? deleteError?.message ?? "No se pudo eliminar"); setDeleting(false); return; }
    router.push("/admin/alumnos");
  }

  function emailGuardian() {
    if (!detail?.student.guardian_email) { setTab("management"); setNotice("Añade primero el correo del tutor."); return; }
    window.location.href = `mailto:${encodeURIComponent(detail.student.guardian_email)}?subject=${encodeURIComponent(`Seguimiento de ${detail.student.display_name} · Academia Mágica`)}`;
  }

  if (loading) return <div className="grid min-h-[50vh] place-items-center text-slate-500" role="status">Cargando ficha completa…</div>;
  if (error || !detail) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><p className="font-bold">{error ?? "No se encontró el alumno"}</p><Link href="/admin/alumnos" className="mt-3 inline-block font-bold underline">Volver a alumnos</Link></div>;

  const { student, overview } = detail;
  const maxDaily = Math.max(1, ...detail.daily_activity.map((day) => day.attempts));
  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: "Resumen" }, { id: "learning", label: "Aprendizaje" },
    { id: "activity", label: "Actividad" }, { id: "management", label: "Administración" },
  ];

  return (
    <div>
      <Link href="/admin/alumnos" className="text-sm font-bold text-slate-500 hover:text-violet-700">← Volver a alumnos</Link>
      <header className="mt-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-violet-500 text-2xl font-extrabold shadow-inner">{student.display_name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-display text-3xl font-extrabold">{student.display_name}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${student.is_active ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-slate-300"}`}>{student.is_active ? "Activo" : "Inactivo"}</span></div><p className="mt-1 text-sm text-slate-300">@{student.username ?? "sin usuario"} · {student.household_name} · {student.age_bracket ?? "sin franja de edad"} · Alta {formatShortDate(student.created_at)}</p>{student.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{student.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">{tag}</span>)}</div>}</div>
          </div>
          <div className="flex flex-wrap gap-2"><button onClick={emailGuardian} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/20">✉ Escribir</button><button onClick={() => setShowDiamonds(true)} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-extrabold text-cyan-950 hover:bg-cyan-300">💎 Premiar</button><button onClick={() => setShowStatus(true)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold hover:bg-white/10">{student.is_active ? "Desactivar" : "Activar"}</button></div>
        </div>
      </header>

      {notice && <div role="status" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">×</button></div>}

      <nav aria-label="Secciones de la ficha" className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-extrabold ${tab === item.id ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{item.label}</button>)}
      </nav>

      {tab === "summary" && <div className="mt-6">
        <section aria-label="Indicadores del alumno" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Última actividad</p><p className="mt-2 text-2xl font-extrabold text-slate-950">{relativeActivity(overview.last_activity_at)}</p><p className="mt-1 text-xs text-slate-400">{formatDateTime(overview.last_activity_at)}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Precisión total</p><p className="mt-2 text-2xl font-extrabold text-violet-700">{overview.accuracy_pct == null ? "—" : `${overview.accuracy_pct}%`}</p><p className="mt-1 text-xs text-slate-400">{overview.correct_count} correctos de {overview.attempt_count}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Temas aprobados</p><p className="mt-2 text-2xl font-extrabold text-emerald-700">{overview.topics_passed}<span className="text-base text-slate-400">/{overview.topics_started}</span></p><p className="mt-1 text-xs text-slate-400">{overview.assigned_subjects} materias asignadas</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Saldo actual</p><p className="mt-2 text-2xl font-extrabold text-cyan-700">💎 {student.diamonds}</p><button onClick={() => setShowDiamonds(true)} className="mt-1 text-xs font-bold text-violet-600 hover:underline">Ajustar con motivo →</button></div>
        </section>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="font-display text-xl font-extrabold">Actividad reciente</h2><div className="mt-5 flex h-44 items-end gap-2">{detail.daily_activity.map((day) => <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div title={`${day.day}: ${day.attempts} ejercicios`} className="w-full max-w-10 rounded-t-md bg-violet-500" style={{ height: `${Math.max(day.attempts ? 10 : 3, day.attempts / maxDaily * 100)}%` }}><span className="sr-only">{day.attempts} ejercicios</span></div><span className="text-[10px] font-bold text-slate-400">{new Intl.DateTimeFormat("es-ES", { weekday: "narrow" }).format(new Date(`${day.day}T12:00:00`))}</span></div>)}</div></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="font-display text-xl font-extrabold">Contacto familiar</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-bold text-slate-400">Tutor</dt><dd className="font-bold text-slate-800">{student.guardian_name ?? "Sin registrar"}</dd></div><div><dt className="font-bold text-slate-400">Correo</dt><dd className="break-all text-slate-800">{student.guardian_email ?? "Sin registrar"}</dd></div><div><dt className="font-bold text-slate-400">Último contacto</dt><dd className="text-slate-800">{formatDateTime(student.last_contacted_at)}</dd></div></dl><button onClick={() => setTab("management")} className="mt-5 text-sm font-extrabold text-violet-600 hover:underline">Editar contacto y notas →</button></section>
        </div>
      </div>}

      {tab === "learning" && <div className="mt-6 space-y-6"><div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Progreso por materia</h2><p className="text-sm text-slate-500">Resultados reales acumulados.</p></div></div><div className="mt-5 space-y-4">{detail.subjects.map((subject) => <article key={subject.subject_id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{subject.icon} {subject.name}</h3><p className="text-xs text-slate-400">{subject.attempts} intentos · {subject.topics_passed}/{subject.topics_started} temas aprobados</p></div><span className="text-lg font-extrabold" style={{ color: subject.color ?? "#7c3aed" }}>{subject.accuracy_pct == null ? "—" : `${subject.accuracy_pct}%`}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${subject.accuracy_pct ?? 0}%`, backgroundColor: subject.color ?? "#7c3aed" }} /></div></article>)}{detail.subjects.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No tiene materias asignadas.</p>}</div></section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Materias asignadas</h2><p className="text-sm text-slate-500">Los cambios se guardan de forma atómica.</p></div><button disabled={savingSubjects} onClick={saveSubjects} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{savingSubjects ? "Guardando…" : "Guardar"}</button></div><div className="mt-5 max-h-[580px] overflow-y-auto">{Object.entries(subjectGroups).map(([category, group]) => <fieldset key={category} className="mb-5"><legend className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">{category}</legend><div className="space-y-1">{group.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={assigned.has(subject.id)} onChange={() => setAssigned((current) => { const next = new Set(current); if (next.has(subject.id)) next.delete(subject.id); else next.add(subject.id); return next; })} className="h-4 w-4 accent-violet-600" />{subject.icon} {subject.name}</label>)}</div></fieldset>)}</div></section>
      </div>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Vencimientos</h2><p className="text-sm text-slate-500">Acceso de 3 meses por materia. Extendé manualmente los pagos hechos fuera de PayPal.</p></div><Link href="/admin/suscripciones" className="text-sm font-extrabold text-violet-600 hover:underline">Ver todas →</Link></div><div className="mt-4 divide-y divide-slate-100">{subscriptions.map((row) => { const badge = SUBSCRIPTION_BADGE[row.status] ?? SUBSCRIPTION_BADGE.sin_vencimiento; return <div key={row.subject_id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-bold text-slate-800">{row.subject_icon} {row.subject_name}</p><p className="text-xs text-slate-400">{row.expires_at ? formatShortDate(row.expires_at) : "Sin vencimiento"}{row.days_remaining != null ? ` · ${row.days_remaining} días` : ""}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${badge.className}`}>{badge.label}</span><button disabled={extendingKey === row.subject_id} onClick={() => extendSubscription(row.subject_id, 3)} className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-extrabold text-violet-700 hover:bg-violet-200 disabled:opacity-50">{extendingKey === row.subject_id ? "…" : "+3 meses"}</button></div></div>; })}{subscriptions.length === 0 && <p className="py-4 text-sm text-slate-400">No tiene materias con vencimiento registrado.</p>}</div></section>
      </div>}

      {tab === "activity" && <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="font-display text-xl font-extrabold">Últimos ejercicios</h2><div className="mt-4 divide-y divide-slate-100">{detail.recent_attempts.map((attempt) => <article key={attempt.id} className="flex items-start gap-3 py-3"><span aria-label={attempt.is_correct ? "Correcto" : "Incorrecto"} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-extrabold ${attempt.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{attempt.is_correct ? "✓" : "×"}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-800">{attempt.subject_icon} {attempt.prompt ?? attempt.topic_name}</p><p className="text-xs text-slate-400">{attempt.subject_name} · {formatDateTime(attempt.attempted_at)} · +{attempt.diamonds_earned} 💎</p></div></article>)}{detail.recent_attempts.length === 0 && <p className="py-6 text-sm text-slate-400">Todavía no ha respondido ejercicios.</p>}</div></section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="font-display text-xl font-extrabold">Historial de diamantes</h2><div className="mt-4 divide-y divide-slate-100">{detail.diamond_transactions.map((transaction) => <article key={transaction.id} className="flex items-start justify-between gap-4 py-3"><div><p className="font-bold text-slate-800">{transaction.reason}</p><p className="text-xs text-slate-400">{formatDateTime(transaction.created_at)} · {transaction.reference_type ?? "actividad"}</p></div><span className={`font-extrabold ${transaction.amount >= 0 ? "text-emerald-700" : "text-red-700"}`}>{transaction.amount > 0 ? "+" : ""}{transaction.amount} 💎</span></article>)}{detail.diamond_transactions.length === 0 && <p className="py-6 text-sm text-slate-400">Sin movimientos de diamantes.</p>}</div></section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 xl:col-span-2 sm:p-6"><h2 className="font-display text-xl font-extrabold">Registro administrativo</h2><div className="mt-4 divide-y divide-slate-100">{detail.admin_activity.map((activity) => <div key={activity.id} className="flex items-start justify-between gap-4 py-3 text-sm"><span className="font-bold text-slate-700">{activity.summary}</span><time dateTime={activity.created_at} className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(activity.created_at)}</time></div>)}{detail.admin_activity.length === 0 && <p className="py-4 text-sm text-slate-400">Aún no hay acciones administrativas.</p>}</div></section>
      </div>}

      {tab === "management" && <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">Tutor y seguimiento</h2><p className="text-sm text-slate-500">Información privada, visible solo para el administrador.</p></div><button disabled={savingDetails} onClick={saveDetails} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{savingDetails ? "Guardando…" : "Guardar"}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">Nombre del tutor<input maxLength={120} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label><label className="text-sm font-bold text-slate-700">Email del tutor<input type="email" maxLength={254} value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label><label className="text-sm font-bold text-slate-700 sm:col-span-2">Etiquetas <span className="font-normal text-slate-400">(separadas por comas, máximo 8)</span><input maxLength={320} value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. seguimiento semanal, matemáticas, beca" /></label><label className="text-sm font-bold text-slate-700 sm:col-span-2">Notas internas<textarea maxLength={4000} rows={8} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Acuerdos con la familia, objetivos, observaciones…" /></label></div></section>
        <aside className="space-y-6"><section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-display text-xl font-extrabold">Acciones rápidas</h2><div className="mt-4 space-y-2"><button onClick={emailGuardian} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-bold text-slate-700 hover:border-violet-300 hover:bg-violet-50">✉ Escribir al tutor</button><button onClick={() => setShowDiamonds(true)} className="w-full rounded-xl border border-cyan-200 px-4 py-3 text-left text-sm font-bold text-cyan-800 hover:bg-cyan-50">💎 Premiar o corregir saldo</button><button onClick={() => setShowStatus(true)} className="w-full rounded-xl border border-amber-200 px-4 py-3 text-left text-sm font-bold text-amber-800 hover:bg-amber-50">{student.is_active ? "Pausar acceso" : "Reactivar acceso"}</button></div></section><section className="rounded-2xl border border-red-200 bg-red-50 p-5"><h2 className="font-display text-lg font-extrabold text-red-900">Zona de riesgo</h2><p className="mt-1 text-sm leading-6 text-red-800">Eliminar borra el acceso y los datos activos. Antes se crea un respaldo recuperable en la base de datos.</p><button onClick={() => setShowDelete(true)} className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">Eliminar y respaldar</button></section></aside>
      </div>}

      {showDiamonds && <div role="dialog" aria-modal="true" aria-labelledby="diamonds-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="diamonds-title" className="font-display text-xl font-extrabold">Ajustar diamantes</h2><p className="mt-1 text-sm text-slate-500">Saldo actual: 💎 {student.diamonds}. Todo ajuste queda registrado.</p><div className="mt-4 flex flex-wrap gap-2">{[10, 25, 50, 100].map((amount) => <button key={amount} onClick={() => setDiamondAmount(amount)} className={`rounded-lg px-3 py-2 text-sm font-extrabold ${diamondAmount === amount ? "bg-cyan-500 text-cyan-950" : "bg-cyan-50 text-cyan-800"}`}>+{amount}</button>)}<button onClick={() => setDiamondAmount(-25)} className={`rounded-lg px-3 py-2 text-sm font-extrabold ${diamondAmount < 0 ? "bg-red-100 text-red-800 ring-2 ring-red-300" : "bg-slate-100 text-slate-600"}`}>Corregir saldo</button></div><label className="mt-4 block text-sm font-bold text-slate-700">Cantidad<input type="number" min={-5000} max={5000} value={diamondAmount} onChange={(e) => setDiamondAmount(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="mt-4 block text-sm font-bold text-slate-700">Motivo obligatorio<textarea autoFocus required maxLength={300} rows={3} value={diamondReason} onChange={(e) => setDiamondReason(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. Premio por constancia semanal" /></label><div className="mt-5 flex justify-end gap-3"><button disabled={adjusting} onClick={() => setShowDiamonds(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={adjusting || !diamondReason.trim() || diamondAmount === 0} onClick={adjustDiamonds} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-extrabold text-cyan-950 hover:bg-cyan-400 disabled:opacity-50">{adjusting ? "Aplicando…" : "Aplicar ajuste"}</button></div></div></div>}
      {showStatus && <div role="dialog" aria-modal="true" aria-labelledby="status-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="status-title" className="font-display text-xl font-extrabold">{student.is_active ? "Desactivar acceso" : "Reactivar acceso"}</h2><p className="mt-1 text-sm text-slate-500">{student.is_active ? "Conservará todo su progreso y compras, pero no podrá entrar." : "Podrá volver a acceder inmediatamente."}</p><label className="mt-4 block text-sm font-bold text-slate-700">Motivo <span className="font-normal text-slate-400">(opcional)</span><textarea maxLength={500} rows={3} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label><div className="mt-5 flex justify-end gap-3"><button disabled={changingStatus} onClick={() => setShowStatus(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={changingStatus} onClick={changeStatus} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{changingStatus ? "Guardando…" : "Confirmar"}</button></div></div></div>}
      {showDelete && <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="delete-title" className="font-display text-xl font-extrabold text-red-700">Eliminar a {student.display_name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Esta acción elimina su cuenta activa. Se guardará antes una copia completa para una posible recuperación técnica.</p><div className="mt-5 flex justify-end gap-3"><button disabled={deleting} onClick={() => setShowDelete(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={deleting} onClick={deleteStudent} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Eliminando…" : "Eliminar y respaldar"}</button></div></div></div>}
    </div>
  );
}

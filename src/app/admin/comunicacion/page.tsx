"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downloadCsv } from "@/lib/admin-format";
import type { AdminStudentOverview } from "@/types/admin";

export default function CommunicationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [students, setStudents] = useState<AdminStudentOverview[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("Novedades de Academia Mágica");
  const [body, setBody] = useState("Hola,\n\nQueríamos compartir contigo una actualización de Academia Mágica.\n\nUn saludo,");
  const [notice, setNotice] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_students_overview");
    if (error) setNotice(error.message);
    setStudents((data as AdminStudentOverview[] | null) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);

  const eligible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return students.filter((student) => {
      if (!student.guardian_email) return false;
      if (activeOnly && !student.is_active) return false;
      if (normalized && !`${student.display_name} ${student.guardian_name ?? ""} ${student.guardian_email} ${student.tags.join(" ")}`.toLocaleLowerCase("es").includes(normalized)) return false;
      return true;
    });
  }, [activeOnly, query, students]);

  const recipients = eligible.filter((student) => selected.has(student.student_id));
  const recipientEmails = Array.from(new Set(recipients.map((student) => student.guardian_email).filter(Boolean))) as string[];

  function toggleAll(value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      eligible.forEach((student) => value ? next.add(student.student_id) : next.delete(student.student_id));
      return next;
    });
  }

  function openDraft() {
    if (recipientEmails.length === 0) { setNotice("Selecciona al menos un tutor con correo."); return; }
    window.location.href = `mailto:?bcc=${encodeURIComponent(recipientEmails.join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNotice(`Borrador preparado para ${recipientEmails.length} destinatarios en copia oculta. Revísalo antes de enviarlo.`);
  }

  async function copyBcc() {
    if (recipientEmails.length === 0) { setNotice("Selecciona al menos un tutor con correo."); return; }
    await navigator.clipboard.writeText(recipientEmails.join(", "));
    setNotice(`${recipientEmails.length} correos copiados para pegarlos en CCO/BCC.`);
  }

  async function markContacted() {
    if (recipients.length === 0) return;
    setMarking(true);
    const { error } = await supabase.rpc("admin_mark_students_contacted", { p_student_ids: recipients.map((student) => student.student_id), p_channel: "email" });
    if (error) setNotice(error.message); else { setNotice(`Contacto registrado para ${recipients.length} alumnos.`); await load(); }
    setMarking(false);
  }

  function exportRecipients() {
    downloadCsv(`destinatarios-academia-magica-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Alumno", "Tutor", "Email", "Estado", "Etiquetas", "Último contacto"],
      ...recipients.map((student) => [student.display_name, student.guardian_name, student.guardian_email, student.is_active ? "Activo" : "Inactivo", student.tags.join(" | "), student.last_contacted_at]),
    ]);
    setNotice(`Lista de ${recipients.length} destinatarios exportada.`);
  }

  return <div>
    <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Familias</p><h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">Comunicación</h1><p className="mt-1 max-w-2xl text-slate-500">Prepara mensajes por segmentos sin revelar las direcciones entre familias.</p></div>
    {notice && <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Cerrar aviso" className="font-bold">×</button></div>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-extrabold">1. Destinatarios</h2><p className="text-sm text-slate-500">Solo aparecen alumnos con email de tutor.</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold text-violet-800">{recipients.length} seleccionados</span></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar o filtrar por etiqueta…" className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /><label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="h-4 w-4 accent-violet-600" />Solo activos</label></div><label className="mt-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-extrabold text-slate-700"><input type="checkbox" checked={eligible.length > 0 && eligible.every((student) => selected.has(student.student_id))} onChange={(e) => toggleAll(e.target.checked)} className="h-4 w-4 accent-violet-600" />Seleccionar los {eligible.length} resultados</label><div className="mt-2 max-h-[430px] overflow-y-auto divide-y divide-slate-100">{loading ? <p className="py-8 text-center text-sm text-slate-400">Cargando…</p> : eligible.map((student) => <label key={student.student_id} className="flex cursor-pointer items-start gap-3 py-3 hover:bg-slate-50"><input type="checkbox" checked={selected.has(student.student_id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(student.student_id)) next.delete(student.student_id); else next.add(student.student_id); return next; })} className="mt-1 h-4 w-4 accent-violet-600" /><span className="min-w-0"><span className="block font-extrabold text-slate-800">{student.display_name} <span className="font-normal text-slate-400">· {student.guardian_name ?? "Tutor sin nombre"}</span></span><span className="block truncate text-xs text-slate-500">{student.guardian_email}</span>{student.tags.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{student.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{tag}</span>)}</span>}</span></label>)}{!loading && eligible.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No hay destinatarios con estos filtros. Añade emails desde las fichas de alumno.</p>}</div></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"><h2 className="font-display text-xl font-extrabold">2. Preparar mensaje</h2><div className="mt-5 space-y-4"><label className="block text-sm font-bold text-slate-700">Asunto<input maxLength={180} value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label><label className="block text-sm font-bold text-slate-700">Mensaje<textarea maxLength={5000} rows={11} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal leading-6 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label></div><div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Privacidad:</strong> las direcciones se colocan en CCO/BCC, por lo que una familia no verá el correo de otra. Academia Mágica no envía el mensaje automáticamente: se abre como borrador para que lo revises.</div><div className="mt-5 flex flex-wrap gap-2"><button onClick={openDraft} disabled={recipients.length === 0} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">Abrir borrador en correo</button><button onClick={copyBcc} disabled={recipients.length === 0} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Copiar CCO</button><button onClick={exportRecipients} disabled={recipients.length === 0} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Exportar CSV</button></div><div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-extrabold text-slate-800">Después de enviar</h3><p className="mt-1 text-sm text-slate-500">Marca el contacto solo cuando hayas enviado realmente el mensaje.</p><button onClick={markContacted} disabled={marking || recipients.length === 0} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{marking ? "Registrando…" : "Marcar seleccionados como contactados"}</button></div></section>
    </div>
  </div>;
}

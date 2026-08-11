"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downloadCsv, relativeActivity } from "@/lib/admin-format";
import type { AdminStudentOverview } from "@/types/admin";
import type { Subject } from "@/types/database";

type Filter = "all" | "active" | "inactive" | "attention" | "no-email";
type Sort = "name" | "activity" | "accuracy" | "diamonds";

function needsAttention(student: AdminStudentOverview) {
  if (!student.is_active) return false;
  if (!student.last_activity_at) return true;
  const days = (Date.now() - new Date(student.last_activity_at).getTime()) / 86_400_000;
  return days > 14 || (student.attempt_count >= 3 && (student.accuracy_pct ?? 100) < 60);
}

export default function AlumnosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [students, setStudents] = useState<AdminStudentOverview[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [pin, setPin] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [statusTarget, setStatusTarget] = useState<AdminStudentOverview | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudentOverview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [{ data, error }, { data: subjectData }] = await Promise.all([
      supabase.rpc("admin_students_overview"),
      supabase.from("subjects").select("id, slug, name, category, icon, color, sort_order, active").eq("active", true).order("sort_order"),
    ]);
    if (error) setLoadError("No se pudo cargar la vista avanzada de alumnos.");
    setStudents((data as AdminStudentOverview[] | null) ?? []);
    setSubjects((subjectData as Subject[] | null) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!statusTarget && !deleteTarget) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!changingStatus) setStatusTarget(null);
      if (!deleting) setDeleteTarget(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [changingStatus, deleteTarget, deleting, statusTarget]);

  const subjectsByCategory = useMemo(() => {
    return subjects.reduce<Record<string, Subject[]>>((groups, subject) => {
      (groups[subject.category] ??= []).push(subject);
      return groups;
    }, {});
  }, [subjects]);

  const visibleStudents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return students
      .filter((student) => {
        if (normalized && !`${student.display_name} ${student.username ?? ""} ${student.guardian_name ?? ""} ${student.guardian_email ?? ""} ${student.tags.join(" ")}`.toLocaleLowerCase("es").includes(normalized)) return false;
        if (filter === "active" && !student.is_active) return false;
        if (filter === "inactive" && student.is_active) return false;
        if (filter === "attention" && !needsAttention(student)) return false;
        if (filter === "no-email" && student.guardian_email) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "activity") return (new Date(b.last_activity_at ?? 0).getTime() - new Date(a.last_activity_at ?? 0).getTime());
        if (sort === "accuracy") return (b.accuracy_pct ?? -1) - (a.accuracy_pct ?? -1);
        if (sort === "diamonds") return b.diamonds - a.diamonds;
        return a.display_name.localeCompare(b.display_name, "es");
      });
  }, [filter, query, sort, students]);

  const selectedStudents = students.filter((student) => selected.has(student.student_id));

  function toggleSelection(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exportStudents() {
    const source = selectedStudents.length > 0 ? selectedStudents : visibleStudents;
    downloadCsv(`alumnos-academia-magica-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Nombre", "Usuario", "Estado", "Tutor", "Email tutor", "Franja", "Diamantes", "Intentos", "Precisión", "Temas aprobados", "Última actividad", "Etiquetas"],
      ...source.map((student) => [
        student.display_name, student.username, student.is_active ? "Activo" : "Inactivo",
        student.guardian_name, student.guardian_email, student.age_bracket, student.diamonds,
        student.attempt_count, student.accuracy_pct, student.topics_passed, student.last_activity_at,
        student.tags.join(" | "),
      ]),
    ]);
    setNotice(`Exportados ${source.length} alumnos. Supabase sigue siendo la base de datos principal.`);
  }

  function openEmail() {
    const source = selectedStudents.length > 0 ? selectedStudents : visibleStudents;
    const emails = Array.from(new Set(source.map((student) => student.guardian_email).filter(Boolean))) as string[];
    if (emails.length === 0) {
      setNotice("Los alumnos seleccionados aún no tienen correo de tutor. Añádelo desde su ficha.");
      return;
    }
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent("Academia Mágica")}`;
    setNotice(`Preparado un correo en copia oculta para ${emails.length} destinatarios. No se ha enviado automáticamente.`);
  }

  async function createStudent(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const { data, error } = await supabase.functions.invoke("create-student", {
      body: { displayName, username, birthdate, pin, subjectIds: Array.from(selectedSubjects) },
    });
    if (error || data?.error) {
      setFormError(data?.error ?? error?.message ?? "No se pudo crear el alumno");
      setSubmitting(false);
      return;
    }
    setNotice(`${displayName} fue creado correctamente.`);
    setDisplayName(""); setUsername(""); setBirthdate(""); setPin(""); setSelectedSubjects(new Set());
    setShowCreate(false);
    setSubmitting(false);
    await load();
  }

  async function changeStatus() {
    if (!statusTarget) return;
    setChangingStatus(true);
    const nextActive = !statusTarget.is_active;
    const { error } = await supabase.rpc("admin_set_student_active", {
      p_student_id: statusTarget.student_id,
      p_is_active: nextActive,
      p_reason: statusReason.trim() || null,
    });
    if (error) setNotice(error.message);
    else {
      setNotice(`${statusTarget.display_name} quedó ${nextActive ? "activo" : "inactivo"}. La acción fue registrada.`);
      setStatusTarget(null); setStatusReason(""); await load();
    }
    setChangingStatus(false);
  }

  async function deleteStudent() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("delete-student", { body: { studentId: deleteTarget.student_id } });
    if (error || data?.error) setNotice(data?.error ?? error?.message ?? "No se pudo eliminar el alumno");
    else {
      setNotice(`${deleteTarget.display_name} fue eliminado y sus datos quedaron respaldados.`);
      setDeleteTarget(null); setSelected((current) => { const next = new Set(current); next.delete(deleteTarget.student_id); return next; });
      await load();
    }
    setDeleting(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Gestión operativa</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">Alumnos</h1>
          <p className="mt-1 text-slate-500">Busca, segmenta y actúa sin perder el historial.</p>
        </div>
        <button onClick={() => setShowCreate((value) => !value)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
          {showCreate ? "Cerrar formulario" : "+ Nuevo alumno"}
        </button>
      </div>

      {notice && <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Cerrar aviso" className="font-bold">×</button></div>}
      {loadError && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>}

      {showCreate && (
        <form onSubmit={createStudent} className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold">Crear alumno</h2><p className="text-sm text-slate-500">El PIN se guarda de forma segura mediante Supabase Auth.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Nombre visible<input required maxLength={120} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. Sofía" /></label>
            <label className="text-sm font-bold text-slate-700">Usuario<input required maxLength={40} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="sofia" /></label>
            <label className="text-sm font-bold text-slate-700">Fecha de nacimiento <span className="font-normal text-slate-400">(opcional)</span><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label>
            <label className="text-sm font-bold text-slate-700">PIN de acceso<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="6 dígitos" /></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-extrabold text-slate-700">Materias iniciales ({selectedSubjects.size})</legend><div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 p-3">{Object.entries(subjectsByCategory).map(([category, group]) => <div key={category} className="mb-4 last:mb-0"><p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">{category}</p><div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{group.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={selectedSubjects.has(subject.id)} onChange={() => setSelectedSubjects((current) => { const next = new Set(current); if (next.has(subject.id)) next.delete(subject.id); else next.add(subject.id); return next; })} className="h-4 w-4 accent-violet-600" />{subject.icon} {subject.name}</label>)}</div></div>)}</div></fieldset>
          {formError && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{formError}</p>}
          <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={submitting} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{submitting ? "Creando…" : "Crear alumno"}</button></div>
        </form>
      )}

      <section aria-label="Filtros y acciones" className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <label className="relative"><span className="sr-only">Buscar alumnos</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar alumno, tutor, email o etiqueta…" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" /></label>
          <label><span className="sr-only">Filtrar alumnos</span><select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="attention">Necesitan atención</option><option value="no-email">Sin email de tutor</option></select></label>
          <label><span className="sr-only">Ordenar alumnos</span><select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="name">Ordenar por nombre</option><option value="activity">Actividad reciente</option><option value="accuracy">Mayor precisión</option><option value="diamonds">Más diamantes</option></select></label>
          <div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700" aria-label="Actualizar listado">↻</button><button onClick={openEmail} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700">✉ Email</button><button onClick={exportStudents} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700">↓ CSV</button></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{visibleStudents.length} resultados · {selected.size} seleccionados</span>{selected.size > 0 && <button onClick={() => setSelected(new Set())} className="font-bold text-violet-600">Limpiar selección</button>}</div>
      </section>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        {loading ? <div className="p-10 text-center text-slate-500" role="status">Cargando alumnos…</div> : visibleStudents.length === 0 ? <div className="p-10 text-center"><p className="font-bold text-slate-700">No hay alumnos con estos filtros.</p><p className="mt-1 text-sm text-slate-400">Prueba otra búsqueda o crea un alumno nuevo.</p></div> : (<>
          <div className="divide-y divide-slate-100 md:hidden">
            {visibleStudents.map((student) => (
              <article key={student.student_id} className={`p-4 ${!student.is_active ? "bg-slate-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" aria-label={`Seleccionar a ${student.display_name}`} checked={selected.has(student.student_id)} onChange={() => toggleSelection(student.student_id)} className="mt-1 h-4 w-4 accent-violet-600" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><div><Link href={`/admin/alumnos/${student.student_id}`} className="font-extrabold text-slate-900">{student.display_name}</Link><p className="text-xs text-slate-400">@{student.username ?? "sin usuario"}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${student.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{student.is_active ? "Activo" : "Inactivo"}</span></div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-slate-400">Actividad</dt><dd className="font-bold text-slate-700">{relativeActivity(student.last_activity_at)}</dd></div><div><dt className="text-slate-400">Precisión</dt><dd className="font-bold text-slate-700">{student.accuracy_pct == null ? "—" : `${student.accuracy_pct}%`}</dd></div><div><dt className="text-slate-400">Saldo</dt><dd className="font-bold text-cyan-700">💎 {student.diamonds}</dd></div></dl>
                    <div className="mt-3 flex gap-2"><Link href={`/admin/alumnos/${student.student_id}`} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700">Abrir ficha</Link><button onClick={() => { setStatusTarget(student); setStatusReason(student.status_reason ?? ""); }} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{student.is_active ? "Desactivar" : "Activar"}</button></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3"><input type="checkbox" aria-label="Seleccionar resultados visibles" checked={visibleStudents.every((student) => selected.has(student.student_id))} onChange={(e) => setSelected((current) => { const next = new Set(current); visibleStudents.forEach((student) => e.target.checked ? next.add(student.student_id) : next.delete(student.student_id)); return next; })} className="h-4 w-4 accent-violet-600" /></th><th className="px-3 py-3">Alumno</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Actividad</th><th className="px-3 py-3">Progreso</th><th className="px-3 py-3">Precisión</th><th className="px-3 py-3">Diamantes</th><th className="px-3 py-3">Tutor</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{visibleStudents.map((student) => <tr key={student.student_id} className={`transition hover:bg-violet-50/30 ${!student.is_active ? "bg-slate-50/70" : ""}`}><td className="px-4 py-4"><input type="checkbox" aria-label={`Seleccionar a ${student.display_name}`} checked={selected.has(student.student_id)} onChange={() => toggleSelection(student.student_id)} className="h-4 w-4 accent-violet-600" /></td><td className="px-3 py-4"><Link href={`/admin/alumnos/${student.student_id}`} className="font-extrabold text-slate-900 hover:text-violet-700">{student.display_name}</Link><p className="text-xs text-slate-400">@{student.username ?? "sin usuario"} · {student.age_bracket ?? "sin franja"}</p></td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${student.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{student.is_active ? "Activo" : "Inactivo"}</span>{needsAttention(student) && <span className="ml-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-extrabold text-amber-800">Atención</span>}</td><td className="px-3 py-4 font-bold text-slate-700">{relativeActivity(student.last_activity_at)}<p className="text-xs font-normal text-slate-400">{student.attempt_count} intentos</p></td><td className="px-3 py-4"><span className="font-extrabold text-slate-800">{student.topics_passed}</span><span className="text-slate-400">/{student.topics_started} temas</span><p className="text-xs text-slate-400">{student.assigned_subjects} materias</p></td><td className="px-3 py-4">{student.accuracy_pct == null ? <span className="text-slate-400">—</span> : <span className={`font-extrabold ${student.accuracy_pct >= 70 ? "text-emerald-700" : student.accuracy_pct >= 50 ? "text-amber-700" : "text-red-700"}`}>{student.accuracy_pct}%</span>}</td><td className="px-3 py-4 font-extrabold text-cyan-700">💎 {student.diamonds}</td><td className="max-w-48 px-3 py-4"><p className="truncate font-bold text-slate-700">{student.guardian_name ?? "Sin registrar"}</p><p className="truncate text-xs text-slate-400">{student.guardian_email ?? "Falta email"}</p></td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/alumnos/${student.student_id}`} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 hover:bg-violet-100">Abrir ficha</Link><button onClick={() => { setStatusTarget(student); setStatusReason(student.status_reason ?? ""); }} className="rounded-lg px-2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">{student.is_active ? "Desactivar" : "Activar"}</button><button onClick={() => setDeleteTarget(student)} aria-label={`Eliminar a ${student.display_name}`} className="rounded-lg px-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Eliminar</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </>)}
      </div>

      {statusTarget && <div role="dialog" aria-modal="true" aria-labelledby="status-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="status-title" className="font-display text-xl font-extrabold">{statusTarget.is_active ? "Desactivar" : "Activar"} a {statusTarget.display_name}</h2><p className="mt-2 text-sm text-slate-500">{statusTarget.is_active ? "No podrá entrar, pero conservará todo su progreso y compras." : "Recuperará el acceso inmediatamente."}</p><label className="mt-4 block text-sm font-bold text-slate-700">Motivo <span className="font-normal text-slate-400">(opcional)</span><textarea maxLength={500} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. Pausa solicitada por la familia" /></label><div className="mt-5 flex justify-end gap-3"><button disabled={changingStatus} onClick={() => setStatusTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={changingStatus} onClick={changeStatus} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{changingStatus ? "Guardando…" : "Confirmar"}</button></div></div></div>}
      {deleteTarget && <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="delete-title" className="font-display text-xl font-extrabold text-red-700">Eliminar a {deleteTarget.display_name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Se guardará una copia completa antes de eliminar su acceso, progreso, inventario y actividad. Para una pausa temporal usa «Desactivar».</p><div className="mt-5 flex justify-end gap-3"><button disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={deleting} onClick={deleteStudent} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Eliminando…" : "Eliminar y respaldar"}</button></div></div></div>}
    </div>
  );
}

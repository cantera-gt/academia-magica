"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/types/database";
import { fadeSlideUp, SPRING_UI, SPRING_PLAYFUL } from "@/lib/motion";

const SUPABASE_URL = "https://wlxgvbabljflvhtxuzue.supabase.co";

interface StudentDetail {
  id: string;
  display_name: string;
  username: string | null;
  diamonds: number;
  gender: string | null;
  is_active: boolean;
}

export default function EditarAlumnoPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = String(params.id);
  const supabase = createClient();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [togglingActive, setTogglingActive] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const subjectsByCategory = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    for (const s of subjects) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [subjects]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: studentData, error: studentErr } = await supabase
      .from("profiles")
      .select("id, display_name, username, diamonds, gender, is_active")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (studentErr || !studentData) {
      setError("No se encontró ese alumno.");
      setLoading(false);
      return;
    }
    setStudent(studentData as StudentDetail);

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, slug, name, category, icon, color, sort_order, active")
      .eq("active", true)
      .order("sort_order");
    setSubjects((subjectsData as Subject[]) ?? []);

    const { data: assignedData } = await supabase
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", studentId);
    setAssigned(
      new Set((assignedData ?? []).map((r: { subject_id: string }) => r.subject_id))
    );

    setLoading(false);
  }, [supabase, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSubject(id: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: currentRows } = await supabase
      .from("student_subjects")
      .select("subject_id")
      .eq("student_id", studentId);
    const current = new Set(
      (currentRows ?? []).map((r: { subject_id: string }) => r.subject_id)
    );

    const toAdd = Array.from(assigned).filter((id) => !current.has(id));
    const toRemove = Array.from(current).filter((id) => !assigned.has(id));

    if (toAdd.length > 0) {
      const { error: addErr } = await supabase
        .from("student_subjects")
        .insert(toAdd.map((subject_id) => ({ student_id: studentId, subject_id })));
      if (addErr) {
        setError(addErr.message);
        setSaving(false);
        return;
      }
    }

    if (toRemove.length > 0) {
      const { error: removeErr } = await supabase
        .from("student_subjects")
        .delete()
        .eq("student_id", studentId)
        .in("subject_id", toRemove);
      if (removeErr) {
        setError(removeErr.message);
        setSaving(false);
        return;
      }
    }

    setSuccess("Materias actualizadas.");
    setSaving(false);
  }

  async function handleToggleActive() {
    if (!student) return;
    setTogglingActive(true);
    const nextActive = !student.is_active;
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ is_active: nextActive })
      .eq("id", student.id);
    if (!updateErr) {
      setStudent({ ...student, is_active: nextActive });
    }
    setTogglingActive(false);
  }

  async function handleDeleteConfirm() {
    if (!student) return;
    setDeleting(true);
    setDeleteError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setDeleteError("Tu sesión expiró, volvé a ingresar.");
      setDeleting(false);
      return;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ studentId: student.id }),
    });

    const result = await res.json();

    if (!res.ok) {
      setDeleteError(result.error ?? "No se pudo eliminar el alumno");
      setDeleting(false);
      return;
    }

    router.push("/admin/alumnos");
  }

  if (loading) {
    return <p className="text-slate-500">Cargando...</p>;
  }

  if (error && !student) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/admin/alumnos" className="mt-4 inline-block text-purple-600">
          ← Volver a Alumnos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/alumnos" className="text-sm text-slate-500 hover:text-slate-800">
        ← Alumnos
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {student?.display_name}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                student?.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {student?.is_active ? "Activo" : "Desactivado"}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Usuario: {student?.username} · 💎 {student?.diamonds}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleToggleActive}
            disabled={togglingActive}
            whileHover={{ scale: togglingActive ? 1 : 1.03 }}
            whileTap={{ scale: togglingActive ? 1 : 0.97 }}
            transition={SPRING_UI}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {togglingActive
              ? "..."
              : student?.is_active
              ? "Desactivar alumno"
              : "Activar alumno"}
          </motion.button>
          <motion.button
            onClick={() => {
              setDeleteError(null);
              setShowDeleteConfirm(true);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_UI}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Eliminar alumno
          </motion.button>
        </div>
      </div>

      <p className="mt-2 max-w-2xl text-xs text-slate-400">
        Desactivar oculta al alumno del selector de inicio y le impide entrar (por ejemplo,
        si todavía no se pagó ese mes), sin perder nada de su información — se puede
        reactivar en cualquier momento. Eliminar es permanente: se guarda una copia de
        todos sus datos por si se necesita restablecer más adelante.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Materias asignadas ({assigned.size})
          </h2>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.03 }}
            whileTap={{ scale: saving ? 1 : 0.97 }}
            transition={SPRING_UI}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </motion.button>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Solo las materias que marques acá le van a aparecer a{" "}
          {student?.display_name} en su panel.
        </p>

        <AnimatePresence>
          {success && (
            <motion.p
              key="success"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-3 rounded-lg bg-green-100 p-2 text-sm text-green-800"
            >
              {success}
            </motion.p>
          )}
          {error && (
            <motion.p
              key="error"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fadeSlideUp}
              className="mt-3 rounded-lg bg-red-100 p-2 text-sm text-red-800"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-4">
          {Object.entries(subjectsByCategory).map(([category, subs]) => (
            <div key={category} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {category}
              </p>
              <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-3">
                {subs.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={assigned.has(s.id)}
                      onChange={() => toggleSubject(s.id)}
                      className="rounded border-slate-300 text-purple-600"
                    />
                    {s.icon ? `${s.icon} ` : ""}
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && student && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={SPRING_PLAYFUL}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-slate-900">
                ¿Eliminar a {student.display_name}?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Esta acción no se puede deshacer desde la app. Antes de borrar nada,
                guardamos una copia completa de sus datos (progreso, diamantes, tienda,
                materias) por si más adelante querés restablecerlo.
              </p>
              {deleteError && (
                <p className="mt-3 rounded-lg bg-red-100 p-2 text-sm text-red-800">
                  {deleteError}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  whileHover={{ scale: deleting ? 1 : 1.03 }}
                  whileTap={{ scale: deleting ? 1 : 0.97 }}
                  transition={SPRING_UI}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar y guardar copia"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

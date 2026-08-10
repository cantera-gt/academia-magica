"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/types/database";

interface StudentDetail {
  id: string;
  display_name: string;
  username: string | null;
  diamonds: number;
  active_character: string | null;
}

export default function EditarAlumnoPage() {
  const params = useParams();
  const studentId = String(params.id);
  const supabase = createClient();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      .select("id, display_name, username, diamonds, active_character")
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

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {student?.display_name}
          </h1>
          <p className="text-sm text-slate-500">
            Usuario: {student?.username} · 💎 {student?.diamonds}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Materias asignadas ({assigned.size})
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Solo las materias que marques acá le van a aparecer a{" "}
          {student?.display_name} en su panel.
        </p>

        {success && (
          <p className="mt-3 rounded-lg bg-green-100 p-2 text-sm text-green-800">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-100 p-2 text-sm text-red-800">
            {error}
          </p>
        )}

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
    </div>
  );
}

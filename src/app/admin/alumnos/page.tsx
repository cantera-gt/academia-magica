"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Subject } from "@/types/database";
import { collapseExpand, fadeSlideUp, staggerItemUi, SPRING_UI } from "@/lib/motion";

interface StudentRow {
  id: string;
  username: string | null;
  display_name: string;
  birthdate: string | null;
  diamonds: number;
  gender: string | null;
  is_active: boolean;
}

const SUPABASE_URL = "https://wlxgvbabljflvhtxuzue.supabase.co";

export default function AlumnosPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [pin, setPin] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );

  const subjectsByCategory = useMemo(() => {
    const groups: Record<string, Subject[]> = {};
    for (const s of subjects) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [subjects]);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, birthdate, diamonds, gender, is_active")
      .eq("role", "student")
      .order("display_name");
    setStudents((data as StudentRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  const loadSubjects = useCallback(async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, slug, name, category, icon, color, sort_order, active")
      .eq("active", true)
      .order("sort_order");
    setSubjects((data as Subject[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    loadStudents();
    loadSubjects();
  }, [loadStudents, loadSubjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Tu sesión expiró, volvé a ingresar.");
      setSubmitting(false);
      return;
    }

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/create-student`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          displayName,
          username,
          birthdate,
          pin,
          subjectIds: Array.from(selectedSubjects),
        }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      setError(result.error ?? "No se pudo crear el alumno");
      setSubmitting(false);
      return;
    }

    setSuccess(`¡${displayName} fue creado! Usuario: ${result.username}`);
    setDisplayName("");
    setUsername("");
    setBirthdate("");
    setPin("");
    setSelectedSubjects(new Set());
    setSubmitting(false);
    setShowForm(false);
    loadStudents();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Alumnos</h1>
        <motion.button
          onClick={() => setShowForm((v) => !v)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_UI}
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
        >
          {showForm ? "Cancelar" : "+ Nuevo alumno"}
        </motion.button>
      </div>

      <AnimatePresence>
        {success && (
          <motion.p
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeSlideUp}
            className="mt-4 rounded-lg bg-green-100 p-3 text-green-800"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showForm && (
        <motion.form
          initial="initial"
          animate="animate"
          exit="exit"
          variants={collapseExpand}
          onSubmit={handleCreate}
          className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow sm:grid-cols-2"
        >
          <div>
            <label className="text-sm text-slate-600">Nombre</label>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Ej: Sofía"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">
              Usuario (sin espacios)
            </label>
            <input
              required
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="sofia"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">
              PIN de acceso (6 dígitos)
            </label>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="123456"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-slate-600">
              Materias asignadas ({selectedSubjects.size} seleccionadas)
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Elegí qué materias va a poder estudiar este alumno. Podés
              cambiarlo después desde su ficha.
            </p>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {Object.entries(subjectsByCategory).map(([category, subs]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {category}
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {subs.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.has(s.id)}
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

          {error && (
            <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            transition={SPRING_UI}
            className="sm:col-span-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Creando..." : "Crear alumno"}
          </motion.button>
        </motion.form>
        )}
      </AnimatePresence>

      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerItemUi}
        className="mt-6 overflow-hidden rounded-xl bg-white shadow"
      >
        {loading ? (
          <p className="p-6 text-slate-500">Cargando...</p>
        ) : students.length === 0 ? (
          <p className="p-6 text-slate-500">
            Todavía no creaste ningún alumno.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Personaje</th>
                <th className="px-4 py-3">Diamantes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {s.display_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.username}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.gender === "girl" ? "Nena" : s.gender === "boy" ? "Nene" : "Sin elegir"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    💎 {s.diamonds}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/alumnos/${s.id}`}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800"
                    >
                      Materias →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}

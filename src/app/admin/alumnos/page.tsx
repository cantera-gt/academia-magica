"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StudentRow {
  id: string;
  username: string | null;
  display_name: string;
  birthdate: string | null;
  diamonds: number;
  active_character: string | null;
  is_active: boolean;
}

const SUPABASE_URL = "https://wlxgvbabljflvhtxuzue.supabase.co";

export default function AlumnosPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [pin, setPin] = useState("");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, birthdate, diamonds, active_character, is_active")
      .eq("role", "student")
      .order("display_name");
    setStudents((data as StudentRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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
        body: JSON.stringify({ displayName, username, birthdate, pin }),
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
    setSubmitting(false);
    setShowForm(false);
    loadStudents();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Alumnos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
        >
          {showForm ? "Cancelar" : "+ Nuevo alumno"}
        </button>
      </div>

      {success && (
        <p className="mt-4 rounded-lg bg-green-100 p-3 text-green-800">
          {success}
        </p>
      )}

      {showForm && (
        <form
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

          {error && (
            <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Creando..." : "Crear alumno"}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
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
                    {s.active_character ?? "Sin elegir"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    💎 {s.diamonds}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

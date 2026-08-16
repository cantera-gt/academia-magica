"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminSubjectSubscription } from "@/types/database";

type Filter = "todas" | "vencida" | "por_vencer" | "activa" | "sin_vencimiento";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "vencida", label: "Vencidas" },
  { id: "por_vencer", label: "Por vencer (14 días)" },
  { id: "activa", label: "Activas" },
  { id: "sin_vencimiento", label: "Sin vencimiento" },
];

const STATUS_STYLES: Record<string, string> = {
  vencida: "bg-red-100 text-red-700",
  por_vencer: "bg-amber-100 text-amber-800",
  activa: "bg-emerald-100 text-emerald-700",
  sin_vencimiento: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  vencida: "Vencida",
  por_vencer: "Por vencer",
  activa: "Activa",
  sin_vencimiento: "Sin vencimiento",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminSubscriptionsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<AdminSubjectSubscription[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [extendingKey, setExtendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_subject_subscriptions");
    if (!error) setRows((data as AdminSubjectSubscription[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === "todas" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { vencida: 0, por_vencer: 0, activa: 0, sin_vencimiento: 0 };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  async function extend(row: AdminSubjectSubscription, months: number) {
    const key = `${row.student_id}:${row.subject_id}`;
    setExtendingKey(key);
    setNotice(null);
    const base = row.expires_at && new Date(row.expires_at) > new Date() ? new Date(row.expires_at) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    const { error } = await supabase.rpc("admin_set_subject_expiry", {
      p_student_id: row.student_id,
      p_subject_id: row.subject_id,
      p_expires_at: next.toISOString(),
    });
    if (error) setNotice(error.message);
    else {
      setNotice(`${row.student_name} · ${row.subject_name}: extendido ${months} meses.`);
      await load();
    }
    setExtendingKey(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-950">Suscripciones por materia</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vencimiento de acceso (3 meses por compra). Extendé manualmente los pagos hechos fuera de
            PayPal.
          </p>
        </div>
        <Link
          href="/admin/alumnos"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
        >
          ← Alumnos
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Vencidas</p>
          <p className="mt-1 text-2xl font-extrabold text-red-700">{counts.vencida}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Por vencer</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{counts.por_vencer}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Activas</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{counts.activa}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Sin vencimiento</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-600">{counts.sin_vencimiento}</p>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"
        >
          <span>{notice}</span>
          <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      <nav aria-label="Filtrar suscripciones" className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-current={filter === f.id ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              filter === f.id ? "bg-violet-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead>
            <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Alumno</th>
              <th className="px-4 py-3">Familia</th>
              <th className="px-4 py-3">Materia</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Días</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay suscripciones en este filtro.
                </td>
              </tr>
            )}
            {filtered.map((row) => {
              const key = `${row.student_id}:${row.subject_id}`;
              return (
                <tr key={key}>
                  <td className="px-4 py-3 font-bold text-slate-800">{row.student_name}</td>
                  <td className="px-4 py-3 text-slate-500">{row.household_name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.subject_icon} {row.subject_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(row.expires_at)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {row.days_remaining == null ? "—" : row.days_remaining}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${STATUS_STYLES[row.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={extendingKey === key}
                      onClick={() => extend(row, 3)}
                      className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-extrabold text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                    >
                      {extendingKey === key ? "…" : "+3 meses"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

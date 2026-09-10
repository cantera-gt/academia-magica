"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEnrollmentPricing } from "@/lib/enrollment-pricing";
import type { AdminStudentOverview } from "@/types/admin";
import type { Subject } from "@/types/database";

const PAYMENT_METHODS = ["Efectivo", "Transferencia bancaria", "Bizum", "Otro"] as const;

function todayLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function AdminNewOrderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<AdminStudentOverview[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [studentId, setStudentId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [accessMonths, setAccessMonths] = useState(3);
  const [totalPrice, setTotalPrice] = useState<number | "">("");
  const [totalTouched, setTotalTouched] = useState(false);
  const [paidAt, setPaidAt] = useState(todayLocalDate());
  const [status, setStatus] = useState<"pending" | "paid" | "cancelled">("paid");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("Transferencia bancaria");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingOptions(true);
    const [{ data: studentRows }, { data: subjectRows }] = await Promise.all([
      supabase.rpc("admin_students_overview"),
      supabase.from("subjects").select("id, slug, name, category, icon, color, sort_order, active").eq("active", true).order("sort_order"),
    ]);
    setStudents((studentRows as AdminStudentOverview[] | null) ?? []);
    setSubjects((subjectRows as Subject[] | null) ?? []);
    setLoadingOptions(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const subjectGroups = useMemo(
    () =>
      subjects.reduce<Record<string, Subject[]>>((groups, subject) => {
        (groups[subject.category] ??= []).push(subject);
        return groups;
      }, {}),
    [subjects]
  );

  const suggestedPricing = useMemo(() => getEnrollmentPricing(selectedSubjects.size), [selectedSubjects]);

  useEffect(() => {
    if (!totalTouched) setTotalPrice(suggestedPricing.totalUsd || "");
  }, [suggestedPricing, totalTouched]);

  function toggleSubject(id: string) {
    setSelectedSubjects((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!studentId) { setError("Elige un alumno."); return; }
    if (selectedSubjects.size === 0) { setError("Elige al menos una materia."); return; }
    if (!totalPrice || Number(totalPrice) <= 0) { setError("Indica un importe válido."); return; }
    if (!accessMonths || accessMonths < 1) { setError("Indica los meses de acceso."); return; }

    setSubmitting(true);
    try {
      let proofPath: string | null = null;
      if (proofFile) {
        const { data: householdId, error: householdError } = await supabase.rpc("my_household");
        if (householdError || !householdId) throw new Error("No se pudo identificar tu hogar para subir el archivo.");
        const safeName = proofFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${householdId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, proofFile, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;
        proofPath = path;
      }

      const methodNote = note.trim() ? `${paymentMethod}: ${note.trim()}` : paymentMethod;
      const paidAtIso = new Date(`${paidAt}T12:00:00`).toISOString();

      const { data: orderId, error: createError } = await supabase.rpc("admin_create_manual_subject_order", {
        p_student_id: studentId,
        p_subject_ids: Array.from(selectedSubjects),
        p_access_months: accessMonths,
        p_total_price_usd: Number(totalPrice),
        p_payment_status: status,
        p_payment_method_note: methodNote,
        p_paid_at: paidAtIso,
        p_proof_file_path: proofPath,
      });

      if (createError || !orderId) throw createError ?? new Error("No se pudo crear el pedido");

      router.push("/admin/pedidos");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar el pedido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/pedidos" className="text-sm font-bold text-slate-500 hover:text-violet-700">
        ← Volver a pedidos
      </Link>

      <h1 className="mt-3 font-display text-2xl font-extrabold text-slate-950">Añadir nuevo pedido</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registra un pago hecho fuera de PayPal (efectivo, transferencia, Bizum…) con nota y comprobante.
      </p>

      {loadingOptions ? (
        <p className="mt-8 text-sm text-slate-400">Cargando alumnos y materias…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <label className="block text-sm font-bold text-slate-700">
              Alumno
              <select
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
              >
                <option value="">— Elegir alumno —</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Materias</h2>
            <div className="mt-3 max-h-72 overflow-y-auto">
              {Object.entries(subjectGroups).map(([category, group]) => (
                <fieldset key={category} className="mb-4">
                  <legend className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">{category}</legend>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {group.map((subject) => (
                      <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedSubjects.has(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="h-4 w-4 accent-violet-600"
                        />
                        {subject.icon} {subject.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {selectedSubjects.size} materia{selectedSubjects.size === 1 ? "" : "s"} seleccionada{selectedSubjects.size === 1 ? "" : "s"}
              {suggestedPricing.totalUsd > 0 ? ` · sugerido: ${suggestedPricing.totalUsd} USD (${suggestedPricing.unitPriceUsd}/materia)` : ""}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Pago</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Meses de acceso
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={accessMonths}
                  onChange={(e) => setAccessMonths(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Importe total (USD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={totalPrice}
                  onChange={(e) => {
                    setTotalTouched(true);
                    setTotalPrice(e.target.value === "" ? "" : Number(e.target.value));
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Fecha del pago
                <input
                  type="date"
                  required
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Estado del pedido
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  <option value="paid">Completado (otorga acceso al instante)</option>
                  <option value="pending">Pendiente de pago</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Nota / referencia <span className="font-normal text-slate-400">(opcional)</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Operación #1234, pagó la abuela, transferencia a nombre de..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Comprobante <span className="font-normal text-slate-400">(foto o PDF, opcional)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-violet-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </label>
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/admin/pedidos" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Crear pedido"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

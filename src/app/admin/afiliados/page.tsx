"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminAffiliate } from "@/types/database";

type Filter = "todas" | "active" | "inactive";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "active", label: "Activas" },
  { id: "inactive", label: "Inactivas" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

export default function AfiliadosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [filter, setFilter] = useState<Filter>("todas");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("30");
  const [pin, setPin] = useState("");
  const [notes, setNotes] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_affiliates");
    if (!error) setAffiliates((data as AdminAffiliate[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "todas") return affiliates;
    return affiliates.filter((a) => a.status === filter);
  }, [affiliates, filter]);

  const totals = useMemo(() => {
    return affiliates.reduce(
      (acc, a) => {
        acc.sales += Number(a.total_sales_usd);
        acc.pending += Number(a.commission_pending_usd);
        acc.paid += Number(a.commission_paid_usd);
        return acc;
      },
      { sales: 0, pending: 0, paid: 0 },
    );
  }, [affiliates]);

  async function createAffiliate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setFormError("La comisión debe estar entre 0 y 100.");
      setSubmitting(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke("create-affiliate", {
      body: { name, email, phone: phone || null, commissionRate: rate, pin, notes: notes || null },
    });
    if (error || data?.error) {
      setFormError(data?.error ?? error?.message ?? "No se pudo crear la afiliada");
      setSubmitting(false);
      return;
    }
    setNotice(`${name} fue creada correctamente. Código de referido: ${data.code}`);
    setName(""); setEmail(""); setPhone(""); setCommissionRate("30"); setPin(""); setNotes("");
    setShowCreate(false);
    setSubmitting(false);
    await load();
  }

  function copyLink(code: string) {
    const link = `${origin}/?aff=${code}`;
    navigator.clipboard.writeText(link).then(
      () => setNotice(`Enlace de ${link} copiado al portapapeles.`),
      () => setNotice("No se pudo copiar el enlace. Cópialo manualmente desde la ficha."),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Ventas por referidos</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">Afiliados</h1>
          <p className="mt-1 text-slate-500">
            Crea afiliadas, genera su enlace y QR, y sigue las ventas y comisiones que generan.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        >
          {showCreate ? "Cerrar formulario" : "+ Nueva afiliada"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-lg">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Ventas generadas</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{money(totals.sales)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Comisión pendiente</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{money(totals.pending)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Comisión pagada</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{money(totals.paid)}</p>
        </div>
      </div>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <span>{notice}</span>
          <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">×</button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={createAffiliate} className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-extrabold">Crear afiliada</h2>
            <p className="text-sm text-slate-500">Recibirá su propio acceso (código + PIN) para ver sus ventas y comisiones.</p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Nombre
              <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. María López" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Correo de contacto
              <input required type="email" maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="maria@correo.com" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Teléfono <span className="font-normal text-slate-400">(opcional)</span>
              <input maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="+502 ..." />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Comisión %
              <input required type="number" min={0} max={100} step={0.5} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
            </label>
            <label className="text-sm font-bold text-slate-700">
              PIN de acceso
              <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="6 dígitos" />
            </label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
              Notas <span className="font-normal text-slate-400">(opcional, solo visibles para el admin)</span>
              <textarea maxLength={500} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. Grupo de mamás del cole X" />
            </label>
          </div>
          {formError && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{formError}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button disabled={submitting} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{submitting ? "Creando…" : "Crear afiliada"}</button>
          </div>
        </form>
      )}

      <nav aria-label="Filtrar afiliadas" className="mt-6 flex flex-wrap gap-2">
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
              <th className="px-4 py-3">Afiliada</th>
              <th className="px-4 py-3">Código / enlace</th>
              <th className="px-4 py-3">Comisión</th>
              <th className="px-4 py-3">Ventas</th>
              <th className="px-4 py-3">Total generado</th>
              <th className="px-4 py-3">Pendiente</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No hay afiliadas en este filtro.</td></tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/afiliados/${a.id}`} className="font-bold text-slate-800 hover:text-violet-700">{a.name}</Link>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => copyLink(a.code)} className="text-xs font-bold text-violet-600 hover:underline">
                    /?aff={a.code}
                  </button>
                </td>
                <td className="px-4 py-3 font-bold text-slate-700">{Number(a.commission_rate)}%</td>
                <td className="px-4 py-3 text-slate-600">{a.sales_count}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{money(a.total_sales_usd)}</td>
                <td className="px-4 py-3 font-bold text-amber-700">{money(a.commission_pending_usd)}</td>
                <td className="px-4 py-3 font-bold text-emerald-700">{money(a.commission_paid_usd)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${a.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {a.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/afiliados/${a.id}`} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 hover:bg-violet-100">
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {affiliates.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">Creadas desde {formatDate(affiliates[affiliates.length - 1].created_at)}.</p>
      )}
    </div>
  );
}

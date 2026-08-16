"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AdminSubjectOrder, SubjectOrderPaymentStatus } from "@/types/database";

type Filter = "todos" | "pending" | "paid" | "cancelled" | "otros";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "paid", label: "Completados" },
  { id: "cancelled", label: "Cancelados" },
  { id: "otros", label: "Otros" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  paid: { label: "Completado", className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pendiente de pago", className: "bg-amber-100 text-amber-800" },
  cancelled: { label: "Cancelado", className: "bg-slate-200 text-slate-600" },
  not_started: { label: "Sin iniciar", className: "bg-slate-100 text-slate-500" },
  failed: { label: "Fallido", className: "bg-red-100 text-red-700" },
  refunded: { label: "Reembolsado", className: "bg-purple-100 text-purple-700" },
};

const EDITABLE_STATUSES: SubjectOrderPaymentStatus[] = ["pending", "paid", "cancelled"];

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<AdminSubjectOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("todos");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofLoadingId, setProofLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_subject_orders");
    if (!error) setOrders((data as AdminSubjectOrder[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "todos") return orders;
    if (filter === "otros") return orders.filter((o) => !["pending", "paid", "cancelled"].includes(o.payment_status));
    return orders.filter((o) => o.payment_status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, paid: 0, cancelled: 0 };
    for (const o of orders) c[o.payment_status] = (c[o.payment_status] ?? 0) + 1;
    return c;
  }, [orders]);

  async function changeStatus(order: AdminSubjectOrder, status: SubjectOrderPaymentStatus) {
    if (status === order.payment_status) return;
    setUpdatingId(order.order_id);
    setNotice(null);
    const { error } = await supabase.rpc("admin_update_subject_order_status", {
      p_order_id: order.order_id,
      p_status: status,
    });
    if (error) setNotice(error.message);
    else {
      setNotice(`Pedido de ${order.student_name} actualizado a ${STATUS_BADGE[status]?.label ?? status}.`);
      await load();
    }
    setUpdatingId(null);
  }

  async function viewProof(order: AdminSubjectOrder) {
    if (!order.proof_file_path) return;
    setProofLoadingId(order.order_id);
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(order.proof_file_path, 300);
    setProofLoadingId(null);
    if (error || !data?.signedUrl) {
      setNotice(error?.message ?? "No se pudo abrir el comprobante");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-950">Pedidos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pedidos de PayPal y pagos registrados manualmente (efectivo, transferencia, etc.).
          </p>
        </div>
        <Link
          href="/admin/pedidos/nuevo"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
        >
          + Añadir nuevo pedido
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Pendientes</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{counts.pending}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Completados</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{counts.paid}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Cancelados</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-600">{counts.cancelled}</p>
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

      <nav aria-label="Filtrar pedidos" className="mt-5 flex flex-wrap gap-2">
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
              <th className="px-4 py-3">Materias</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Nota</th>
              <th className="px-4 py-3">Comprobante</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No hay pedidos en este filtro.
                </td>
              </tr>
            )}
            {filtered.map((order) => {
              const badge = STATUS_BADGE[order.payment_status] ?? STATUS_BADGE.not_started;
              const editable = order.payment_method === "manual" && EDITABLE_STATUSES.includes(order.payment_status as SubjectOrderPaymentStatus);
              return (
                <tr key={order.order_id}>
                  <td className="px-4 py-3 font-bold text-slate-800">{order.student_name}</td>
                  <td className="px-4 py-3 text-slate-700">{order.subject_names.join(", ")}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(order.paid_at ?? order.created_at)}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {Number(order.total_price_usd).toFixed(2)} {order.currency}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {order.payment_method === "paypal" ? "PayPal" : "Manual"}
                  </td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-slate-500" title={order.payment_note ?? undefined}>
                    {order.payment_note ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {order.proof_file_path ? (
                      <button
                        disabled={proofLoadingId === order.order_id}
                        onClick={() => viewProof(order)}
                        className="text-xs font-bold text-violet-600 hover:underline disabled:opacity-50"
                      >
                        {proofLoadingId === order.order_id ? "Abriendo…" : "Ver comprobante"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <select
                        disabled={updatingId === order.order_id}
                        value={order.payment_status}
                        onChange={(e) => changeStatus(order, e.target.value as SubjectOrderPaymentStatus)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-extrabold ${badge.className} disabled:opacity-50`}
                      >
                        <option value="pending">Pendiente de pago</option>
                        <option value="paid">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${badge.className}`}>{badge.label}</span>
                    )}
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

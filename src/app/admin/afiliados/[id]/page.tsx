"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { AdminAffiliate, AffiliateCommission } from "@/types/database";

const SOURCE_LABEL: Record<string, string> = {
  enrollment: "Matrícula",
  subject_order: "Materia / renovación",
};

function money(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AfiliadaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const affiliateId = params.id;
  const supabase = useMemo(() => createClient(), []);

  const [affiliate, setAffiliate] = useState<AdminAffiliate | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [rateInput, setRateInput] = useState("30");
  const [statusInput, setStatusInput] = useState<"active" | "inactive">("active");
  const [notesInput, setNotesInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [payTarget, setPayTarget] = useState<AffiliateCommission | null>(null);
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: listData, error: listError }, { data: commData, error: commError }] = await Promise.all([
      supabase.rpc("admin_list_affiliates"),
      supabase.rpc("admin_affiliate_commissions", { p_affiliate_id: affiliateId }),
    ]);
    if (listError || commError) {
      setNotice(listError?.message ?? commError?.message ?? "No se pudo cargar la afiliada.");
      setLoading(false);
      return;
    }
    const found = ((listData as AdminAffiliate[]) ?? []).find((a) => a.id === affiliateId) ?? null;
    setAffiliate(found);
    setCommissions((commData as AffiliateCommission[]) ?? []);
    if (found) {
      setRateInput(String(found.commission_rate));
      setStatusInput(found.status);
      setNotesInput(found.notes ?? "");
    }
    setLoading(false);
  }, [affiliateId, supabase]);

  useEffect(() => { void load(); }, [load]);

  const referralLink = affiliate && origin ? `${origin}/?aff=${affiliate.code}` : "";

  useEffect(() => {
    if (!referralLink) { setQrDataUrl(null); return; }
    QRCode.toDataURL(referralLink, { width: 320, margin: 1, color: { dark: "#1e1b4b", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [referralLink]);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(
      () => setNotice("Enlace copiado al portapapeles."),
      () => setNotice("No se pudo copiar el enlace."),
    );
  }

  function downloadQr() {
    if (!qrDataUrl || !affiliate) return;
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `qr-afiliada-${affiliate.code}.png`;
    anchor.click();
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!affiliate) return;
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setNotice("La comisión debe estar entre 0 y 100.");
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.rpc("admin_update_affiliate", {
      p_affiliate_id: affiliate.id,
      p_commission_rate: rate,
      p_status: statusInput,
      p_notes: notesInput || null,
    });
    if (error) setNotice(error.message);
    else {
      setNotice("Ficha de la afiliada actualizada.");
      await load();
    }
    setSavingProfile(false);
  }

  async function markPaid() {
    if (!payTarget) return;
    setPaying(true);
    const { error } = await supabase.rpc("admin_mark_commission_paid", {
      p_commission_id: payTarget.id,
      p_note: payNote || null,
    });
    if (error) setNotice(error.message);
    else {
      setNotice("Comisión marcada como pagada.");
      setPayTarget(null);
      setPayNote("");
      await load();
    }
    setPaying(false);
  }

  if (loading) {
    return <div className="p-10 text-center text-slate-500" role="status">Cargando ficha…</div>;
  }

  if (!affiliate) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="font-bold text-slate-700">No se encontró esta afiliada.</p>
        <button onClick={() => router.push("/admin/afiliados")} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">
          Volver a Afiliados
        </button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/afiliados" className="text-sm font-bold text-violet-600 hover:underline">← Afiliados</Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-950">{affiliate.name}</h1>
          <p className="mt-1 text-slate-500">{affiliate.email}{affiliate.phone ? ` · ${affiliate.phone}` : ""}</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${affiliate.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
          {affiliate.status === "active" ? "Activa" : "Inactiva"}
        </span>
      </div>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          <span>{notice}</span>
          <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">×</button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Ventas</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{affiliate.sales_count}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Total generado</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{money(affiliate.total_sales_usd)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Comisión pendiente</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">{money(affiliate.commission_pending_usd)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold text-slate-500">Comisión pagada</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">{money(affiliate.commission_paid_usd)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Enlace de referido</h2>
            <p className="mt-1 text-sm text-slate-500">Cualquier familia que se matricule o compre desde este enlace queda ligada a {affiliate.name} para siempre — incluidas renovaciones y nuevas materias.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 break-all">{referralLink || "…"}</code>
              <button onClick={copyLink} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Copiar</button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Editar comisión y estado</h2>
            <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Comisión %
                <input required type="number" min={0} max={100} step={0.5} value={rateInput} onChange={(e) => setRateInput(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Estado
                <select value={statusInput} onChange={(e) => setStatusInput(e.target.value as "active" | "inactive")} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                Notas
                <textarea maxLength={500} rows={2} value={notesInput} onChange={(e) => setNotesInput(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
              </label>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-400">Cambiar la comisión solo afecta a ventas nuevas — las comisiones ya generadas conservan la tasa con la que se calcularon.</p>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button disabled={savingProfile} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
                  {savingProfile ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            <div className="p-5 sm:p-6 sm:pb-0">
              <h2 className="font-display text-lg font-extrabold text-slate-900">Historial de comisiones</h2>
              <p className="mt-1 text-sm text-slate-500">Cada venta queda registrada con la comisión ya calculada en el momento del pago.</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Familia</th>
                    <th className="px-5 py-3">Origen</th>
                    <th className="px-5 py-3">Venta</th>
                    <th className="px-5 py-3">Comisión</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Todavía no hay ventas de esta afiliada.</td></tr>
                  )}
                  {commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(c.created_at)}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{c.household_name ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{SOURCE_LABEL[c.source_type] ?? c.source_type}</td>
                      <td className="px-5 py-3 text-slate-700">{money(c.sale_amount_usd)}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{money(c.commission_amount_usd)} <span className="font-normal text-slate-400">({Number(c.commission_rate)}%)</span></td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${c.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {c.status === "paid" ? "Pagada" : "Pendiente"}
                        </span>
                        {c.paid_note && <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400" title={c.paid_note}>{c.paid_note}</p>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {c.status === "pending" && (
                          <button onClick={() => { setPayTarget(c); setPayNote(""); }} className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 hover:bg-violet-100">
                            Marcar pagada
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-5" />
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Código QR</h2>
            <p className="mt-1 text-sm text-slate-500">Para compartir en redes o imprimir.</p>
            <div className="mt-4 flex justify-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`Código QR del enlace de referido de ${affiliate.name}`} className="h-56 w-56 rounded-xl ring-1 ring-slate-200" />
              ) : (
                <div className="grid h-56 w-56 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400 ring-1 ring-slate-200">Generando…</div>
              )}
            </div>
            <button onClick={downloadQr} disabled={!qrDataUrl} className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
              Descargar QR
            </button>
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200/70">
            <p className="font-bold text-slate-700">Código de acceso propio</p>
            <p className="mt-1">{affiliate.code}</p>
            <p className="mt-3">La afiliada entra a su panel en <span className="font-bold text-slate-700">/afiliados/login</span> con este código y el PIN que definiste al crearla.</p>
          </section>
        </aside>
      </div>

      {payTarget && (
        <div role="dialog" aria-modal="true" aria-labelledby="pay-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="pay-title" className="font-display text-xl font-extrabold">Marcar comisión como pagada</h2>
            <p className="mt-2 text-sm text-slate-500">{money(payTarget.commission_amount_usd)} · {SOURCE_LABEL[payTarget.source_type] ?? payTarget.source_type}. Esto solo registra el pago — Academia Mágica no transfiere dinero automáticamente.</p>
            <label className="mt-4 block text-sm font-bold text-slate-700">
              Nota <span className="font-normal text-slate-400">(opcional)</span>
              <textarea maxLength={300} rows={2} value={payNote} onChange={(e) => setPayNote(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" placeholder="Ej. Transferencia 17/08" />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button disabled={paying} onClick={() => setPayTarget(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button disabled={paying} onClick={markPaid} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">{paying ? "Guardando…" : "Confirmar pago"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

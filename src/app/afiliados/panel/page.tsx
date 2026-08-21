"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import type { AffiliateCommission, AffiliateProfile } from "@/types/database";

const SOURCE_LABEL: Record<string, string> = {
  enrollment: "Matrícula nueva",
  subject_order: "Materia / renovación",
};

function money(value: number) {
  return `$${Number(value).toFixed(2)}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AfiliadaPanelPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/afiliados/login");
        return;
      }
      const [{ data: p, error: pErr }, { data: c, error: cErr }] = await Promise.all([
        supabase.rpc("my_affiliate_profile").maybeSingle(),
        supabase.rpc("my_affiliate_commissions"),
      ]);
      if (pErr || !p) {
        await supabase.auth.signOut();
        router.push("/afiliados/login");
        return;
      }
      setProfile(p as AffiliateProfile);
      if (!cErr) setCommissions((c as AffiliateCommission[]) ?? []);
      setLoading(false);
    }
    void load();
  }, [router, supabase]);

  const referralLink = profile && origin ? `${origin}/?aff=${profile.code}` : "";

  useEffect(() => {
    if (!referralLink) { setQrDataUrl(null); return; }
    QRCode.toDataURL(referralLink, { width: 320, margin: 1, color: { dark: "#1e1b4b", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [referralLink]);

  const totals = useMemo(() => {
    return commissions.reduce(
      (acc, c) => {
        acc.total += Number(c.commission_amount_usd);
        if (c.status === "paid") acc.paid += Number(c.commission_amount_usd);
        else acc.pending += Number(c.commission_amount_usd);
        return acc;
      },
      { total: 0, pending: 0, paid: 0 },
    );
  }, [commissions]);

  const monthly = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return { key: monthKey(d), label: d.toLocaleDateString("es", { month: "short" }), total: 0, count: 0 };
    });
    for (const c of commissions) {
      const key = monthKey(new Date(c.created_at));
      const bucket = months.find((m) => m.key === key);
      if (bucket) {
        bucket.total += Number(c.commission_amount_usd);
        bucket.count += 1;
      }
    }
    const max = Math.max(1, ...months.map((m) => m.total));
    const current = months[months.length - 1];
    const previous = months[months.length - 2];
    const deltaPct = previous.total > 0
      ? Math.round(((current.total - previous.total) / previous.total) * 100)
      : current.total > 0 ? 100 : 0;
    return { months, max, current, previous, deltaPct };
  }, [commissions]);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(
      () => setNotice("Enlace copiado. ¡Compártelo donde quieras!"),
      () => setNotice("No se pudo copiar el enlace."),
    );
  }

  function shareWhatsApp() {
    if (!referralLink) return;
    const message = `¡Hola! 🪄✨ Te quiero recomendar Academia Mágica, la plataforma donde mi hijo/a estudia jugando y le encanta. Entra aquí: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function downloadQr() {
    if (!qrDataUrl || !profile) return;
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `qr-academia-magica-${profile.code}.png`;
    anchor.click();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/afiliados/login");
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1e1b4b]">
        <p className="text-white" role="status">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f3effe] to-[#faf8ff] pb-16">
      <header className="bg-[#1e1b4b] px-4 py-6 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-300">🪄 Panel de afiliada</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold">¡Hola, {profile.name}!</h1>
            <p className="mt-0.5 text-sm text-violet-200/80">Cada familia que se une por tu enlace queda contigo para siempre.</p>
          </div>
          <button onClick={signOut} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {profile.status === "inactive" && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Tu cuenta está pausada por Academia Mágica. Tus ventas anteriores siguen registradas, pero contacta al equipo para reactivarla.
          </div>
        )}

        {notice && (
          <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <span>{notice}</span>
            <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-base">🪄</div>
            <p className="mt-2.5 text-xs font-bold text-[#3b2a55]/60">Tu comisión</p>
            <p className="mt-0.5 text-2xl font-extrabold text-[#1e1b4b]">{Number(profile.commission_rate)}%</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-base">🛍️</div>
            <p className="mt-2.5 text-xs font-bold text-[#3b2a55]/60">Ventas totales</p>
            <p className="mt-0.5 text-2xl font-extrabold text-[#1e1b4b]">{commissions.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-base">⏳</div>
            <p className="mt-2.5 text-xs font-bold text-[#3b2a55]/60">Pendiente de cobro</p>
            <p className="mt-0.5 text-2xl font-extrabold text-amber-700">{money(totals.pending)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-base">✅</div>
            <p className="mt-2.5 text-xs font-bold text-[#3b2a55]/60">Ya cobrado</p>
            <p className="mt-0.5 text-2xl font-extrabold text-emerald-700">{money(totals.paid)}</p>
          </div>
        </div>

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">📈 Resumen mensual</h2>
            {commissions.length > 0 && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                  monthly.deltaPct >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}
              >
                {monthly.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(monthly.deltaPct)}% vs. mes anterior
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#3b2a55]/60">Comisión generada por mes, últimos 6 meses.</p>
          <div className="mt-5 flex items-end justify-between gap-2 sm:gap-4">
            {monthly.months.map((m, idx) => {
              const isCurrent = idx === monthly.months.length - 1;
              const heightPct = Math.max(6, Math.round((m.total / monthly.max) * 100));
              return (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-[#3b2a55]/70">{m.total > 0 ? money(m.total) : ""}</span>
                  <div className="flex h-28 w-full items-end rounded-lg bg-violet-50">
                    <div
                      className={`w-full rounded-lg transition-all ${isCurrent ? "bg-violet-600" : "bg-violet-300"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-extrabold capitalize ${isCurrent ? "text-[#1e1b4b]" : "text-[#3b2a55]/50"}`}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">Historial de ventas y comisiones</h2>
            <p className="mt-1 text-sm text-[#3b2a55]/60">
              Todas las familias que se matriculan o compran desde tu enlace quedan asociadas a ti para siempre, incluidas sus renovaciones.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-violet-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-violet-400">
                    <th className="py-3 pr-4">Fecha</th>
                    <th className="py-3 pr-4">Origen</th>
                    <th className="py-3 pr-4">Venta</th>
                    <th className="py-3 pr-4">Tu comisión</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {commissions.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-[#3b2a55]/40">Todavía no tienes ventas. ¡Comparte tu enlace!</td></tr>
                  )}
                  {commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 text-[#3b2a55]/60">{formatDateTime(c.created_at)}</td>
                      <td className="py-3 pr-4 text-[#3b2a55]/80">{SOURCE_LABEL[c.source_type] ?? c.source_type}</td>
                      <td className="py-3 pr-4 text-[#3b2a55]/90">{money(c.sale_amount_usd)}</td>
                      <td className="py-3 pr-4 font-bold text-[#1e1b4b]">{money(c.commission_amount_usd)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${c.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {c.status === "paid" ? "Cobrada" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
              <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">Tu enlace</h2>
              <p className="mt-1 text-sm text-[#3b2a55]/60">Compártelo por WhatsApp, redes o donde prefieras.</p>
              <code className="mt-3 block break-all rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5 text-xs text-[#3b2a55]/80">{referralLink || "…"}</code>
              <button
                onClick={shareWhatsApp}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-105"
              >
                💬 Compartir por WhatsApp
              </button>
              <button onClick={copyLink} className="mt-2 w-full rounded-xl border-2 border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1e1b4b] transition hover:bg-violet-50">
                Copiar enlace
              </button>
            </section>

            <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-violet-100">
              <h2 className="font-display text-lg font-extrabold text-[#1e1b4b]">Tu código QR</h2>
              <div className="mt-3 flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Tu código QR de referido" className="h-48 w-48 rounded-xl ring-1 ring-violet-100" />
                ) : (
                  <div className="grid h-48 w-48 place-items-center rounded-xl bg-violet-50 text-xs text-[#3b2a55]/40 ring-1 ring-violet-100">Generando…</div>
                )}
              </div>
              <button onClick={downloadQr} disabled={!qrDataUrl} className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
                Descargar QR
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

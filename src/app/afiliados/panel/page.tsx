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

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(
      () => setNotice("Enlace copiado. ¡Compartilo donde quieras!"),
      () => setNotice("No se pudo copiar el enlace."),
    );
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
    <main className="min-h-screen bg-[#f6f3ff] pb-16">
      <header className="bg-[#1e1b4b] px-4 py-6 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-300">Panel de afiliada</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold">¡Hola, {profile.name}!</h1>
          </div>
          <button onClick={signOut} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {profile.status === "inactive" && (
          <div role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            Tu cuenta está pausada por Academia Mágica. Tus ventas anteriores siguen registradas, pero contactá al equipo para reactivarla.
          </div>
        )}

        {notice && (
          <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <span>{notice}</span>
            <button aria-label="Cerrar aviso" onClick={() => setNotice(null)} className="font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold text-slate-500">Tu comisión</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{Number(profile.commission_rate)}%</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold text-slate-500">Ventas totales</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{commissions.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold text-slate-500">Pendiente de cobro</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-700">{money(totals.pending)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold text-slate-500">Ya cobrado</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">{money(totals.paid)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-slate-900">Historial de ventas y comisiones</h2>
            <p className="mt-1 text-sm text-slate-500">
              Todas las familias que se matriculan o compran desde tu enlace quedan asociadas a vos para siempre, incluidas sus renovaciones.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    <th className="py-3 pr-4">Fecha</th>
                    <th className="py-3 pr-4">Origen</th>
                    <th className="py-3 pr-4">Venta</th>
                    <th className="py-3 pr-4">Tu comisión</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">Todavía no tenés ventas. ¡Compartí tu enlace!</td></tr>
                  )}
                  {commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 text-slate-500">{formatDateTime(c.created_at)}</td>
                      <td className="py-3 pr-4 text-slate-600">{SOURCE_LABEL[c.source_type] ?? c.source_type}</td>
                      <td className="py-3 pr-4 text-slate-700">{money(c.sale_amount_usd)}</td>
                      <td className="py-3 pr-4 font-bold text-slate-900">{money(c.commission_amount_usd)}</td>
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
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <h2 className="font-display text-lg font-extrabold text-slate-900">Tu enlace</h2>
              <p className="mt-1 text-sm text-slate-500">Compartilo por WhatsApp, redes o donde prefieras.</p>
              <code className="mt-3 block break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">{referralLink || "…"}</code>
              <button onClick={copyLink} className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">
                Copiar enlace
              </button>
            </section>

            <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200/70">
              <h2 className="font-display text-lg font-extrabold text-slate-900">Tu código QR</h2>
              <div className="mt-3 flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Tu código QR de referido" className="h-48 w-48 rounded-xl ring-1 ring-slate-200" />
                ) : (
                  <div className="grid h-48 w-48 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400 ring-1 ring-slate-200">Generando…</div>
                )}
              </div>
              <button onClick={downloadQr} disabled={!qrDataUrl} className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
                Descargar QR
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import PayPalCheckout from "@/components/paypal-checkout";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pago de matrícula", robots: { index: false, follow: false } };

type Summary = {
  public_reference: string;
  subject_count: number;
  total_price_usd: number | string;
  currency: string;
  access_months: number;
  payment_status: string;
  subject_names: string[];
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; pt?: string; cancelled?: string }>;
}) {
  const { ref = "", pt = "", cancelled } = await searchParams;
  const valid = /^AM-[A-Z0-9]{8}$/.test(ref) && /^[0-9a-f-]{36}$/i.test(pt);
  let summary: Summary | null = null;
  if (valid) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_enrollment_payment_summary", {
      p_public_reference: ref,
      p_payment_token: pt,
    });
    summary = (data?.[0] ?? null) as Summary | null;
  }

  if (!summary) {
    return <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-4 py-12 text-[#3b2a55]"><section className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"><p className="text-5xl">🪄</p><h1 className="font-display mt-5 text-3xl font-extrabold">Enlace de pago no válido</h1><p className="mt-4 text-[#3b2a55]/65">Vuelve al formulario para iniciar una matrícula nueva.</p><Link href="/matricula" className="mt-7 inline-flex rounded-2xl bg-[#ffd93d] px-6 py-3 font-extrabold">Volver a matrícula</Link></section></main>;
  }

  const total = Number(summary.total_price_usd).toFixed(2);
  return <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-4 py-12 text-[#3b2a55]"><section className="w-full max-w-2xl rounded-[2.5rem] bg-white p-7 text-center shadow-2xl sm:p-10"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#7fe7c4]/30 text-4xl">✓</div><p className="mt-6 text-sm font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Solicitud registrada</p><h1 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">Completa el pago de tu matrícula</h1><p className="mt-4">Referencia <strong className="rounded-lg bg-[#f2e9ff] px-2 py-1 text-[#6c5ce7]">{summary.public_reference}</strong></p>
  {cancelled === "1" && <p role="status" className="mt-5 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900">El pago se canceló en PayPal y no se realizó ningún cargo. Puedes intentarlo de nuevo.</p>}
  <div className="mt-7 rounded-3xl bg-[#f2e9ff]/60 p-5 text-left"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#3b2a55]/60">{summary.subject_count} materias · {summary.access_months} meses</p><p className="mt-1 text-sm">{summary.subject_names.join(", ")}</p></div><p className="shrink-0 text-3xl font-black text-[#6c5ce7]">{total} {summary.currency}</p></div></div>
  <div className="mt-7 rounded-3xl border-2 border-[#0070ba]/20 bg-[#f6fbff] p-6"><div className="text-3xl font-black italic text-[#003087]">Pay<span className="text-[#0070ba]">Pal</span></div><p className="mt-3 font-bold">Pago protegido en PayPal Sandbox</p><PayPalCheckout reference={summary.public_reference} paymentToken={pt} total={total} currency={summary.currency} paid={summary.payment_status === "paid"} /></div>
  <Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 font-extrabold text-[#6c5ce7] hover:bg-[#6c5ce7]/10">Volver a la página principal</Link></section></main>;
}

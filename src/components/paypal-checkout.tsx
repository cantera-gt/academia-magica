"use client";

import { useState } from "react";

export default function PayPalCheckout({
  reference,
  paymentToken,
  total,
  currency,
  paid,
}: {
  reference: string;
  paymentToken: string;
  total: string;
  currency: string;
  paid: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPayment() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, paymentToken }),
      });
      const data = await response.json() as { approvalUrl?: string; error?: string };
      if (!response.ok || !data.approvalUrl) throw new Error(data.error ?? "No se pudo iniciar el pago");
      window.location.assign(data.approvalUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar el pago");
      setLoading(false);
    }
  }

  if (paid) {
    return <div className="rounded-2xl bg-emerald-50 p-5 font-extrabold text-emerald-800">✓ Este pago ya está confirmado.</div>;
  }

  return <>
    <button
      type="button"
      onClick={startPayment}
      disabled={loading}
      className="mt-5 min-h-14 w-full rounded-full bg-[#ffc439] px-5 py-3 text-lg font-extrabold text-[#142c8e] shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-wait disabled:opacity-65"
    >
      {loading ? "Conectando con PayPal…" : `Pagar ${total} ${currency} con PayPal`}
    </button>
    <p className="mt-3 text-sm text-[#3b2a55]/60">Serás enviado al entorno seguro Sandbox de PayPal. No se utilizará dinero real durante las pruebas.</p>
    {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}
  </>;
}

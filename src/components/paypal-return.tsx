"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PayPalReturn({
  reference,
  paymentToken,
  orderId,
}: {
  reference: string;
  paymentToken: string;
  orderId: string;
}) {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Estamos confirmando tu pago con PayPal…");

  useEffect(() => {
    let active = true;
    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, paymentToken, orderId }),
    })
      .then(async (response) => {
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "No se pudo confirmar el pago");
        if (active) {
          setState("success");
          setMessage("Pago confirmado correctamente");
        }
      })
      .catch((cause) => {
        if (active) {
          setState("error");
          setMessage(cause instanceof Error ? cause.message : "No se pudo confirmar el pago");
        }
      });
    return () => { active = false; };
  }, [orderId, paymentToken, reference]);

  const claimUrl = `/bienvenida?ref=${encodeURIComponent(reference)}&pt=${encodeURIComponent(paymentToken)}`;

  return <section className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-10">
    <div className={`mx-auto flex size-20 items-center justify-center rounded-full text-4xl ${state === "success" ? "bg-emerald-100" : state === "error" ? "bg-red-100" : "animate-pulse bg-[#f2e9ff]"}`}>{state === "success" ? "✓" : state === "error" ? "!" : "💫"}</div>
    <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Referencia {reference}</p>
    <h1 className="font-display mt-2 text-3xl font-extrabold">{message}</h1>
    {state === "loading" && <p className="mt-4 text-[#3b2a55]/65">No cierres esta ventana todavía.</p>}
    {state === "success" && <>
      <p className="mt-4 text-[#3b2a55]/65">Tu matrícula ya figura como pagada y el acceso está listo. Te enviamos un correo con los detalles, pero puedes continuar ahora mismo:</p>
      <Link href={claimUrl} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#6c5ce7] px-7 py-3.5 font-extrabold text-white shadow-lg transition hover:brightness-105 sm:w-auto">Crear el usuario de mi hijo/a →</Link>
      <p className="mt-4"><Link href="/" className="font-bold text-[#6c5ce7] hover:underline">Volver a Academia Mágica</Link></p>
    </>}
    {state === "error" && <><p className="mt-4 text-[#3b2a55]/65">No vuelvas a pagar. Conserva la referencia y contacta con nosotros para revisar la operación.</p><a href="mailto:businesscatserrano@gmail.com" className="mt-7 inline-flex rounded-2xl bg-[#6c5ce7] px-7 py-3 font-extrabold text-white">Contactar</a></>}
  </section>;
}

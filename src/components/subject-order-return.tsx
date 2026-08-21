"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubjectOrderReturn({
  orderId,
  paypalOrderId,
}: {
  orderId: string;
  paypalOrderId: string;
}) {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Estamos confirmando tu pago con PayPal…");

  useEffect(() => {
    let active = true;
    fetch("/api/paypal/subjects/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paypalOrderId }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error ?? "No se pudo confirmar el pago");
        if (active) {
          setState("success");
          setMessage("¡Pago confirmado! Ya tienes acceso a las nuevas materias.");
        }
      })
      .catch((cause) => {
        if (active) {
          setState("error");
          setMessage(cause instanceof Error ? cause.message : "No se pudo confirmar el pago");
        }
      });
    return () => {
      active = false;
    };
  }, [orderId, paypalOrderId]);

  return (
    <section className="w-full max-w-xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl sm:p-10">
      <div
        className={`mx-auto flex size-20 items-center justify-center rounded-full text-4xl ${
          state === "success"
            ? "bg-emerald-100"
            : state === "error"
              ? "bg-red-100"
              : "animate-pulse bg-[#f2e9ff]"
        }`}
      >
        {state === "success" ? "✓" : state === "error" ? "!" : "💫"}
      </div>
      <h1 className="font-display mt-6 text-3xl font-extrabold text-[#3b2a55]">{message}</h1>
      {state === "loading" && (
        <p className="mt-4 text-[#3b2a55]/65">No cierres esta ventana todavía.</p>
      )}
      {state === "success" && (
        <Link
          href="/alumno/panel-padres"
          className="mt-7 inline-flex rounded-2xl bg-[#ffd93d] px-7 py-3 font-extrabold text-[#3b2a55]"
        >
          Volver al Panel para padres
        </Link>
      )}
      {state === "error" && (
        <>
          <p className="mt-4 text-[#3b2a55]/65">
            No vuelvas a pagar. Guarda el número de orden y contacta con nosotros para revisar la
            operación.
          </p>
          <p className="mt-2 text-xs text-[#3b2a55]/50">Orden: {orderId}</p>
          <a
            href="mailto:businesscatserrano@gmail.com"
            className="mt-7 inline-flex rounded-2xl bg-[#6c5ce7] px-7 py-3 font-extrabold text-white"
          >
            Contactar
          </a>
        </>
      )}
    </section>
  );
}

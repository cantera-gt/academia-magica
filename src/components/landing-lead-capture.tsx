"use client";

import { FormEvent, useState } from "react";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LandingLeadCapture() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("website") || Date.now() - startedAt < 1200) {
      setStatus("error");
      setError("No hemos podido validar el formulario. Inténtalo de nuevo.");
      return;
    }
    const email = String(form.get("email") ?? "");
    setStatus("submitting");
    const { error: rpcError } = await supabase.rpc("submit_landing_lead", {
      p_email: email,
      p_source: "landing_lead_capture",
    });
    if (rpcError) {
      setStatus("error");
      setError(rpcError.message || "No hemos podido guardar tu email. Inténtalo de nuevo.");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-3xl" aria-hidden="true">✅</p>
        <p className="font-display mt-2 text-lg font-extrabold">¡Listo, ya quedaste anotado/a!</p>
        <p className="mt-1 text-[#3b2a55]/65">Te vamos a escribir con novedades y materias nuevas. Cuando quieras, puedes matricularte cuando estés listo/a.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#3b2a55]/10 bg-white p-6 shadow-sm sm:p-8">
      <p className="font-display text-lg font-extrabold">¿Todavía no estás seguro/a?</p>
      <p className="mt-1 text-[#3b2a55]/65">Déjanos tu email y te avisamos cuando sumemos materias nuevas, sin compromiso.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="landing-lead-email">Tu email</label>
        <input
          id="landing-lead-email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="min-h-12 w-full rounded-2xl border border-[#3b2a55]/20 bg-white px-4 py-3 shadow-sm outline-none focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/15"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#6c5ce7] px-6 py-3 font-extrabold text-[#6c5ce7] transition hover:bg-[#6c5ce7] hover:text-white disabled:opacity-60"
        >
          {status === "submitting" ? "Enviando…" : "Avísame"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-[#c0392b]">{error}</p>}
    </div>
  );
}

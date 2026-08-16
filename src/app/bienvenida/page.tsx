"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ClaimableEnrollment {
  application_id: string;
  public_reference: string;
  student_first_name: string | null;
  student_last_name: string | null;
  contact_full_name: string | null;
  contact_email: string | null;
  suggested_username: string;
  total_price_usd: number;
  currency: string;
  access_months: number;
  subject_names: string[];
}

function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

export default function BienvenidaPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-5 py-16 text-[#3b2a55]">
          <p className="font-bold text-[#3b2a55]/60">Cargando…</p>
        </main>
      }
    >
      <BienvenidaContent />
    </Suspense>
  );
}

function BienvenidaContent() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const token = searchParams.get("pt") ?? "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClaimableEnrollment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ username: string } | null>(null);

  useEffect(() => {
    if (!ref || !token) {
      setLoadError("Este enlace está incompleto. Revisá el correo de confirmación de compra y volvé a intentarlo.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: rows, error } = await supabase.rpc("get_claimable_enrollment", {
        p_ref: ref,
        p_token: token,
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (error || !row) {
        setLoadError("Este enlace no es válido, ya fue usado, o el pago todavía no está confirmado.");
      } else {
        setData(row as ClaimableEnrollment);
        const fullName = [row.student_first_name, row.student_last_name].filter(Boolean).join(" ");
        setDisplayName(fullName || "");
        setUsername(row.suggested_username ?? "");
      }
      setLoading(false);
    })();
  }, [ref, token, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      setSubmitError("Elegí un nombre de usuario válido (solo letras, números y guion bajo).");
      return;
    }
    if (!displayName.trim()) {
      setSubmitError("Escribí el nombre del alumno o alumna.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setSubmitError("El PIN debe tener exactamente 6 dígitos.");
      return;
    }
    if (pin !== pinConfirm) {
      setSubmitError("Los dos PIN no coinciden.");
      return;
    }

    setSubmitting(true);
    const { data: result, error } = await supabase.functions.invoke("claim-enrollment", {
      body: {
        publicReference: ref,
        paymentToken: token,
        username: cleanUsername,
        displayName: displayName.trim(),
        pin,
      },
    });
    setSubmitting(false);

    if (error || result?.error) {
      setSubmitError(result?.error ?? error?.message ?? "No se pudo crear el usuario. Probá de nuevo.");
      return;
    }

    setSuccess({ username: result.username });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf3] px-5 py-16 text-[#3b2a55]">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-extrabold">
            <span aria-hidden="true">✨</span> Academia Mágica
          </Link>
        </div>

        {loading && (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-xl">
            <p className="font-bold text-[#3b2a55]/60">Comprobando tu enlace…</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl sm:p-10">
            <p className="text-4xl">⚠️</p>
            <h1 className="font-display mt-4 text-2xl font-extrabold">No pudimos abrir este enlace</h1>
            <p className="mt-3 text-[#3b2a55]/70">{loadError}</p>
            <p className="mt-6 text-sm text-[#3b2a55]/60">
              Si ya creaste el usuario antes, iniciá sesión directamente en{" "}
              <Link href="/alumno" className="font-bold text-[#6c5ce7] hover:underline">Acceso alumnos</Link>.
              Si el problema persiste, escribinos a{" "}
              <a href="mailto:businesscatserrano@gmail.com" className="font-bold text-[#6c5ce7] hover:underline">businesscatserrano@gmail.com</a>.
            </p>
          </div>
        )}

        {!loading && !loadError && success && (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl sm:p-10">
            <p className="text-5xl">🎉</p>
            <h1 className="font-display mt-4 text-2xl font-extrabold">¡Listo! El usuario ya está creado</h1>
            <p className="mt-3 text-[#3b2a55]/70">
              Guardá estos datos: van a ser necesarios para entrar cada vez.
            </p>
            <div className="mt-6 rounded-2xl bg-[#f2e9ff] p-5 text-left">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#6c5ce7]">Usuario</p>
              <p className="font-display text-xl font-extrabold">{success.username}</p>
              <p className="mt-3 text-xs font-extrabold uppercase tracking-wide text-[#6c5ce7]">PIN</p>
              <p className="font-display text-xl font-extrabold">El que elegiste recién</p>
            </div>
            <Link
              href="/alumno"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#6c5ce7] px-7 py-3.5 font-extrabold text-white shadow-lg transition hover:brightness-105"
            >
              Ir a Acceso alumnos →
            </Link>
          </div>
        )}

        {!loading && !loadError && !success && data && (
          <div className="rounded-[2rem] bg-white p-8 shadow-xl sm:p-10">
            <h1 className="font-display text-2xl font-extrabold">¡Pago confirmado! 🎉</h1>
            <p className="mt-2 text-[#3b2a55]/70">
              Creá el usuario con el que {data.student_first_name || "tu hijo/a"} va a entrar a Academia Mágica.
            </p>
            <div className="mt-5 rounded-2xl bg-[#fff7e6] p-4 text-sm">
              <p><strong>Materias:</strong> {data.subject_names.join(", ") || "—"}</p>
              <p className="mt-1"><strong>Acceso:</strong> {data.access_months} meses · {Number(data.total_price_usd).toFixed(2)} {data.currency}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="displayName" className="block text-sm font-extrabold">Nombre del alumno/a</label>
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-3 font-semibold focus:border-[#6c5ce7] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-extrabold">Nombre de usuario</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                  required
                  className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-3 font-mono font-semibold focus:border-[#6c5ce7] focus:outline-none"
                />
                <p className="mt-1 text-xs text-[#3b2a55]/50">Solo letras, números y guion bajo. Se usará para iniciar sesión.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pin" className="block text-sm font-extrabold">PIN (6 dígitos)</label>
                  <input
                    id="pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-3 font-mono font-semibold tracking-widest focus:border-[#6c5ce7] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pinConfirm" className="block text-sm font-extrabold">Repetir PIN</label>
                  <input
                    id="pinConfirm"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-3 font-mono font-semibold tracking-widest focus:border-[#6c5ce7] focus:outline-none"
                  />
                </div>
              </div>

              {submitError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#6c5ce7] px-7 py-3.5 font-extrabold text-white shadow-lg transition hover:brightness-105 disabled:opacity-60"
              >
                {submitting ? "Creando…" : "Crear usuario"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

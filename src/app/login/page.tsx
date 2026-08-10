"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => {
      setNeedsSetup(data === false);
      setLoading(false);
    });
  }, [supabase]);

  async function ensureAdminProfile(name: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      const fallbackName =
        (user.user_metadata as { display_name?: string } | null)
          ?.display_name ?? "Admin";
      await supabase.rpc("bootstrap_first_admin", {
        p_display_name: name || fallbackName,
      });
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword(
          { email, password }
        );
        if (signInError) {
          setError(
            "Ese email ya está registrado. Si es tuyo, iniciá sesión; si todavía no confirmaste el email, revisá tu correo."
          );
          setSubmitting(false);
          return;
        }
        await ensureAdminProfile(displayName);
        router.push("/admin");
        return;
      }
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      await ensureAdminProfile(displayName);
      router.push("/admin");
      return;
    }

    setAwaitingConfirmation(true);
    setInfo(
      "Te enviamos un email para confirmar tu cuenta. Abrilo, confirmá, y después tocá el botón de abajo."
    );
    setSubmitting(false);
  }

  async function handleConfirmedLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Todavía no confirmaste tu email, o los datos son incorrectos.");
      setSubmitting(false);
      return;
    }

    await ensureAdminProfile(displayName);
    router.push("/admin");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos");
      setSubmitting(false);
      return;
    }

    await ensureAdminProfile(displayName);
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-white">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Volver
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-white">
          {awaitingConfirmation
            ? "Confirmá tu email"
            : needsSetup
            ? "Crear cuenta de administrador"
            : "Ingreso administrador"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {awaitingConfirmation
            ? "Te faltaba este último paso."
            : needsSetup
            ? "Academia Mágica todavía no tiene un administrador. Creá tu cuenta."
            : "Panel de gestión de Academia Mágica"}
        </p>

        {info && (
          <p className="mt-4 rounded-lg bg-purple-900/50 p-3 text-sm text-purple-200">
            {info}
          </p>
        )}

        {awaitingConfirmation ? (
          <form
            onSubmit={handleConfirmedLogin}
            className="mt-6 flex flex-col gap-4"
          >
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? "Un momento..." : "Ya confirmé mi email, ingresar"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={needsSetup ? handleSetup : handleLogin}
            className="mt-6 flex flex-col gap-4"
          >
            {needsSetup && (
              <div>
                <label className="text-sm text-slate-300">Tu nombre</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                  placeholder="Pablo"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-300">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Contraseña</label>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting
                ? "Un momento..."
                : needsSetup
                ? "Crear cuenta"
                : "Ingresar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

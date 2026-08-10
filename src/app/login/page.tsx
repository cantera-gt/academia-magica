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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => {
      setNeedsSetup(data === false);
      setLoading(false);
    });
  }, [supabase]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    const { error: bootstrapError } = await supabase.rpc(
      "bootstrap_first_admin",
      { p_display_name: displayName }
    );

    if (bootstrapError) {
      setError(bootstrapError.message);
      setSubmitting(false);
      return;
    }

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
          {needsSetup ? "Crear cuenta de administrador" : "Ingreso administrador"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {needsSetup
            ? "Academia Mágica todavía no tiene un administrador. Creá tu cuenta."
            : "Panel de gestión de Academia Mágica"}
        </p>

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
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AfiliadaLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanCode || pin.length !== 6) return;
    setLoading(true);

    const email = `${cleanCode}@afiliados.academia-magica.app`;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pin });

    if (signInError) {
      setError("Código o PIN incorrectos. Revisá con Academia Mágica si no los recordás.");
      setLoading(false);
      setPin("");
      return;
    }

    const { data: myProfile, error: profileError } = await supabase.rpc("my_affiliate_profile").maybeSingle();
    if (profileError || !myProfile) {
      await supabase.auth.signOut();
      setError("Esta cuenta no tiene un perfil de afiliada activo.");
      setLoading(false);
      setPin("");
      return;
    }

    router.push("/afiliados/panel");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1e1b4b] p-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-7 shadow-2xl">
        <Link href="/" className="text-xs font-bold text-[#3b2a55]/50 hover:text-[#6c5ce7]">← Volver al inicio</Link>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Panel de afiliadas</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-[#1e1b4b]">Academia Mágica</h1>
        <p className="mt-1 text-sm text-[#3b2a55]/60">Entrá con tu código y PIN para ver tus ventas y comisiones.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-bold text-[#3b2a55]/70">
            Código de afiliada
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="username"
              placeholder="maria-lopez"
              className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-2.5 font-semibold outline-none focus:border-[#6c5ce7]"
            />
          </label>
          <label className="text-sm font-bold text-[#3b2a55]/70">
            PIN
            <input
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="mt-1.5 w-full rounded-xl border-2 border-[#3b2a55]/15 px-4 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-[#6c5ce7]"
            />
          </label>

          {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="mt-1 rounded-xl bg-[#6c5ce7] px-4 py-3 font-extrabold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

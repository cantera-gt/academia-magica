"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FoundStudent {
  username: string;
  display_name: string;
  thumbnail_url: string | null;
}

export default function StudentQuickLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"username" | "pin">("username");
  const [usernameInput, setUsernameInput] = useState("");
  const [found, setFound] = useState<FoundStudent | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = usernameInput.trim().toLowerCase();
    if (!clean) return;
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_student_login_avatar", { p_username: clean });
    setLoading(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (rpcError || !row) {
      setError("No encontramos ese usuario. Revisa cómo lo escribiste.");
      return;
    }
    setFound(row as FoundStudent);
    setStep("pin");
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!found) return;
    setError(null);
    setLoading(true);

    const email = `${found.username}@alumnos.academia-magica.app`;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pin });

    if (signInError) {
      setError("PIN incorrecto, prueba de nuevo.");
      setLoading(false);
      setPin("");
      return;
    }

    const { data: isActive } = await supabase.rpc("my_is_active");
    if (isActive === false) {
      await supabase.auth.signOut();
      setError("Esta cuenta está desactivada. Contacta con el administrador de tu familia.");
      setLoading(false);
      setPin("");
      return;
    }

    router.push("/alumno/inicio");
  }

  return (
    <div id="acceso-alumnos" className="scroll-mt-24 rounded-[2rem] bg-white p-6 shadow-xl sm:p-7">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6c5ce7]">Acceso alumnos</p>

      {step === "username" && (
        <form onSubmit={handleUsernameSubmit} className="mt-3">
          <label htmlFor="quick-username" className="block text-sm font-bold text-[#3b2a55]/70">
            Escribe tu nombre de usuario para entrar
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="quick-username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="tu-usuario"
              autoComplete="username"
              className="min-w-0 flex-1 rounded-xl border-2 border-[#3b2a55]/15 px-4 py-2.5 font-semibold focus:border-[#6c5ce7] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl bg-[#6c5ce7] px-5 py-2.5 font-extrabold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "…" : "Entrar"}
            </button>
          </div>
        </form>
      )}

      {step === "pin" && found && (
        <form onSubmit={handlePinSubmit} className="mt-3">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2e9ff]">
              {found.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={found.thumbnail_url} alt={found.display_name} className="h-full w-full object-cover object-top" />
              ) : (
                <span className="text-2xl">⭐</span>
              )}
            </span>
            <p className="font-display font-extrabold">¡Hola, {found.display_name}!</p>
          </div>
          <label htmlFor="quick-pin" className="mt-4 block text-sm font-bold text-[#3b2a55]/70">Tu PIN secreto</label>
          <div className="mt-2 flex gap-2">
            <input
              id="quick-pin"
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="min-w-0 flex-1 rounded-xl border-2 border-[#3b2a55]/15 px-4 py-2.5 text-center font-mono text-lg tracking-widest focus:border-[#6c5ce7] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="shrink-0 rounded-xl bg-[#6c5ce7] px-5 py-2.5 font-extrabold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "…" : "Entrar"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setStep("username"); setFound(null); setPin(""); setError(null); }}
            className="mt-2 text-xs font-bold text-[#3b2a55]/50 hover:text-[#6c5ce7]"
          >
            No soy yo
          </button>
        </form>
      )}

      {error && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{error}</p>}

      <p className="mt-4 text-xs text-[#3b2a55]/50">
        ¿Todavía no tienes cuenta? <Link href="/matricula" className="font-bold text-[#6c5ce7] hover:underline">Matricúlate aquí</Link>.{" "}
        <Link href="/login" className="font-bold text-[#6c5ce7] hover:underline">Acceso administrador</Link>.
      </p>
    </div>
  );
}

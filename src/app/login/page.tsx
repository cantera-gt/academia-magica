"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { fadeSlideUp, fadeOnly, SPRING_UI } from "@/lib/motion";

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
            "Ese email ya está registrado. Si es tuyo, inicia sesión; si todavía no confirmaste el email, revisa tu correo."
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
      "Te enviamos un email para confirmar tu cuenta. Ábrelo, confirma, y después toca el botón de abajo."
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

  const stateKey = awaitingConfirmation ? "awaiting" : needsSetup ? "setup" : "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <motion.div
        layout
        transition={{ layout: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-slate-800 p-8 shadow-2xl"
      >
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Volver
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={stateKey}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeSlideUp}
          >
            <h1 className="mt-4 text-2xl font-bold text-white">
              {awaitingConfirmation
                ? "Confirma tu email"
                : needsSetup
                ? "Crear cuenta de administrador"
                : "Ingreso administrador"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {awaitingConfirmation
                ? "Te faltaba este último paso."
                : needsSetup
                ? "Academia Mágica todavía no tiene un administrador. Crea tu cuenta."
                : "Panel de gestión de Academia Mágica"}
            </p>

            <AnimatePresence>
              {info && (
                <motion.p
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeOnly}
                  className="mt-4 rounded-lg bg-purple-900/50 p-3 text-sm text-purple-200"
                >
                  {info}
                </motion.p>
              )}
            </AnimatePresence>

            {awaitingConfirmation ? (
              <form
                onSubmit={handleConfirmedLogin}
                className="mt-6 flex flex-col gap-4"
              >
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={fadeOnly}
                      className="text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  transition={SPRING_UI}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? "Un momento..." : "Ya confirmé mi email, ingresar"}
                </motion.button>
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

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={fadeOnly}
                      className="text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  transition={SPRING_UI}
                  className="mt-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Un momento..."
                    : needsSetup
                    ? "Crear cuenta"
                    : "Ingresar"}
                </motion.button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

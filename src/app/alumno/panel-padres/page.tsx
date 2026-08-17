"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { MyProfile, ParentStats, Subject } from "@/types/database";
import { staggerContainer, staggerItem, fadeSlideUp, SPRING_PLAYFUL } from "@/lib/motion";
import { getEnrollmentPricing } from "@/lib/enrollment-pricing";
import SubjectInfoBadge from "@/components/subject-info-badge";

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0 && m === 0) return `${s} seg`;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es", { weekday: "short" }).replace(".", "");
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return "Sin vencimiento";
  return new Date(dateStr).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
}

const SUBSCRIPTION_BADGE: Record<string, { label: string; className: string }> = {
  activa: { label: "Activa", className: "bg-emerald-100 text-emerald-700" },
  por_vencer: { label: "Por vencer", className: "bg-amber-100 text-amber-800" },
  vencida: { label: "Vencida", className: "bg-red-100 text-red-700" },
  sin_vencimiento: { label: "Sin vencimiento", className: "bg-slate-100 text-slate-600" },
};

export default function PanelPadresPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [purchaseOptions, setPurchaseOptions] = useState<Subject[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPurchase, setShowPurchase] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/alumno");
        return;
      }

      const { data: p } = await supabase.rpc("my_profile").maybeSingle();
      if (!p) {
        router.push("/alumno");
        return;
      }
      setProfile(p as MyProfile);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.username) return;
    setError(null);
    setSubmitting(true);

    const email = `${profile.username}@alumnos.academia-magica.app`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });

    if (signInError) {
      setError("PIN incorrecto. Pedile a tu hijo/a que te ayude a ingresarlo.");
      setSubmitting(false);
      setPin("");
      return;
    }

    setUnlocked(true);
    setSubmitting(false);
    setStatsLoading(true);

    const [{ data: s, error: statsError }, { data: options }] = await Promise.all([
      supabase.rpc("my_parent_stats"),
      supabase.rpc("my_subject_purchase_options"),
    ]);
    if (!statsError && s) {
      setStats(s as ParentStats);
    }
    setPurchaseOptions((options as Subject[]) ?? []);
    setStatsLoading(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function startPurchase() {
    if (selectedIds.size === 0) return;
    setCreatingOrder(true);
    setOrderError(null);
    const { data, error: orderErr } = await supabase.rpc("create_subject_order", {
      p_subject_ids: Array.from(selectedIds),
    });
    if (orderErr || !data?.[0]?.id) {
      setOrderError(orderErr?.message ?? "No se pudo crear la orden");
      setCreatingOrder(false);
      return;
    }
    router.push(`/alumno/panel-padres/pago?order=${data[0].id}`);
  }

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-indigo-500">
        <p className="text-white">Cargando...</p>
      </main>
    );
  }

  // Paso 1: gate con PIN (mismo PIN que el inicio de sesión del alumno)
  if (!unlocked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
        <Link
          href="/alumno/inicio"
          className="absolute left-6 top-6 text-sm text-white/70 hover:text-white"
        >
          ← Volver
        </Link>

        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer(0.08)}
          className="flex flex-col items-center gap-6"
        >
          <motion.div variants={staggerItem} className="text-5xl">
            👨‍👩‍👧
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-center text-2xl font-bold text-white">
            Panel para padres
          </motion.h1>
          <motion.p variants={staggerItem} className="max-w-sm text-center text-white/80">
            Para ver el progreso de {profile.display_name}, ingresá el mismo PIN que se usa para
            entrar a la app.
          </motion.p>

          <motion.form
            variants={staggerItem}
            onSubmit={handlePinSubmit}
            className="flex flex-col items-center gap-4"
          >
            <input
              autoFocus
              required
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-48 rounded-xl border-4 border-white/40 bg-white/20 px-4 py-3 text-center text-3xl tracking-[0.5em] text-white placeholder-white/40 outline-none transition-colors focus:border-white"
              placeholder="••••••"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeSlideUp}
                  className="text-sm text-yellow-200"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || pin.length !== 6}
              whileHover={{ scale: submitting ? 1 : 1.05 }}
              whileTap={{ scale: submitting ? 1 : 0.95 }}
              transition={SPRING_PLAYFUL}
              className="rounded-xl bg-white px-8 py-3 text-lg font-bold text-purple-700 shadow-lg disabled:opacity-50"
            >
              {submitting ? "Comprobando..." : "Entrar 🔓"}
            </motion.button>
          </motion.form>
        </motion.div>
      </main>
    );
  }

  // Paso 2: panel de estadísticas
  const maxDaySeconds = Math.max(1, ...(stats?.daily_last_14d.map((d) => d.seconds) ?? [1]));
  const pricing = getEnrollmentPricing(selectedIds.size);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
        <div>
          <p className="text-sm opacity-90">Panel para padres</p>
          <h1 className="text-2xl font-bold">Progreso de {profile.display_name} 📊</h1>
        </div>
        <Link
          href="/alumno/inicio"
          className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
        >
          ← Volver a la app
        </Link>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        {statsLoading || !stats ? (
          <p className="text-slate-500">Cargando estadísticas...</p>
        ) : (
          <motion.div initial="initial" animate="animate" variants={staggerContainer(0.05)}>
            {/* Tarjetas resumen */}
            <motion.div
              variants={staggerItem}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
              <StatCard label="Tiempo total" value={formatDuration(stats.total_seconds)} emoji="⏱️" />
              <StatCard label="Esta semana" value={formatDuration(stats.seconds_last_7d)} emoji="📅" />
              <StatCard
                label="Precisión"
                value={stats.accuracy_pct !== null ? `${stats.accuracy_pct}%` : "—"}
                emoji="🎯"
              />
              <StatCard label="Racha actual" value={`${stats.current_streak} días`} emoji="🔥" />
              <StatCard label="Récord de racha" value={`${stats.longest_streak} días`} emoji="🏆" />
              <StatCard label="Diamantes actuales" value={`${stats.diamonds_balance} 💎`} emoji="💰" />
              <StatCard label="Diamantes (30 días)" value={`+${stats.diamonds_last_30d} 💎`} emoji="✨" />
              <StatCard label="Temas superados" value={`${stats.topics_passed_total}`} emoji="✅" />
            </motion.div>

            {/* Actividad diaria */}
            <motion.div variants={staggerItem} className="mt-6 rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-slate-800">Actividad de los últimos 14 días</h2>
              <div className="mt-4 flex h-32 items-end gap-2">
                {stats.daily_last_14d.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400"
                      style={{
                        height: `${Math.max(4, (d.seconds / maxDaySeconds) * 100)}%`,
                        opacity: d.seconds === 0 ? 0.15 : 1,
                      }}
                      title={`${formatDay(d.day)}: ${formatDuration(d.seconds)}`}
                    />
                    <span className="text-[10px] text-slate-400">{formatDay(d.day)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tiempo y desempeño por materia */}
            <motion.div variants={staggerItem} className="mt-6 rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-800">Tus materias</h2>
                <button
                  onClick={() => setShowPurchase((v) => !v)}
                  className="rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  {showPurchase ? "Cerrar" : "＋ Contratar más asignaturas"}
                </button>
              </div>
              {stats.by_subject.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Todavía no hay materias asignadas.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {stats.by_subject.map((s) => {
                    const badge = SUBSCRIPTION_BADGE[s.subscription_status] ?? SUBSCRIPTION_BADGE.sin_vencimiento;
                    return (
                      <div
                        key={s.subject_id}
                        className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:gap-3"
                        style={{ borderLeft: `4px solid ${s.subject_color ?? "#a855f7"}` }}
                      >
                        <span className="text-2xl">{s.subject_icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700">{s.subject_name}</p>
                          <p className="text-xs text-slate-500">
                            {s.exercises} ejercicio{s.exercises === 1 ? "" : "s"}
                            {s.accuracy_pct !== null ? ` · ${s.accuracy_pct}% de aciertos` : ""}
                            {s.topics_passed > 0 ? ` · ${s.topics_passed} temas superados` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatExpiry(s.expires_at)}</span>
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                            {formatDuration(s.seconds)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <AnimatePresence>
                {showPurchase && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-5 overflow-hidden rounded-2xl border-2 border-purple-200 bg-purple-50 p-4"
                  >
                    <h3 className="font-bold text-purple-900">Contratar más asignaturas</h3>
                    <p className="mt-1 text-xs text-purple-700">
                      3 meses de acceso por materia. 1–3 materias $10 c/u · 4–6 $8 · 7–10 $7 · 11+ $6.
                    </p>
                    {purchaseOptions.length === 0 ? (
                      <p className="mt-3 text-sm text-purple-700">
                        Ya tenés acceso activo a todas las materias disponibles. 🎉
                      </p>
                    ) : (
                      <>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {purchaseOptions.map((s) => (
                            <label
                              key={s.id}
                              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white p-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-purple-100"
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(s.id)}
                                onChange={() => toggleSelected(s.id)}
                                className="h-4 w-4 accent-purple-600"
                              />
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate">
                                  {s.icon} {s.name}
                                </span>
                                <SubjectInfoBadge description={s.description} />
                              </span>
                            </label>
                          ))}
                        </div>
                        {selectedIds.size > 0 && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                            <p className="text-sm text-slate-600">
                              {pricing.subjectCount} materia{pricing.subjectCount === 1 ? "" : "s"} ·{" "}
                              {pricing.unitPriceUsd} USD c/u
                            </p>
                            <p className="text-xl font-black text-purple-700">{pricing.totalUsd} USD</p>
                          </div>
                        )}
                        {orderError && (
                          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                            {orderError}
                          </p>
                        )}
                        <button
                          onClick={startPurchase}
                          disabled={selectedIds.size === 0 || creatingOrder}
                          className="mt-4 w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {creatingOrder ? "Preparando pago..." : "Continuar al pago →"}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Metodo pedagogico */}
            <motion.div variants={staggerItem} className="mt-6 rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-slate-800">{"\uD83E\uDDE0 C\u00f3mo ense\u00f1amos: la Taxonom\u00eda de Bloom"}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {"Cada ejercicio de la plataforma est\u00e1 pensado seg\u00fan los 6 niveles de pensamiento de la Taxonom\u00eda de Bloom, un modelo pedag\u00f3gico cl\u00e1sico usado en todo el mundo. No es solo memorizar: cada tema avanza en profundidad, de lo m\u00e1s simple a lo m\u00e1s exigente."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { icon: "\uD83E\uDDE0", label: "Recordar", desc: "Guardar y traer a la mente lo aprendido" },
                  { icon: "\uD83D\uDCA1", label: "Entender", desc: "Explicarlo con sus propias palabras" },
                  { icon: "\uD83D\uDEE0\uFE0F", label: "Aplicar", desc: "Usarlo para resolver algo nuevo" },
                  { icon: "\uD83D\uDD0D", label: "Analizar", desc: "Separar en partes y ver c\u00f3mo se conectan" },
                  { icon: "\u2696\uFE0F", label: "Evaluar", desc: "Opinar y justificar con motivos" },
                  { icon: "\u2728", label: "Crear", desc: "Inventar algo nuevo con lo aprendido" },
                ].map((level) => (
                  <div key={level.label} className="rounded-xl bg-indigo-50 p-3 text-center">
                    <span className="text-xl">{level.icon}</span>
                    <p className="mt-1 text-xs font-bold text-indigo-900">{level.label}</p>
                    <p className="mt-0.5 text-[10px] leading-tight text-indigo-700">{level.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600">
                {"En la pr\u00e1ctica esto se ve en cada tema: los ejercicios de pr\u00e1ctica trabajan primero recordar y entender, y el Test final exige aplicar lo aprendido. Las pistas adaptativas (que aparecen si tu hijo/a falla varias veces) tambi\u00e9n bajan un escal\u00f3n en la taxonom\u00eda para ayudarlo a construir la base antes de exigirle el siguiente nivel."}
              </p>
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                {"\uD83D\uDC49 Tu hijo/a ya tiene disponible, sin costo, la materia \u201cC\u00f3mo Aprendemos\u201d: una introducci\u00f3n pensada para su edad a estos 6 niveles, con ejemplos cotidianos en vez de teor\u00eda."}
              </p>
            </motion.div>

            {stats.achievements_count > 0 && (
              <motion.p variants={staggerItem} className="mt-4 text-center text-sm text-slate-500">
                🏅 {stats.achievements_count} logro{stats.achievements_count === 1 ? "" : "s"} desbloqueado
                {stats.achievements_count === 1 ? "" : "s"}
              </motion.p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow">
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg font-bold text-slate-800">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

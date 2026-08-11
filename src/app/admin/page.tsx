import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AdminDashboardData, AdminSummary } from "@/types/admin";
import type { MyProfile } from "@/types/database";
import { formatDateTime } from "@/lib/admin-format";

const emptySummary: AdminSummary = {
  students_total: 0,
  students_active: 0,
  students_inactive: 0,
  active_last_7d: 0,
  needs_attention: 0,
  attempts_last_7d: 0,
  accuracy_last_7d: null,
  topics_passed: 0,
  diamonds_in_circulation: 0,
  purchases_total: 0,
  content_subjects: 0,
  content_exercises: 0,
};

function MetricCard({
  label,
  value,
  detail,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "violet" | "emerald" | "amber" | "blue";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <div className={`mt-3 inline-flex min-w-16 items-center justify-center rounded-xl px-3 py-2 text-3xl font-extrabold ring-1 ${tones[tone]}`}>
        {value}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: profileData }, { data: dashboardData, error }] = await Promise.all([
    supabase.rpc("my_profile").maybeSingle(),
    supabase.rpc("admin_dashboard_metrics"),
  ]);

  const profile = profileData as unknown as MyProfile | null;
  const dashboard = (dashboardData as unknown as AdminDashboardData | null) ?? {
    summary: emptySummary,
    daily_activity: [],
    subject_performance: [],
    attention: [],
    recent_admin_activity: [],
  };
  const summary = dashboard.summary ?? emptySummary;
  const maxAttempts = Math.max(1, ...dashboard.daily_activity.map((day) => day.attempts));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Visión general</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">
            Buenos días, {profile?.display_name ?? "Pablo"}
          </h1>
          <p className="mt-1 text-slate-500">Todo lo importante de la academia, en un solo lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/comunicacion" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-violet-300 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            Enviar comunicación
          </Link>
          <Link href="/admin/alumnos" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            Gestionar alumnos
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Las métricas avanzadas aún no están disponibles. El resto del panel sigue operativo.
        </div>
      )}

      <section aria-labelledby="metricas-principales" className="mt-8">
        <h2 id="metricas-principales" className="sr-only">Métricas principales</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Alumnos activos" value={summary.students_active} detail={`${summary.students_total} alumnos totales · ${summary.students_inactive} inactivos`} tone="emerald" />
          <MetricCard label="Activos esta semana" value={summary.active_last_7d} detail="Alumnos con actividad durante los últimos 7 días" tone="blue" />
          <MetricCard label="Precisión semanal" value={summary.accuracy_last_7d == null ? "—" : `${summary.accuracy_last_7d}%`} detail={`${summary.attempts_last_7d} ejercicios respondidos esta semana`} tone="violet" />
          <MetricCard label="Necesitan atención" value={summary.needs_attention} detail="Sin actividad reciente o con precisión inferior al 60%" tone="amber" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="actividad-14-dias" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="actividad-14-dias" className="font-display text-xl font-extrabold">Actividad de los últimos 14 días</h2>
              <p className="text-sm text-slate-500">Número de ejercicios completados por día.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{summary.attempts_last_7d} esta semana</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5" aria-label="Gráfico de actividad diaria">
            {dashboard.daily_activity.map((day) => {
              const height = Math.max(day.attempts > 0 ? 10 : 3, Math.round((day.attempts / maxAttempts) * 100));
              return (
                <div key={day.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="relative w-full max-w-9 rounded-t-lg bg-violet-500 transition hover:bg-violet-600"
                    style={{ height: `${height}%` }}
                    title={`${day.day}: ${day.attempts} ejercicios`}
                  >
                    <span className="sr-only">{day.attempts} ejercicios el {day.day}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Intl.DateTimeFormat("es-ES", { weekday: "narrow" }).format(new Date(`${day.day}T12:00:00`))}
                  </span>
                </div>
              );
            })}
            {dashboard.daily_activity.length === 0 && <p className="m-auto text-sm text-slate-400">Todavía no hay actividad registrada.</p>}
          </div>
        </section>

        <section aria-labelledby="alertas-seguimiento" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 id="alertas-seguimiento" className="font-display text-xl font-extrabold">Atención prioritaria</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-800">{dashboard.attention.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {dashboard.attention.slice(0, 5).map((student) => (
              <Link key={student.student_id} href={`/admin/alumnos/${student.student_id}`} className="block rounded-xl border border-slate-200 p-3 transition hover:border-amber-300 hover:bg-amber-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{student.display_name}</p>
                    <p className="mt-0.5 text-xs text-amber-700">{student.reason}</p>
                  </div>
                  <span aria-hidden="true" className="text-slate-400">→</span>
                </div>
              </Link>
            ))}
            {dashboard.attention.length === 0 && (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Todo en orden: no hay alertas de seguimiento.</div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="rendimiento-materias" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <h2 id="rendimiento-materias" className="font-display text-xl font-extrabold">Rendimiento por materia</h2>
          <p className="text-sm text-slate-500">Precisión acumulada de los ejercicios realizados.</p>
          <div className="mt-5 space-y-4">
            {dashboard.subject_performance.filter((subject) => subject.attempts > 0).map((subject) => (
              <div key={subject.subject_id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-slate-700">{subject.icon} {subject.name}</span>
                  <span className="font-extrabold text-slate-900">{subject.accuracy_pct ?? 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${subject.accuracy_pct ?? 0}%`, backgroundColor: subject.color ?? "#7c3aed" }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{subject.attempts} intentos · {subject.students} alumnos</p>
              </div>
            ))}
            {dashboard.subject_performance.every((subject) => subject.attempts === 0) && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aún no hay ejercicios suficientes para comparar materias.</p>}
          </div>
        </section>

        <section aria-labelledby="salud-plataforma" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
          <h2 id="salud-plataforma" className="font-display text-xl font-extrabold">Economía y contenido</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-cyan-50 p-4"><p className="text-xs font-bold text-cyan-700">Diamantes en circulación</p><p className="mt-1 text-2xl font-extrabold text-cyan-950">💎 {summary.diamonds_in_circulation}</p></div>
            <div className="rounded-xl bg-pink-50 p-4"><p className="text-xs font-bold text-pink-700">Compras realizadas</p><p className="mt-1 text-2xl font-extrabold text-pink-950">{summary.purchases_total}</p></div>
            <div className="rounded-xl bg-indigo-50 p-4"><p className="text-xs font-bold text-indigo-700">Materias activas</p><p className="mt-1 text-2xl font-extrabold text-indigo-950">{summary.content_subjects}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">Ejercicios activos</p><p className="mt-1 text-2xl font-extrabold text-emerald-950">{summary.content_exercises}</p></div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800">Últimas acciones administrativas</h3>
              <Link href="/admin/actividad" className="text-xs font-bold text-violet-600 hover:text-violet-800">Ver registro →</Link>
            </div>
            <ul className="mt-3 space-y-2">
              {dashboard.recent_admin_activity.slice(0, 4).map((activity) => (
                <li key={activity.id} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-slate-600">{activity.summary}</span>
                  <time className="whitespace-nowrap text-xs text-slate-400" dateTime={activity.created_at}>{formatDateTime(activity.created_at)}</time>
                </li>
              ))}
              {dashboard.recent_admin_activity.length === 0 && <li className="text-sm text-slate-400">Sin acciones registradas todavía.</li>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

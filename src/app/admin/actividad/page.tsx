import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/admin-format";
import type { AdminActivity } from "@/types/admin";

const actionLabels: Record<string, string> = {
  diamonds_adjusted: "Diamantes",
  student_activated: "Activación",
  student_deactivated: "Desactivación",
  student_details_updated: "Seguimiento",
  subjects_updated: "Materias",
  student_contacted: "Contacto",
};

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_activity_log")
    .select("id, action, summary, student_id, metadata, created_at, profiles!admin_activity_log_student_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as (AdminActivity & { profiles?: { display_name?: string } | null })[];

  return <div>
    <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Trazabilidad</p><h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">Registro administrativo</h1><p className="mt-1 max-w-2xl text-slate-500">Historial de premios, cambios de estado, contactos y modificaciones realizadas desde el panel.</p></div>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">No se pudo cargar el registro.</div>}
    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Fecha</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Alumno</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((activity) => <tr key={activity.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-5 py-4 text-slate-500"><time dateTime={activity.created_at}>{formatDateTime(activity.created_at)}</time></td><td className="px-4 py-4"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-extrabold text-violet-800">{actionLabels[activity.action] ?? activity.action}</span></td><td className="px-4 py-4 font-bold text-slate-800">{activity.summary}</td><td className="px-4 py-4">{activity.student_id ? <Link href={`/admin/alumnos/${activity.student_id}`} className="font-bold text-violet-600 hover:underline">{activity.profiles?.display_name ?? "Ver ficha"}</Link> : <span className="text-slate-400">General</span>}</td></tr>)}{rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">Las próximas acciones administrativas aparecerán aquí.</td></tr>}</tbody></table></div>
    </section>
    <p className="mt-4 text-xs text-slate-400">Se muestran las últimas 200 acciones. El registro no se puede modificar desde la aplicación.</p>
  </div>;
}

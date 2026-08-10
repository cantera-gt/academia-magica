import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/types/database";
import StatCard from "@/components/stat-card";

export default async function AdminHome() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_profile").maybeSingle();
  const profile = data as unknown as MyProfile | null;

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  const { count: exerciseCount } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Hola, {profile?.display_name} 👋
      </h1>
      <p className="mt-1 text-slate-600">Panel de Academia Mágica</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          href="/admin/alumnos"
          label="Alumnos"
          value={studentCount ?? 0}
          cta="Gestionar →"
        />
        <StatCard
          href="/admin/ejercicios"
          label="Ejercicios"
          value={exerciseCount ?? 0}
          cta="Gestionar →"
        />
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Plataforma</p>
          <p className="text-lg font-bold text-slate-800">Academia Mágica</p>
          <p className="mt-1 text-sm text-slate-400">v1</p>
        </div>
      </div>
    </div>
  );
}

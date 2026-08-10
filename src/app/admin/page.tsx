import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/types/database";

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
        <Link
          href="/admin/alumnos"
          className="rounded-xl bg-white p-5 shadow transition hover:shadow-md"
        >
          <p className="text-sm text-slate-500">Alumnos</p>
          <p className="text-3xl font-bold text-purple-700">
            {studentCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-purple-600">Gestionar →</p>
        </Link>

        <Link
          href="/admin/ejercicios"
          className="rounded-xl bg-white p-5 shadow transition hover:shadow-md"
        >
          <p className="text-sm text-slate-500">Ejercicios</p>
          <p className="text-3xl font-bold text-purple-700">
            {exerciseCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-purple-600">Gestionar →</p>
        </Link>

        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Plataforma</p>
          <p className="text-lg font-bold text-slate-800">Academia Mágica</p>
          <p className="mt-1 text-sm text-slate-400">v1</p>
        </div>
      </div>
    </div>
  );
}

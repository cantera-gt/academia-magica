import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/types/database";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase.rpc("my_profile").maybeSingle();
  const profile = data as unknown as MyProfile | null;

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-slate-900 px-6 py-4">
        <Link href="/admin" className="text-lg font-bold text-white">
          Academia Mágica · Admin
        </Link>
        <nav className="flex gap-4 text-sm text-slate-300">
          <Link href="/admin/alumnos" className="hover:text-white">
            Alumnos
          </Link>
          <Link href="/admin/ejercicios" className="hover:text-white">
            Ejercicios
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="hover:text-white">Salir</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}

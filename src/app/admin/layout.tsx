import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/types/database";
import AdminNav from "@/components/admin-nav";

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
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
      <a
        href="#contenido-admin"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-white px-4 py-2 font-bold text-violet-700 shadow focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <AdminNav adminName={profile.display_name} />
      <main id="contenido-admin" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

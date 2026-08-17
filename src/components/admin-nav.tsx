"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Resumen", icon: "▦", exact: true },
  { href: "/admin/alumnos", label: "Alumnos", icon: "♟" },
  { href: "/admin/matriculas", label: "Matrículas", icon: "✍" },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: "⏳" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/comunicacion", label: "Comunicación", icon: "✉" },
  { href: "/admin/actividad", label: "Registro", icon: "◷" },
  { href: "/admin/ejercicios", label: "Contenido", icon: "✦" },
  { href: "/admin/afiliados", label: "Afiliados", icon: "🤝" },
];

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-[#111827] text-white lg:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/admin" className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300">
            <span className="block text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
              Academia Mágica
            </span>
            <span className="mt-1 block font-display text-xl font-bold">Centro de control</span>
          </Link>
        </div>

        <nav aria-label="Navegación del administrador" className="flex-1 space-y-1 p-4">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                  active ? "bg-violet-500 text-white shadow-lg shadow-violet-950/20" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center text-lg">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 px-4 py-3">
            <p className="text-xs text-slate-400">Administrador</p>
            <p className="truncate text-sm font-bold">{adminName}</p>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="w-full rounded-xl px-4 py-2 text-left text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="font-display font-bold text-slate-900">
            Academia Mágica · Admin
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
              Salir
            </button>
          </form>
        </div>
        <nav aria-label="Navegación móvil del administrador" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                  active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}

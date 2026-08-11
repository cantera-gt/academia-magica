export default function AdminLoading() {
  return (
    <div role="status" aria-label="Cargando panel administrador" className="animate-pulse">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-72 max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-72 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="h-72 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

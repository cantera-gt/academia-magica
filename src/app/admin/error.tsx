"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-12 max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <div aria-hidden="true" className="text-4xl">⚠️</div>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-950">No pudimos cargar esta sección</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Tus datos no se han modificado. Puedes intentarlo de nuevo o volver al resumen.</p>
      <div className="mt-6 flex justify-center gap-3">
        <a href="/admin" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Volver al resumen</a>
        <button onClick={reset} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Reintentar</button>
      </div>
    </div>
  );
}

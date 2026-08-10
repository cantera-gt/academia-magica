import { createClient } from "@/lib/supabase/server";

export default async function EjerciciosPage() {
  const supabase = await createClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, category, icon, color")
    .order("sort_order");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, type, difficulty, prompt, diamond_reward, topic_id, topics(name, subject_id)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ejercicios</h1>
      <p className="mt-1 text-slate-600">
        {exercises?.length ?? 0} ejercicios cargados en {subjects?.length ?? 0}{" "}
        materias.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {subjects?.map((s) => (
          <div
            key={s.id}
            className="rounded-xl bg-white p-4 text-center shadow"
            style={{ borderTop: `4px solid ${s.color ?? "#a855f7"}` }}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-1 text-xs font-medium text-slate-700">
              {s.name}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Tema</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Dificultad</th>
              <th className="px-4 py-3">Enunciado</th>
              <th className="px-4 py-3">Diamantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exercises?.map((ex) => (
              <tr key={ex.id}>
                {/* @ts-expect-error - relacion anidada de supabase */}
                <td className="px-4 py-3 text-slate-500">{ex.topics?.name}</td>
                <td className="px-4 py-3 text-slate-500">{ex.type}</td>
                <td className="px-4 py-3 text-slate-500">
                  {"⭐".repeat(ex.difficulty)}
                </td>
                <td className="px-4 py-3 text-slate-800">
                  {(ex.prompt as { text?: string })?.text}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  💎 {ex.diamond_reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        El generador de ejercicios propios (crear/editar desde el panel) es el
        siguiente paso.
      </p>
    </div>
  );
}

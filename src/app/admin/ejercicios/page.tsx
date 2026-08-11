import { createClient } from "@/lib/supabase/server";

interface TopicRow { id: string; subject_id: string; active: boolean }
interface ExerciseRow { id: string; topic_id: string; active: boolean; is_exam: boolean }

export default async function ContentPage() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: topicRows }, { data: exerciseRows }] = await Promise.all([
    supabase.from("subjects").select("id, name, category, icon, color, active, sort_order").order("sort_order"),
    supabase.from("topics").select("id, subject_id, active"),
    supabase.from("exercises").select("id, topic_id, active, is_exam"),
  ]);
  const topics = (topicRows ?? []) as TopicRow[];
  const exercises = (exerciseRows ?? []) as ExerciseRow[];
  const topicToSubject = new Map(topics.map((topic) => [topic.id, topic.subject_id]));
  const stats = (subjects ?? []).map((subject) => {
    const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id && topic.active);
    const subjectExercises = exercises.filter((exercise) => topicToSubject.get(exercise.topic_id) === subject.id && exercise.active);
    return { ...subject, topics: subjectTopics.length, exercises: subjectExercises.length, exams: subjectExercises.filter((exercise) => exercise.is_exam).length };
  });
  const withContent = stats.filter((subject) => subject.exercises > 0).length;
  const empty = stats.filter((subject) => subject.active && subject.exercises === 0).length;
  const maxExercises = Math.max(1, ...stats.map((subject) => subject.exercises));

  return <div>
    <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-600">Control académico</p><h1 className="mt-1 font-display text-3xl font-extrabold text-slate-950">Contenido y cobertura</h1><p className="mt-1 max-w-2xl text-slate-500">Visión de materias, temas, práctica y exámenes publicados.</p></div>
    <section aria-label="Resumen de contenido" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Materias activas</p><p className="mt-2 text-3xl font-extrabold text-violet-700">{stats.filter((subject) => subject.active).length}</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Con contenido</p><p className="mt-2 text-3xl font-extrabold text-emerald-700">{withContent}</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Ejercicios activos</p><p className="mt-2 text-3xl font-extrabold text-blue-700">{exercises.filter((exercise) => exercise.active).length}</p></div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-bold text-slate-500">Materias vacías</p><p className="mt-2 text-3xl font-extrabold text-amber-700">{empty}</p></div>
    </section>
    {empty > 0 && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Atención:</strong> {empty} materias activas aún no tienen ejercicios. El motor funciona, pero el alumno las verá sin contenido jugable.</div>}
    <section aria-labelledby="cobertura-materias" className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 id="cobertura-materias" className="font-display text-xl font-extrabold">Cobertura por materia</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{stats.map((subject) => <article key={subject.id} className={`rounded-xl border p-4 ${subject.exercises === 0 ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{subject.icon} {subject.name}</h3><p className="text-xs text-slate-400">{subject.category} · {subject.topics} temas · {subject.exams} preguntas de examen</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${subject.exercises > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{subject.exercises > 0 ? `${subject.exercises} ejercicios` : "Sin contenido"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${subject.exercises / maxExercises * 100}%`, backgroundColor: subject.color ?? "#7c3aed" }} /></div></article>)}</div>
    </section>
  </div>;
}

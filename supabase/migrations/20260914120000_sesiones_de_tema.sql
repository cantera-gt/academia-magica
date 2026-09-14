-- Reanudar un tema a medias.
--
-- Hasta ahora, si un nino dejaba un tema sin terminar (cerraba la pestana, se
-- le acababa el rato, se atascaba), al volver empezaba desde el primer
-- ejercicio. Ni el alumno ni el profesor tenian forma de saber por donde iba.
--
-- Esta tabla guarda UNA sesion viva por alumno y tema: en que fase estaba
-- (practica o test), en que ejercicio, y lo que llevaba acertado y ganado.
-- Se borra al cerrar el tema o cuando el alumno elige empezar de nuevo.
--
-- No sustituye a topic_progress, que es el historico de resultados
-- (mejor nota, estrellas, aprobado). Esto es solo "por donde ibas".

create table if not exists public.topic_sessions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  phase text not null default 'practice' check (phase in ('practice', 'exam')),
  exercise_index integer not null default 0 check (exercise_index >= 0 and exercise_index < 500),
  practice_correct integer not null default 0 check (practice_correct >= 0 and practice_correct < 500),
  exam_correct integer not null default 0 check (exam_correct >= 0 and exam_correct < 500),
  diamonds_earned integer not null default 0 check (diamonds_earned >= 0 and diamonds_earned < 100000),
  updated_at timestamp with time zone not null default now(),
  primary key (student_id, topic_id)
);

create index if not exists topic_sessions_student_idx
  on public.topic_sessions using btree (student_id, updated_at desc);

-- RLS: cada alumno solo ve y escribe sus propias sesiones.
alter table public.topic_sessions enable row level security;

drop policy if exists topic_sessions_select_own on public.topic_sessions;
create policy topic_sessions_select_own on public.topic_sessions
  as permissive for select to public
  using (student_id = auth.uid());

drop policy if exists topic_sessions_write_own on public.topic_sessions;
create policy topic_sessions_write_own on public.topic_sessions
  as permissive for all to public
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Lectura: devuelve la sesion viva de este tema, o null si no hay ninguna.
CREATE OR REPLACE FUNCTION public.my_topic_session(p_topic_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_row topic_sessions;
begin
  if v_uid is null then
    return null;
  end if;

  select * into v_row from topic_sessions
  where student_id = v_uid and topic_id = p_topic_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'topic_id', v_row.topic_id,
    'phase', v_row.phase,
    'exercise_index', v_row.exercise_index,
    'practice_correct', v_row.practice_correct,
    'exam_correct', v_row.exam_correct,
    'diamonds_earned', v_row.diamonds_earned,
    'updated_at', v_row.updated_at
  );
end;
$function$;

-- Guardado: se llama tras cada ejercicio. Comprueba que el alumno tenga la
-- materia vigente, igual que playable_topic_exercises, para que no se puedan
-- sembrar filas de temas a los que no se tiene acceso.
CREATE OR REPLACE FUNCTION public.save_topic_session(
  p_topic_id uuid,
  p_phase text,
  p_index integer,
  p_practice_correct integer,
  p_exam_correct integer,
  p_diamonds integer
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  if p_phase is null or p_phase not in ('practice', 'exam') then
    raise exception 'Fase no valida';
  end if;

  if not exists (
    select 1
    from topics t
    join student_subjects ss on ss.subject_id = t.subject_id
    where t.id = p_topic_id and ss.student_id = v_uid
      and (ss.expires_at is null or ss.expires_at > now())
  ) then
    raise exception 'No tienes esta materia asignada o tu acceso ha vencido';
  end if;

  insert into topic_sessions (
    student_id, topic_id, phase, exercise_index,
    practice_correct, exam_correct, diamonds_earned, updated_at
  )
  values (
    v_uid, p_topic_id, p_phase,
    least(greatest(coalesce(p_index, 0), 0), 499),
    least(greatest(coalesce(p_practice_correct, 0), 0), 499),
    least(greatest(coalesce(p_exam_correct, 0), 0), 499),
    least(greatest(coalesce(p_diamonds, 0), 0), 99999),
    now()
  )
  on conflict (student_id, topic_id) do update set
    phase = excluded.phase,
    exercise_index = excluded.exercise_index,
    practice_correct = excluded.practice_correct,
    exam_correct = excluded.exam_correct,
    diamonds_earned = excluded.diamonds_earned,
    updated_at = now();
end;
$function$;

-- Borrado: al cerrar el tema o al elegir "empezar de nuevo".
CREATE OR REPLACE FUNCTION public.clear_topic_session(p_topic_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  delete from topic_sessions where student_id = v_uid and topic_id = p_topic_id;
end;
$function$;

grant execute on function public.my_topic_session(uuid) to anon, authenticated, service_role;
grant execute on function public.save_topic_session(uuid, text, integer, integer, integer, integer) to anon, authenticated, service_role;
grant execute on function public.clear_topic_session(uuid) to anon, authenticated, service_role;

-- Para revertir:
--   drop function if exists public.clear_topic_session(uuid);
--   drop function if exists public.save_topic_session(uuid, text, integer, integer, integer, integer);
--   drop function if exists public.my_topic_session(uuid);
--   drop table if exists public.topic_sessions;

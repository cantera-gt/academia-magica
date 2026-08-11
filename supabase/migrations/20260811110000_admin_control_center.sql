-- Centro de control administrativo para Academia Magica.
-- Supabase sigue siendo la fuente de verdad; las exportaciones son solo vistas de trabajo.

create table if not exists public.student_admin_details (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  guardian_name text,
  guardian_email text,
  admin_notes text,
  status_reason text,
  tags text[] not null default '{}'::text[],
  last_contacted_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint student_admin_details_guardian_name_length check (guardian_name is null or char_length(guardian_name) <= 120),
  constraint student_admin_details_guardian_email_length check (guardian_email is null or char_length(guardian_email) <= 254),
  constraint student_admin_details_guardian_email_format check (guardian_email is null or guardian_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint student_admin_details_notes_length check (admin_notes is null or char_length(admin_notes) <= 4000),
  constraint student_admin_details_status_reason_length check (status_reason is null or char_length(status_reason) <= 500),
  constraint student_admin_details_tags_limit check (cardinality(tags) <= 8)
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  student_id uuid references public.profiles(id) on delete set null,
  action text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_activity_action_length check (char_length(action) between 1 and 80),
  constraint admin_activity_summary_length check (char_length(summary) between 1 and 500)
);

alter table public.student_admin_details enable row level security;
alter table public.admin_activity_log enable row level security;

drop policy if exists "admin_read_student_details" on public.student_admin_details;
create policy "admin_read_student_details"
on public.student_admin_details for select to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    join public.profiles student_profile
      on student_profile.id = student_admin_details.student_id
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'::public.user_role
      and student_profile.role = 'student'::public.user_role
      and student_profile.household_id = admin_profile.household_id
  )
);

drop policy if exists "admin_read_activity_log" on public.admin_activity_log;
create policy "admin_read_activity_log"
on public.admin_activity_log for select to authenticated
using (
  exists (
    select 1 from public.profiles admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'::public.user_role
      and admin_profile.household_id = admin_activity_log.household_id
  )
);

revoke all on table public.student_admin_details from anon;
revoke all on table public.admin_activity_log from anon;
grant select on table public.student_admin_details to authenticated;
grant select on table public.admin_activity_log to authenticated;

create index if not exists profiles_admin_roster_idx
  on public.profiles (household_id, role, is_active, display_name);
create index if not exists exercise_attempts_student_date_idx
  on public.exercise_attempts (student_id, attempted_at desc);
create index if not exists topic_progress_student_date_idx
  on public.topic_progress (student_id, last_played_at desc);
create index if not exists diamond_transactions_student_date_idx
  on public.diamond_transactions (student_id, created_at desc);
create index if not exists admin_activity_household_date_idx
  on public.admin_activity_log (household_id, created_at desc);
create index if not exists admin_activity_student_date_idx
  on public.admin_activity_log (student_id, created_at desc)
  where student_id is not null;

create or replace function public.admin_students_overview()
returns table (
  student_id uuid,
  display_name text,
  username text,
  birthdate date,
  age_bracket public.age_bracket,
  gender public.character_gender,
  character_id text,
  diamonds integer,
  is_active boolean,
  created_at timestamptz,
  guardian_name text,
  guardian_email text,
  tags text[],
  status_reason text,
  last_contacted_at timestamptz,
  last_activity_at timestamptz,
  attempt_count bigint,
  correct_count bigint,
  accuracy_pct numeric,
  topics_started bigint,
  topics_passed bigint,
  assigned_subjects bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with admin_context as (
    select p.household_id
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.user_role
  ), attempts as (
    select ea.student_id,
           count(*) as attempt_count,
           count(*) filter (where ea.is_correct) as correct_count,
           max(ea.attempted_at) as last_attempt_at
    from public.exercise_attempts ea
    group by ea.student_id
  ), progress as (
    select tp.student_id,
           count(*) as topics_started,
           count(*) filter (where tp.passed_at is not null) as topics_passed,
           max(tp.last_played_at) as last_progress_at
    from public.topic_progress tp
    group by tp.student_id
  ), games as (
    select gp.student_id, max(gp.played_at) as last_game_at
    from public.game_plays gp
    group by gp.student_id
  ), assignments as (
    select ss.student_id, count(*) as assigned_subjects
    from public.student_subjects ss
    group by ss.student_id
  )
  select p.id,
         p.display_name,
         p.username,
         p.birthdate,
         p.age_bracket,
         p.gender,
         p.character_id,
         p.diamonds,
         p.is_active,
         p.created_at,
         d.guardian_name,
         d.guardian_email,
         coalesce(d.tags, '{}'::text[]),
         d.status_reason,
         d.last_contacted_at,
         nullif(greatest(
           coalesce(a.last_attempt_at, '-infinity'::timestamptz),
           coalesce(pr.last_progress_at, '-infinity'::timestamptz),
           coalesce(g.last_game_at, '-infinity'::timestamptz)
         ), '-infinity'::timestamptz),
         coalesce(a.attempt_count, 0),
         coalesce(a.correct_count, 0),
         case when coalesce(a.attempt_count, 0) = 0 then null
              else round(100.0 * a.correct_count / a.attempt_count, 1) end,
         coalesce(pr.topics_started, 0),
         coalesce(pr.topics_passed, 0),
         coalesce(ass.assigned_subjects, 0)
  from public.profiles p
  join admin_context ac on ac.household_id = p.household_id
  left join public.student_admin_details d on d.student_id = p.id
  left join attempts a on a.student_id = p.id
  left join progress pr on pr.student_id = p.id
  left join games g on g.student_id = p.id
  left join assignments ass on ass.student_id = p.id
  where p.role = 'student'::public.user_role
  order by p.display_name;
$$;

create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_result jsonb;
begin
  select p.household_id into v_household
  from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'::public.user_role;

  if v_household is null then
    raise exception 'Acceso reservado al administrador';
  end if;

  with roster as (
    select * from public.admin_students_overview()
  ), household_students as (
    select p.id from public.profiles p
    where p.household_id = v_household and p.role = 'student'::public.user_role
  ), daily as (
    select day::date as day,
           count(ea.id)::int as attempts,
           count(ea.id) filter (where ea.is_correct)::int as correct,
           count(distinct ea.student_id)::int as active_students
    from generate_series(current_date - 13, current_date, interval '1 day') day
    left join public.exercise_attempts ea
      on ea.attempted_at >= day
     and ea.attempted_at < day + interval '1 day'
     and ea.student_id in (select id from household_students)
    group by day
    order by day
  ), subject_stats as (
    select s.id, s.name, s.icon, s.color,
           count(ea.id)::int as attempts,
           count(ea.id) filter (where ea.is_correct)::int as correct,
           count(distinct ea.student_id)::int as students
    from public.subjects s
    left join public.topics t on t.subject_id = s.id
    left join public.exercises e on e.topic_id = t.id
    left join public.exercise_attempts ea
      on ea.exercise_id = e.id
     and ea.student_id in (select id from household_students)
    where s.active
    group by s.id, s.name, s.icon, s.color, s.sort_order
    order by count(ea.id) desc, s.sort_order
    limit 8
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'students_total', (select count(*) from roster),
      'students_active', (select count(*) from roster where is_active),
      'students_inactive', (select count(*) from roster where not is_active),
      'active_last_7d', (select count(*) from roster where last_activity_at >= now() - interval '7 days'),
      'needs_attention', (select count(*) from roster where is_active and (last_activity_at is null or last_activity_at < now() - interval '14 days' or (attempt_count >= 3 and accuracy_pct < 60))),
      'attempts_last_7d', (select count(*) from public.exercise_attempts ea where ea.student_id in (select id from household_students) and ea.attempted_at >= now() - interval '7 days'),
      'accuracy_last_7d', (select round(100.0 * count(*) filter (where ea.is_correct) / nullif(count(*), 0), 1) from public.exercise_attempts ea where ea.student_id in (select id from household_students) and ea.attempted_at >= now() - interval '7 days'),
      'topics_passed', (select count(*) from public.topic_progress tp where tp.student_id in (select id from household_students) and tp.passed_at is not null),
      'diamonds_in_circulation', (select coalesce(sum(p.diamonds), 0) from public.profiles p where p.id in (select id from household_students)),
      'purchases_total', (select count(*) from public.student_inventory si where si.student_id in (select id from household_students)),
      'content_subjects', (select count(*) from public.subjects where active),
      'content_exercises', (select count(*) from public.exercises where active)
    ),
    'daily_activity', (select coalesce(jsonb_agg(to_jsonb(daily)), '[]'::jsonb) from daily),
    'subject_performance', (select coalesce(jsonb_agg(jsonb_build_object(
      'subject_id', id,
      'name', name,
      'icon', icon,
      'color', color,
      'attempts', attempts,
      'accuracy_pct', case when attempts = 0 then null else round(100.0 * correct / attempts, 1) end,
      'students', students
    )), '[]'::jsonb) from subject_stats),
    'attention', (select coalesce(jsonb_agg(jsonb_build_object(
      'student_id', student_id,
      'display_name', display_name,
      'last_activity_at', last_activity_at,
      'accuracy_pct', accuracy_pct,
      'attempt_count', attempt_count,
      'reason', case
        when last_activity_at is null then 'Todavia no ha empezado'
        when last_activity_at < now() - interval '14 days' then 'Sin actividad reciente'
        when attempt_count >= 3 and accuracy_pct < 60 then 'Puede necesitar apoyo'
        else 'Revisar seguimiento'
      end
    ) order by last_activity_at nulls first), '[]'::jsonb)
      from roster
      where is_active and (last_activity_at is null or last_activity_at < now() - interval '14 days' or (attempt_count >= 3 and accuracy_pct < 60))
    ),
    'recent_admin_activity', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select l.id, l.action, l.summary, l.student_id, l.created_at, p.display_name as student_name
      from public.admin_activity_log l
      left join public.profiles p on p.id = l.student_id
      where l.household_id = v_household
      order by l.created_at desc
      limit 8
    ) x)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_student_detail(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_result jsonb;
begin
  select admin_profile.household_id into v_household
  from public.profiles admin_profile
  join public.profiles student_profile
    on student_profile.id = p_student_id
   and student_profile.role = 'student'::public.user_role
   and student_profile.household_id = admin_profile.household_id
  where admin_profile.id = auth.uid()
    and admin_profile.role = 'admin'::public.user_role;

  if v_household is null then
    raise exception 'Alumno no encontrado o sin permiso';
  end if;

  select jsonb_build_object(
    'student', (
      select jsonb_build_object(
        'id', p.id, 'display_name', p.display_name, 'username', p.username,
        'birthdate', p.birthdate, 'age_bracket', p.age_bracket, 'gender', p.gender,
        'character_id', p.character_id, 'diamonds', p.diamonds,
        'is_active', p.is_active, 'created_at', p.created_at,
        'guardian_name', d.guardian_name, 'guardian_email', d.guardian_email,
        'admin_notes', d.admin_notes, 'status_reason', d.status_reason,
        'tags', coalesce(d.tags, '{}'::text[]), 'last_contacted_at', d.last_contacted_at
      )
      from public.profiles p
      left join public.student_admin_details d on d.student_id = p.id
      where p.id = p_student_id
    ),
    'overview', (
      select to_jsonb(r) from public.admin_students_overview() r where r.student_id = p_student_id
    ),
    'assigned_subject_ids', (
      select coalesce(jsonb_agg(ss.subject_id), '[]'::jsonb)
      from public.student_subjects ss where ss.student_id = p_student_id
    ),
    'subjects', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb)
      from (
        select s.id as subject_id, s.name, s.icon, s.color, s.sort_order,
               count(distinct ea.id)::int as attempts,
               count(distinct ea.id) filter (where ea.is_correct)::int as correct,
               case when count(distinct ea.id) = 0 then null
                    else round(100.0 * count(distinct ea.id) filter (where ea.is_correct) / count(distinct ea.id), 1) end as accuracy_pct,
               count(distinct tp.id)::int as topics_started,
               count(distinct tp.id) filter (where tp.passed_at is not null)::int as topics_passed,
               max(greatest(ea.attempted_at, tp.last_played_at)) as last_activity_at
        from public.student_subjects ss
        join public.subjects s on s.id = ss.subject_id
        left join public.topics t on t.subject_id = s.id
        left join public.exercises e on e.topic_id = t.id
        left join public.exercise_attempts ea on ea.exercise_id = e.id and ea.student_id = p_student_id
        left join public.topic_progress tp on tp.topic_id = t.id and tp.student_id = p_student_id
        where ss.student_id = p_student_id
        group by s.id, s.name, s.icon, s.color, s.sort_order
      ) x
    ),
    'recent_attempts', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.attempted_at desc), '[]'::jsonb)
      from (
        select ea.id, ea.is_correct, ea.diamonds_earned, ea.time_spent_seconds, ea.attempted_at,
               e.prompt->>'text' as prompt, t.name as topic_name, s.name as subject_name, s.icon as subject_icon
        from public.exercise_attempts ea
        join public.exercises e on e.id = ea.exercise_id
        join public.topics t on t.id = e.topic_id
        join public.subjects s on s.id = t.subject_id
        where ea.student_id = p_student_id
        order by ea.attempted_at desc
        limit 30
      ) x
    ),
    'diamond_transactions', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select dt.id, dt.amount, dt.reason, dt.reference_type, dt.created_at
        from public.diamond_transactions dt
        where dt.student_id = p_student_id
        order by dt.created_at desc
        limit 30
      ) x
    ),
    'daily_activity', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb)
      from (
        select day::date as day, count(ea.id)::int as attempts,
               count(ea.id) filter (where ea.is_correct)::int as correct,
               coalesce(sum(ea.diamonds_earned), 0)::int as diamonds
        from generate_series(current_date - 13, current_date, interval '1 day') day
        left join public.exercise_attempts ea
          on ea.student_id = p_student_id
         and ea.attempted_at >= day
         and ea.attempted_at < day + interval '1 day'
        group by day
      ) x
    ),
    'admin_activity', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select l.id, l.action, l.summary, l.metadata, l.created_at
        from public.admin_activity_log l
        where l.student_id = p_student_id and l.household_id = v_household
        order by l.created_at desc
        limit 30
      ) x
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_adjust_student_diamonds(
  p_student_id uuid,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_name text;
  v_balance integer;
begin
  if p_amount = 0 or abs(p_amount) > 5000 then
    raise exception 'El ajuste debe estar entre -5000 y 5000 y no puede ser cero';
  end if;
  if nullif(trim(p_reason), '') is null or char_length(trim(p_reason)) > 300 then
    raise exception 'Indica un motivo de hasta 300 caracteres';
  end if;

  select admin_profile.household_id, student_profile.display_name
    into v_household, v_name
  from public.profiles admin_profile
  join public.profiles student_profile
    on student_profile.id = p_student_id
   and student_profile.role = 'student'::public.user_role
   and student_profile.household_id = admin_profile.household_id
  where admin_profile.id = auth.uid() and admin_profile.role = 'admin'::public.user_role;

  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update public.profiles
  set diamonds = diamonds + p_amount, updated_at = now()
  where id = p_student_id and diamonds + p_amount >= 0
  returning diamonds into v_balance;

  if v_balance is null then raise exception 'El saldo no puede quedar en negativo'; end if;

  insert into public.diamond_transactions(student_id, amount, reason, reference_type)
  values (p_student_id, p_amount, trim(p_reason), 'admin_adjustment');

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'diamonds_adjusted',
          case when p_amount > 0 then 'Premio de ' || p_amount || ' diamantes para ' || v_name
               else 'Ajuste de ' || p_amount || ' diamantes para ' || v_name end,
          jsonb_build_object('amount', p_amount, 'reason', trim(p_reason), 'new_balance', v_balance));

  return jsonb_build_object('diamonds', v_balance);
end;
$$;

create or replace function public.admin_set_student_active(
  p_student_id uuid,
  p_is_active boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_name text;
begin
  if p_reason is not null and char_length(trim(p_reason)) > 500 then
    raise exception 'El motivo no puede superar 500 caracteres';
  end if;

  select admin_profile.household_id, student_profile.display_name
    into v_household, v_name
  from public.profiles admin_profile
  join public.profiles student_profile
    on student_profile.id = p_student_id
   and student_profile.role = 'student'::public.user_role
   and student_profile.household_id = admin_profile.household_id
  where admin_profile.id = auth.uid() and admin_profile.role = 'admin'::public.user_role;

  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  perform set_config('academia.bypass_profile_guard', 'on', true);
  update public.profiles set is_active = p_is_active, updated_at = now() where id = p_student_id;

  insert into public.student_admin_details(student_id, status_reason, updated_at, updated_by)
  values (p_student_id, nullif(trim(p_reason), ''), now(), auth.uid())
  on conflict (student_id) do update
  set status_reason = excluded.status_reason, updated_at = now(), updated_by = auth.uid();

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id,
          case when p_is_active then 'student_activated' else 'student_deactivated' end,
          case when p_is_active then v_name || ' fue reactivado' else v_name || ' fue desactivado' end,
          jsonb_build_object('is_active', p_is_active, 'reason', nullif(trim(p_reason), '')));

  return jsonb_build_object('is_active', p_is_active, 'status_reason', nullif(trim(p_reason), ''));
end;
$$;

create or replace function public.admin_update_student_details(
  p_student_id uuid,
  p_guardian_name text,
  p_guardian_email text,
  p_admin_notes text,
  p_tags text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_email text := nullif(lower(trim(p_guardian_email)), '');
  v_name text := nullif(trim(p_guardian_name), '');
  v_notes text := nullif(trim(p_admin_notes), '');
  v_tags text[];
begin
  select admin_profile.household_id into v_household
  from public.profiles admin_profile
  join public.profiles student_profile
    on student_profile.id = p_student_id
   and student_profile.role = 'student'::public.user_role
   and student_profile.household_id = admin_profile.household_id
  where admin_profile.id = auth.uid() and admin_profile.role = 'admin'::public.user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  if v_name is not null and char_length(v_name) > 120 then raise exception 'El nombre es demasiado largo'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'El correo no es valido';
  end if;
  if v_notes is not null and char_length(v_notes) > 4000 then raise exception 'Las notas no pueden superar 4000 caracteres'; end if;

  select coalesce(array_agg(distinct left(trim(tag), 40)) filter (where nullif(trim(tag), '') is not null), '{}'::text[])
    into v_tags
  from unnest(coalesce(p_tags, '{}'::text[])) tag;
  if cardinality(v_tags) > 8 then raise exception 'Puedes guardar hasta 8 etiquetas'; end if;

  insert into public.student_admin_details(student_id, guardian_name, guardian_email, admin_notes, tags, updated_at, updated_by)
  values (p_student_id, v_name, v_email, v_notes, v_tags, now(), auth.uid())
  on conflict (student_id) do update
  set guardian_name = excluded.guardian_name,
      guardian_email = excluded.guardian_email,
      admin_notes = excluded.admin_notes,
      tags = excluded.tags,
      updated_at = now(),
      updated_by = auth.uid();

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary)
  values (v_household, auth.uid(), p_student_id, 'student_details_updated', 'Datos de seguimiento actualizados');

  return jsonb_build_object('guardian_name', v_name, 'guardian_email', v_email, 'admin_notes', v_notes, 'tags', v_tags);
end;
$$;

create or replace function public.admin_set_student_subjects(
  p_student_id uuid,
  p_subject_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_requested integer;
  v_valid integer;
begin
  select admin_profile.household_id into v_household
  from public.profiles admin_profile
  join public.profiles student_profile
    on student_profile.id = p_student_id
   and student_profile.role = 'student'::public.user_role
   and student_profile.household_id = admin_profile.household_id
  where admin_profile.id = auth.uid() and admin_profile.role = 'admin'::public.user_role;
  if v_household is null then raise exception 'Alumno no encontrado o sin permiso'; end if;

  select count(distinct id) into v_requested from unnest(coalesce(p_subject_ids, '{}'::uuid[])) id;
  select count(*) into v_valid from public.subjects s where s.id = any(coalesce(p_subject_ids, '{}'::uuid[])) and s.active;
  if v_requested <> v_valid then raise exception 'Hay materias invalidas o inactivas en la seleccion'; end if;

  delete from public.student_subjects where student_id = p_student_id;
  insert into public.student_subjects(student_id, subject_id)
  select p_student_id, id from unnest(coalesce(p_subject_ids, '{}'::uuid[])) id
  on conflict do nothing;

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  values (v_household, auth.uid(), p_student_id, 'subjects_updated',
          'Materias asignadas actualizadas', jsonb_build_object('subject_count', v_valid));

  return jsonb_build_object('subject_count', v_valid);
end;
$$;

create or replace function public.admin_mark_students_contacted(
  p_student_ids uuid[],
  p_channel text default 'email'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid;
  v_count integer;
begin
  select p.household_id into v_household from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'::public.user_role;
  if v_household is null then raise exception 'Acceso reservado al administrador'; end if;
  if p_channel not in ('email', 'telefono', 'whatsapp', 'otro') then raise exception 'Canal no valido'; end if;

  with valid_students as (
    select distinct p.id
    from public.profiles p
    where p.id = any(coalesce(p_student_ids, '{}'::uuid[]))
      and p.household_id = v_household
      and p.role = 'student'::public.user_role
  ), upserted as (
    insert into public.student_admin_details(student_id, last_contacted_at, updated_at, updated_by)
    select id, now(), now(), auth.uid() from valid_students
    on conflict (student_id) do update
    set last_contacted_at = now(), updated_at = now(), updated_by = auth.uid()
    returning student_id
  )
  select count(*) into v_count from upserted;

  insert into public.admin_activity_log(household_id, admin_id, student_id, action, summary, metadata)
  select v_household, auth.uid(), p.id, 'student_contacted',
         'Contacto registrado por ' || p_channel, jsonb_build_object('channel', p_channel)
  from public.profiles p
  where p.id = any(coalesce(p_student_ids, '{}'::uuid[]))
    and p.household_id = v_household and p.role = 'student'::public.user_role;

  return jsonb_build_object('contacted', v_count);
end;
$$;

revoke execute on function public.admin_students_overview() from public, anon;
revoke execute on function public.admin_dashboard_metrics() from public, anon;
revoke execute on function public.admin_student_detail(uuid) from public, anon;
revoke execute on function public.admin_adjust_student_diamonds(uuid, integer, text) from public, anon;
revoke execute on function public.admin_set_student_active(uuid, boolean, text) from public, anon;
revoke execute on function public.admin_update_student_details(uuid, text, text, text, text[]) from public, anon;
revoke execute on function public.admin_set_student_subjects(uuid, uuid[]) from public, anon;
revoke execute on function public.admin_mark_students_contacted(uuid[], text) from public, anon;

grant execute on function public.admin_students_overview() to authenticated;
grant execute on function public.admin_dashboard_metrics() to authenticated;
grant execute on function public.admin_student_detail(uuid) to authenticated;
grant execute on function public.admin_adjust_student_diamonds(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_student_active(uuid, boolean, text) to authenticated;
grant execute on function public.admin_update_student_details(uuid, text, text, text, text[]) to authenticated;
grant execute on function public.admin_set_student_subjects(uuid, uuid[]) to authenticated;
grant execute on function public.admin_mark_students_contacted(uuid[], text) to authenticated;

comment on table public.student_admin_details is 'Datos operativos privados del administrador sobre cada alumno.';
comment on table public.admin_activity_log is 'Registro inmutable y consultable de acciones administrativas.';
comment on function public.admin_adjust_student_diamonds(uuid, integer, text) is 'Ajusta diamantes de forma atomica, validada y auditada.';

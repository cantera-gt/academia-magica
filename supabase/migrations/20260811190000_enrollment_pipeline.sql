-- Pipeline seguro de solicitudes de matrícula.
create table if not exists public.enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('AM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  applicant_type text not null check (applicant_type in ('legal_guardian', 'adult_student')),
  contact_full_name text not null check (char_length(contact_full_name) between 2 and 160),
  contact_email text not null check (char_length(contact_email) <= 254),
  whatsapp_phone text not null check (char_length(whatsapp_phone) between 7 and 32),
  country text not null check (char_length(country) between 2 and 100),
  city text not null check (char_length(city) between 1 and 120),
  student_first_name text,
  student_last_name text,
  student_email text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'payment_pending', 'enrolled', 'not_interested')),
  payment_status text not null default 'not_started' check (payment_status in ('not_started', 'pending', 'paid', 'failed', 'refunded')),
  payment_provider text not null default 'paypal' check (payment_provider = 'paypal'),
  paypal_order_id text,
  tags text[] not null default '{}',
  admin_notes text,
  next_follow_up_at timestamptz,
  privacy_accepted_at timestamptz not null,
  privacy_version text not null default '2026-08-11',
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  source text not null default 'landing',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  sheet_sync_status text not null default 'pending' check (sheet_sync_status in ('pending', 'synced', 'failed')),
  sheet_synced_at timestamptz,
  sheet_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollment_guardian_student_fields check (
    (applicant_type = 'legal_guardian'
      and nullif(trim(student_first_name), '') is not null
      and nullif(trim(student_last_name), '') is not null)
    or
    (applicant_type = 'adult_student'
      and student_first_name is null
      and student_last_name is null
      and student_email is null)
  ),
  constraint enrollment_tags_limit check (cardinality(tags) <= 12),
  constraint enrollment_notes_limit check (admin_notes is null or char_length(admin_notes) <= 5000)
);

comment on table public.enrollment_applications is 'Solicitudes de matrícula y seguimiento comercial. Contiene datos personales y solo es visible para administradores.';
create index if not exists enrollment_applications_created_at_idx on public.enrollment_applications (created_at desc);
create index if not exists enrollment_applications_status_idx on public.enrollment_applications (status, created_at desc);
create index if not exists enrollment_applications_contact_email_idx on public.enrollment_applications (lower(contact_email));

alter table public.enrollment_applications enable row level security;
revoke all on table public.enrollment_applications from anon, authenticated;
grant select, update on table public.enrollment_applications to authenticated;

create policy enrollment_admin_read
on public.enrollment_applications for select to authenticated
using (public.is_admin());

create policy enrollment_admin_update
on public.enrollment_applications for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.submit_enrollment_application(
  p_applicant_type text,
  p_contact_full_name text,
  p_contact_email text,
  p_whatsapp_phone text,
  p_country text,
  p_city text,
  p_student_first_name text default null,
  p_student_last_name text default null,
  p_student_email text default null,
  p_privacy_accepted boolean default false,
  p_marketing_consent boolean default false,
  p_source text default 'landing',
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns table(id uuid, public_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_contact_email, '')));
  v_student_email text := nullif(lower(trim(coalesce(p_student_email, ''))), '');
  v_recent_count integer;
begin
  if p_applicant_type not in ('legal_guardian', 'adult_student') then
    raise exception 'Selecciona quién realiza la matrícula';
  end if;
  if char_length(trim(coalesce(p_contact_full_name, ''))) not between 2 and 160 then
    raise exception 'Indica el nombre y los apellidos';
  end if;
  if char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'El correo electrónico no es válido';
  end if;
  if char_length(trim(coalesce(p_whatsapp_phone, ''))) not between 7 and 32 then
    raise exception 'Indica un número de WhatsApp válido';
  end if;
  if char_length(trim(coalesce(p_country, ''))) not between 2 and 100
     or char_length(trim(coalesce(p_city, ''))) not between 1 and 120 then
    raise exception 'Indica el país y la ciudad';
  end if;
  if p_applicant_type = 'legal_guardian' and (
    char_length(trim(coalesce(p_student_first_name, ''))) not between 1 and 100
    or char_length(trim(coalesce(p_student_last_name, ''))) not between 1 and 120
  ) then
    raise exception 'Indica el nombre y los apellidos del alumno';
  end if;
  if v_student_email is not null and (char_length(v_student_email) > 254 or v_student_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'El correo del alumno no es válido';
  end if;
  if not p_privacy_accepted then
    raise exception 'Debes aceptar la política de privacidad';
  end if;

  select count(*) into v_recent_count
  from public.enrollment_applications e
  where lower(e.contact_email) = v_email and e.created_at >= now() - interval '24 hours';
  if v_recent_count >= 3 then
    raise exception 'Ya hemos recibido tu solicitud. Contactaremos contigo muy pronto';
  end if;

  return query
  insert into public.enrollment_applications (
    applicant_type, contact_full_name, contact_email, whatsapp_phone, country, city,
    student_first_name, student_last_name, student_email,
    privacy_accepted_at, marketing_consent, marketing_consent_at,
    source, utm_source, utm_medium, utm_campaign
  ) values (
    p_applicant_type,
    trim(p_contact_full_name), v_email, trim(p_whatsapp_phone), trim(p_country), trim(p_city),
    case when p_applicant_type = 'legal_guardian' then trim(p_student_first_name) else null end,
    case when p_applicant_type = 'legal_guardian' then trim(p_student_last_name) else null end,
    case when p_applicant_type = 'legal_guardian' then v_student_email else null end,
    now(), p_marketing_consent, case when p_marketing_consent then now() else null end,
    left(coalesce(nullif(trim(p_source), ''), 'landing'), 80),
    left(nullif(trim(p_utm_source), ''), 120),
    left(nullif(trim(p_utm_medium), ''), 120),
    left(nullif(trim(p_utm_campaign), ''), 120)
  )
  returning enrollment_applications.id, enrollment_applications.public_reference;
end;
$$;

revoke all on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,text,text,text,text) from public;
grant execute on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,text,text,text,text) to anon, authenticated;

create or replace function public.admin_update_enrollment_application(
  p_id uuid,
  p_status text,
  p_payment_status text,
  p_tags text[],
  p_admin_notes text,
  p_next_follow_up_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tags text[];
  v_updated public.enrollment_applications;
begin
  if not public.is_admin() then raise exception 'Acceso reservado al administrador'; end if;
  if p_status not in ('new', 'contacted', 'qualified', 'payment_pending', 'enrolled', 'not_interested') then raise exception 'Estado no válido'; end if;
  if p_payment_status not in ('not_started', 'pending', 'paid', 'failed', 'refunded') then raise exception 'Estado de pago no válido'; end if;
  if char_length(coalesce(p_admin_notes, '')) > 5000 then raise exception 'Las notas son demasiado largas'; end if;
  select coalesce(array_agg(distinct left(trim(tag), 40)) filter (where nullif(trim(tag), '') is not null), '{}')
    into v_tags from unnest(coalesce(p_tags, '{}')) tag;
  if cardinality(v_tags) > 12 then raise exception 'Puedes guardar hasta 12 etiquetas'; end if;

  update public.enrollment_applications
  set status = p_status, payment_status = p_payment_status, tags = v_tags,
      admin_notes = nullif(trim(p_admin_notes), ''), next_follow_up_at = p_next_follow_up_at,
      updated_at = now()
  where enrollment_applications.id = p_id
  returning * into v_updated;
  if v_updated.id is null then raise exception 'Solicitud no encontrada'; end if;
  return to_jsonb(v_updated);
end;
$$;

revoke all on function public.admin_update_enrollment_application(uuid,text,text,text[],text,timestamptz) from public;
grant execute on function public.admin_update_enrollment_application(uuid,text,text,text[],text,timestamptz) to authenticated;
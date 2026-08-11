-- Selección de materias y fotografía inmutable del precio de cada matrícula.
alter table public.enrollment_applications
  add column if not exists subject_count smallint,
  add column if not exists unit_price_usd numeric(10,2),
  add column if not exists total_price_usd numeric(10,2),
  add column if not exists currency text not null default 'USD',
  add column if not exists access_months smallint not null default 3;

alter table public.enrollment_applications
  drop constraint if exists enrollment_subject_pricing_complete,
  add constraint enrollment_subject_pricing_complete check (
    (subject_count is null and unit_price_usd is null and total_price_usd is null)
    or
    (subject_count between 1 and 100
      and unit_price_usd in (6, 7, 8, 10)
      and total_price_usd = subject_count * unit_price_usd)
  ),
  drop constraint if exists enrollment_currency_usd,
  add constraint enrollment_currency_usd check (currency = 'USD'),
  drop constraint if exists enrollment_access_months_three,
  add constraint enrollment_access_months_three check (access_months = 3);

create table if not exists public.enrollment_application_subjects (
  application_id uuid not null references public.enrollment_applications(id) on delete cascade,
  subject_id uuid not null,
  subject_slug text not null,
  subject_name text not null,
  subject_icon text,
  subject_category text not null,
  unit_price_usd numeric(10,2) not null check (unit_price_usd in (6, 7, 8, 10)),
  created_at timestamptz not null default now(),
  primary key (application_id, subject_id)
);

comment on table public.enrollment_application_subjects is
  'Materias solicitadas y nombre/precio congelados en el momento de la matrícula.';

alter table public.enrollment_application_subjects enable row level security;
revoke all on table public.enrollment_application_subjects from anon, authenticated;
grant select on table public.enrollment_application_subjects to authenticated;

drop policy if exists enrollment_subjects_admin_read on public.enrollment_application_subjects;
create policy enrollment_subjects_admin_read
on public.enrollment_application_subjects for select to authenticated
using (public.is_admin());

drop function if exists public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,text,text,text,text);

create or replace function public.submit_enrollment_application(
  p_applicant_type text,
  p_contact_full_name text,
  p_contact_email text,
  p_whatsapp_phone text,
  p_country text,
  p_city text,
  p_subject_ids uuid[],
  p_student_first_name text default null,
  p_student_last_name text default null,
  p_student_email text default null,
  p_privacy_accepted boolean default false,
  p_terms_accepted boolean default false,
  p_marketing_consent boolean default false,
  p_source text default 'landing',
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns table(
  id uuid,
  public_reference text,
  subject_count smallint,
  unit_price_usd numeric,
  total_price_usd numeric,
  currency text,
  access_months smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_contact_email, '')));
  v_student_email text := nullif(lower(trim(coalesce(p_student_email, ''))), '');
  v_recent_count integer;
  v_requested_count integer;
  v_active_count integer;
  v_unit_price numeric(10,2);
  v_application_id uuid;
  v_public_reference text;
begin
  if p_applicant_type not in ('legal_guardian', 'adult_student') then raise exception 'Selecciona quién realiza la matrícula'; end if;
  if char_length(trim(coalesce(p_contact_full_name, ''))) not between 2 and 160 then raise exception 'Indica el nombre y los apellidos'; end if;
  if char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'El correo electrónico no es válido'; end if;
  if char_length(trim(coalesce(p_whatsapp_phone, ''))) not between 7 and 32 then raise exception 'Indica un número de WhatsApp válido'; end if;
  if char_length(trim(coalesce(p_country, ''))) not between 2 and 100 or char_length(trim(coalesce(p_city, ''))) not between 1 and 120 then raise exception 'Indica el país y la ciudad'; end if;
  if p_applicant_type = 'legal_guardian' and (char_length(trim(coalesce(p_student_first_name, ''))) not between 1 and 100 or char_length(trim(coalesce(p_student_last_name, ''))) not between 1 and 120) then raise exception 'Indica el nombre y los apellidos del alumno'; end if;
  if v_student_email is not null and (char_length(v_student_email) > 254 or v_student_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'El correo del alumno no es válido'; end if;
  if not p_privacy_accepted then raise exception 'Debes aceptar la política de privacidad'; end if;
  if not p_terms_accepted then raise exception 'Debes aceptar las condiciones de matrícula'; end if;

  select count(distinct requested_id) into v_requested_count
  from unnest(coalesce(p_subject_ids, '{}'::uuid[])) as requested(requested_id);
  if v_requested_count < 1 then raise exception 'Selecciona al menos una materia'; end if;

  select count(*) into v_active_count
  from public.subjects s
  where s.active = true and s.id = any(p_subject_ids);
  if v_active_count <> v_requested_count then
    raise exception 'Una de las materias seleccionadas ya no está disponible';
  end if;

  v_unit_price := case
    when v_requested_count <= 3 then 10
    when v_requested_count <= 6 then 8
    when v_requested_count <= 10 then 7
    else 6
  end;

  select count(*) into v_recent_count
  from public.enrollment_applications e
  where lower(e.contact_email) = v_email and e.created_at >= now() - interval '24 hours';
  if v_recent_count >= 3 then raise exception 'Ya hemos recibido tu solicitud. Contactaremos contigo muy pronto'; end if;

  insert into public.enrollment_applications (
    applicant_type, contact_full_name, contact_email, whatsapp_phone, country, city,
    student_first_name, student_last_name, student_email, privacy_accepted_at,
    terms_accepted_at, marketing_consent, marketing_consent_at, source,
    utm_source, utm_medium, utm_campaign, subject_count, unit_price_usd,
    total_price_usd, currency, access_months
  ) values (
    p_applicant_type, trim(p_contact_full_name), v_email, trim(p_whatsapp_phone), trim(p_country), trim(p_city),
    case when p_applicant_type = 'legal_guardian' then trim(p_student_first_name) else null end,
    case when p_applicant_type = 'legal_guardian' then trim(p_student_last_name) else null end,
    case when p_applicant_type = 'legal_guardian' then v_student_email else null end,
    now(), now(), p_marketing_consent, case when p_marketing_consent then now() else null end,
    left(coalesce(nullif(trim(p_source), ''), 'landing'), 80), left(nullif(trim(p_utm_source), ''), 120),
    left(nullif(trim(p_utm_medium), ''), 120), left(nullif(trim(p_utm_campaign), ''), 120),
    v_requested_count, v_unit_price, v_requested_count * v_unit_price, 'USD', 3
  )
  returning enrollment_applications.id, enrollment_applications.public_reference
  into v_application_id, v_public_reference;

  insert into public.enrollment_application_subjects (
    application_id, subject_id, subject_slug, subject_name, subject_icon,
    subject_category, unit_price_usd
  )
  select v_application_id, s.id, s.slug, s.name, s.icon, s.category, v_unit_price
  from public.subjects s
  where s.active = true and s.id = any(p_subject_ids)
  order by s.sort_order, s.name;

  return query select v_application_id, v_public_reference, v_requested_count::smallint,
    v_unit_price, v_requested_count * v_unit_price, 'USD'::text, 3::smallint;
end;
$$;

revoke all on function public.submit_enrollment_application(text,text,text,text,text,text,uuid[],text,text,text,boolean,boolean,boolean,text,text,text,text) from public;
grant execute on function public.submit_enrollment_application(text,text,text,text,text,text,uuid[],text,text,text,boolean,boolean,boolean,text,text,text,text) to anon, authenticated;

alter table public.enrollment_applications
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text not null default '2026-08-11';

drop function if exists public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,text,text,text,text);

create or replace function public.submit_enrollment_application(
  p_applicant_type text, p_contact_full_name text, p_contact_email text,
  p_whatsapp_phone text, p_country text, p_city text,
  p_student_first_name text default null, p_student_last_name text default null,
  p_student_email text default null, p_privacy_accepted boolean default false,
  p_terms_accepted boolean default false, p_marketing_consent boolean default false,
  p_source text default 'landing', p_utm_source text default null,
  p_utm_medium text default null, p_utm_campaign text default null
)
returns table(id uuid, public_reference text)
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_contact_email, '')));
  v_student_email text := nullif(lower(trim(coalesce(p_student_email, ''))), '');
  v_recent_count integer;
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

  select count(*) into v_recent_count from public.enrollment_applications e where lower(e.contact_email) = v_email and e.created_at >= now() - interval '24 hours';
  if v_recent_count >= 3 then raise exception 'Ya hemos recibido tu solicitud. Contactaremos contigo muy pronto'; end if;

  return query insert into public.enrollment_applications (
    applicant_type, contact_full_name, contact_email, whatsapp_phone, country, city,
    student_first_name, student_last_name, student_email, privacy_accepted_at,
    terms_accepted_at, marketing_consent, marketing_consent_at, source,
    utm_source, utm_medium, utm_campaign
  ) values (
    p_applicant_type, trim(p_contact_full_name), v_email, trim(p_whatsapp_phone), trim(p_country), trim(p_city),
    case when p_applicant_type = 'legal_guardian' then trim(p_student_first_name) else null end,
    case when p_applicant_type = 'legal_guardian' then trim(p_student_last_name) else null end,
    case when p_applicant_type = 'legal_guardian' then v_student_email else null end,
    now(), now(), p_marketing_consent, case when p_marketing_consent then now() else null end,
    left(coalesce(nullif(trim(p_source), ''), 'landing'), 80), left(nullif(trim(p_utm_source), ''), 120),
    left(nullif(trim(p_utm_medium), ''), 120), left(nullif(trim(p_utm_campaign), ''), 120)
  ) returning enrollment_applications.id, enrollment_applications.public_reference;
end;
$$;

revoke all on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,text,text,text,text) from public;
grant execute on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,text,text,text,text) to anon, authenticated;

alter table public.enrollment_applications alter column terms_accepted_at set not null;
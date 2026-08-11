-- Pago PayPal ligado a una matrícula mediante un token público no adivinable.
alter table public.enrollment_applications
  add column if not exists payment_token uuid not null default gen_random_uuid(),
  add column if not exists paypal_capture_id text,
  add column if not exists paypal_paid_at timestamptz;

create unique index if not exists enrollment_payment_token_idx
  on public.enrollment_applications(payment_token);
create unique index if not exists enrollment_paypal_order_idx
  on public.enrollment_applications(paypal_order_id)
  where paypal_order_id is not null;
create unique index if not exists enrollment_paypal_capture_idx
  on public.enrollment_applications(paypal_capture_id)
  where paypal_capture_id is not null;

create or replace function public.get_enrollment_payment_summary(
  p_public_reference text,
  p_payment_token uuid
)
returns table (
  public_reference text,
  subject_count smallint,
  total_price_usd numeric,
  currency text,
  access_months smallint,
  payment_status text,
  subject_names text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.public_reference, e.subject_count, e.total_price_usd, e.currency,
         e.access_months, e.payment_status,
         coalesce(array_agg(s.subject_name order by s.created_at)
           filter (where s.subject_name is not null), '{}')::text[]
  from public.enrollment_applications e
  left join public.enrollment_application_subjects s on s.application_id = e.id
  where e.public_reference = p_public_reference
    and e.payment_token = p_payment_token
  group by e.id;
$$;

create or replace function public.register_enrollment_paypal_order(
  p_public_reference text,
  p_payment_token uuid,
  p_paypal_order_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if char_length(trim(coalesce(p_paypal_order_id, ''))) not between 8 and 80 then
    raise exception 'Identificador de PayPal no válido';
  end if;

  update public.enrollment_applications
  set paypal_order_id = trim(p_paypal_order_id),
      payment_status = 'pending',
      status = case when status = 'new' then 'payment_pending' else status end,
      updated_at = now()
  where public_reference = p_public_reference
    and payment_token = p_payment_token
    and payment_status in ('not_started', 'pending')
    and (paypal_order_id is null or paypal_order_id = trim(p_paypal_order_id));

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'No se pudo vincular la orden de PayPal'; end if;
  return true;
end;
$$;

create or replace function public.complete_enrollment_paypal_order(
  p_public_reference text,
  p_payment_token uuid,
  p_paypal_order_id text,
  p_paypal_capture_id text,
  p_captured_amount numeric,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.enrollment_applications;
begin
  select * into v_application
  from public.enrollment_applications
  where public_reference = p_public_reference
    and payment_token = p_payment_token
  for update;

  if v_application.id is null then raise exception 'Matrícula no encontrada'; end if;

  if v_application.payment_status = 'paid' then
    if v_application.paypal_order_id = p_paypal_order_id
       and v_application.paypal_capture_id = p_paypal_capture_id then
      return true;
    end if;
    raise exception 'La matrícula ya tiene otro pago confirmado';
  end if;

  if v_application.paypal_order_id is distinct from p_paypal_order_id then
    raise exception 'La orden de PayPal no coincide';
  end if;
  if v_application.total_price_usd is distinct from p_captured_amount
     or v_application.currency is distinct from upper(p_currency) then
    raise exception 'El importe capturado no coincide con la matrícula';
  end if;
  if char_length(trim(coalesce(p_paypal_capture_id, ''))) not between 8 and 80 then
    raise exception 'Captura de PayPal no válida';
  end if;

  update public.enrollment_applications
  set paypal_capture_id = trim(p_paypal_capture_id),
      paypal_paid_at = now(),
      payment_status = 'paid',
      status = 'enrolled',
      updated_at = now()
  where id = v_application.id;

  return true;
end;
$$;

revoke all on function public.get_enrollment_payment_summary(text,uuid) from public;
revoke all on function public.register_enrollment_paypal_order(text,uuid,text) from public;
revoke all on function public.complete_enrollment_paypal_order(text,uuid,text,text,numeric,text) from public;
grant execute on function public.get_enrollment_payment_summary(text,uuid) to anon, authenticated;
grant execute on function public.register_enrollment_paypal_order(text,uuid,text) to anon, authenticated;
grant execute on function public.complete_enrollment_paypal_order(text,uuid,text,text,numeric,text) to anon, authenticated;

drop function if exists public.submit_enrollment_application(text,text,text,text,text,text,uuid[],text,text,text,boolean,boolean,boolean,text,text,text,text);

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
  payment_token uuid,
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
  v_payment_token uuid;
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

  select count(*) into v_active_count from public.subjects s
  where s.active = true and s.id = any(p_subject_ids);
  if v_active_count <> v_requested_count then raise exception 'Una de las materias seleccionadas ya no está disponible'; end if;

  v_unit_price := case when v_requested_count <= 3 then 10 when v_requested_count <= 6 then 8 when v_requested_count <= 10 then 7 else 6 end;

  select count(*) into v_recent_count from public.enrollment_applications e
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
  returning enrollment_applications.id, enrollment_applications.public_reference, enrollment_applications.payment_token
  into v_application_id, v_public_reference, v_payment_token;

  insert into public.enrollment_application_subjects (
    application_id, subject_id, subject_slug, subject_name, subject_icon,
    subject_category, unit_price_usd
  )
  select v_application_id, s.id, s.slug, s.name, s.icon, s.category, v_unit_price
  from public.subjects s where s.active = true and s.id = any(p_subject_ids)
  order by s.sort_order, s.name;

  return query select v_application_id, v_public_reference, v_payment_token,
    v_requested_count::smallint, v_unit_price, v_requested_count * v_unit_price,
    'USD'::text, 3::smallint;
end;
$$;

revoke all on function public.submit_enrollment_application(text,text,text,text,text,text,uuid[],text,text,text,boolean,boolean,boolean,text,text,text,text) from public;
grant execute on function public.submit_enrollment_application(text,text,text,text,text,text,uuid[],text,text,text,boolean,boolean,boolean,text,text,text,text) to anon, authenticated;

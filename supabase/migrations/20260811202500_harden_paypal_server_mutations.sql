-- Endurece las mutaciones de pago: solo el servidor de Academia Mágica conoce el secreto.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.payment_server_secrets (
  secret_hash text primary key,
  created_at timestamptz not null default now()
);
revoke all on table private.payment_server_secrets from public, anon, authenticated;
insert into private.payment_server_secrets(secret_hash)
values ('2906b4c492bdf7a616674f25780ce5437ff523e7eb5f5ead11755c8416923370')
on conflict do nothing;

drop function if exists public.register_enrollment_paypal_order(text,uuid,text);
drop function if exists public.complete_enrollment_paypal_order(text,uuid,text,text,numeric,text);

create function public.register_enrollment_paypal_order(
  p_public_reference text,
  p_payment_token uuid,
  p_paypal_order_id text,
  p_server_secret text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;
  if char_length(trim(coalesce(p_paypal_order_id, ''))) not between 8 and 80 then
    raise exception 'Identificador de PayPal no válido';
  end if;

  update public.enrollment_applications
  set paypal_order_id = trim(p_paypal_order_id), payment_status = 'pending',
      status = case when status = 'new' then 'payment_pending' else status end,
      updated_at = now()
  where public_reference = p_public_reference and payment_token = p_payment_token
    and payment_status in ('not_started', 'pending')
    and (paypal_order_id is null or paypal_order_id = trim(p_paypal_order_id));

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'No se pudo vincular la orden de PayPal'; end if;
  return true;
end;
$$;

create function public.complete_enrollment_paypal_order(
  p_public_reference text,
  p_payment_token uuid,
  p_paypal_order_id text,
  p_paypal_capture_id text,
  p_captured_amount numeric,
  p_currency text,
  p_server_secret text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.enrollment_applications;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;

  select * into v_application from public.enrollment_applications
  where public_reference = p_public_reference and payment_token = p_payment_token
  for update;
  if v_application.id is null then raise exception 'Matrícula no encontrada'; end if;

  if v_application.payment_status = 'paid' then
    if v_application.paypal_order_id = p_paypal_order_id
       and v_application.paypal_capture_id = p_paypal_capture_id then return true; end if;
    raise exception 'La matrícula ya tiene otro pago confirmado';
  end if;
  if v_application.paypal_order_id is distinct from p_paypal_order_id then raise exception 'La orden de PayPal no coincide'; end if;
  if v_application.total_price_usd is distinct from p_captured_amount
     or v_application.currency is distinct from upper(p_currency) then raise exception 'El importe capturado no coincide con la matrícula'; end if;
  if char_length(trim(coalesce(p_paypal_capture_id, ''))) not between 8 and 80 then raise exception 'Captura de PayPal no válida'; end if;

  update public.enrollment_applications
  set paypal_capture_id = trim(p_paypal_capture_id), paypal_paid_at = now(),
      payment_status = 'paid', status = 'enrolled', updated_at = now()
  where id = v_application.id;
  return true;
end;
$$;

revoke all on function public.register_enrollment_paypal_order(text,uuid,text,text) from public;
revoke all on function public.complete_enrollment_paypal_order(text,uuid,text,text,numeric,text,text) from public;
grant execute on function public.register_enrollment_paypal_order(text,uuid,text,text) to anon, authenticated;
grant execute on function public.complete_enrollment_paypal_order(text,uuid,text,text,numeric,text,text) to anon, authenticated;

-- Conciliación idempotente de eventos PayPal verificados por el servidor.
create table if not exists private.paypal_webhook_events (
  event_id text primary key,
  event_type text not null,
  resource_id text,
  order_id text,
  application_id uuid references public.enrollment_applications(id) on delete set null,
  processing_status text not null default 'received'
    check (processing_status in ('received','processed','ignored','failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
revoke all on table private.paypal_webhook_events from public, anon, authenticated;

create index if not exists paypal_webhook_events_received_idx
  on private.paypal_webhook_events(received_at desc);
create index if not exists paypal_webhook_events_application_idx
  on private.paypal_webhook_events(application_id, received_at desc);

create or replace function public.process_enrollment_paypal_webhook(
  p_event_id text,
  p_event_type text,
  p_resource_id text,
  p_order_id text,
  p_capture_id text,
  p_amount numeric,
  p_currency text,
  p_server_secret text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_application public.enrollment_applications;
  v_inserted text;
begin
  if not exists (
    select 1 from private.payment_server_secrets
    where secret_hash = encode(extensions.digest(p_server_secret, 'sha256'), 'hex')
  ) then raise exception 'Servidor de pagos no autorizado'; end if;

  if char_length(trim(coalesce(p_event_id, ''))) not between 8 and 100
     or char_length(trim(coalesce(p_event_type, ''))) not between 3 and 120 then
    raise exception 'Evento PayPal no válido';
  end if;

  insert into private.paypal_webhook_events(
    event_id, event_type, resource_id, order_id
  ) values (
    trim(p_event_id), trim(p_event_type), nullif(trim(p_resource_id), ''),
    nullif(trim(p_order_id), '')
  )
  on conflict (event_id) do nothing
  returning event_id into v_inserted;

  if v_inserted is null then return 'duplicate'; end if;

  select * into v_application
  from public.enrollment_applications
  where (nullif(trim(p_order_id), '') is not null and paypal_order_id = trim(p_order_id))
     or (nullif(trim(p_capture_id), '') is not null and paypal_capture_id = trim(p_capture_id))
  order by created_at desc
  limit 1
  for update;

  if v_application.id is null then
    update private.paypal_webhook_events
    set processing_status = 'ignored', processed_at = now(),
        error_message = 'No matching enrollment'
    where event_id = trim(p_event_id);
    return 'ignored';
  end if;

  if p_event_type = 'PAYMENT.CAPTURE.COMPLETED' then
    if v_application.total_price_usd is distinct from p_amount
       or v_application.currency is distinct from upper(p_currency)
       or nullif(trim(p_resource_id), '') is null then
      update private.paypal_webhook_events
      set application_id = v_application.id, processing_status = 'failed',
          processed_at = now(), error_message = 'Amount, currency or capture mismatch'
      where event_id = trim(p_event_id);
      raise exception 'El pago de PayPal no coincide con la matrícula';
    end if;

    update public.enrollment_applications
    set paypal_capture_id = trim(p_resource_id), paypal_paid_at = coalesce(paypal_paid_at, now()),
        payment_status = 'paid', status = 'enrolled', updated_at = now()
    where id = v_application.id
      and (paypal_capture_id is null or paypal_capture_id = trim(p_resource_id));

  elsif p_event_type in ('PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED') then
    update public.enrollment_applications
    set payment_status = 'failed', updated_at = now()
    where id = v_application.id and payment_status <> 'paid';

  elsif p_event_type = 'PAYMENT.CAPTURE.PENDING' then
    update public.enrollment_applications
    set payment_status = 'pending', status = 'payment_pending', updated_at = now()
    where id = v_application.id and payment_status <> 'paid';

  elsif p_event_type in ('PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED') then
    update public.enrollment_applications
    set payment_status = 'refunded', status = 'not_interested', updated_at = now()
    where id = v_application.id;

  else
    update private.paypal_webhook_events
    set application_id = v_application.id, processing_status = 'ignored',
        processed_at = now(), error_message = 'Event type not actionable'
    where event_id = trim(p_event_id);
    return 'ignored';
  end if;

  update private.paypal_webhook_events
  set application_id = v_application.id, processing_status = 'processed',
      processed_at = now(), error_message = null
  where event_id = trim(p_event_id);

  return 'processed';
exception when others then
  update private.paypal_webhook_events
  set processing_status = 'failed', processed_at = now(),
      error_message = left(sqlerrm, 500)
  where event_id = trim(coalesce(p_event_id, ''));
  raise;
end;
$$;

revoke all on function public.process_enrollment_paypal_webhook(text,text,text,text,text,numeric,text,text) from public;
grant execute on function public.process_enrollment_paypal_webhook(text,text,text,text,text,numeric,text,text) to anon, authenticated;

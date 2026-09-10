-- Captura de email en la landing para visitantes que no se matriculan todavia
-- (componente src/components/landing-lead-capture.tsx, 20/08/2026).
--
-- Estos objetos YA EXISTEN en produccion: se aplicaron a mano en el SQL Editor
-- y este archivo los registra en el repo. Todo es idempotente, asi que volver a
-- ejecutarlo sobre la base actual no cambia nada.

-- 1) Tabla de leads. Un mismo email puede llegar por varias fuentes, pero solo
-- una fila por (email, source): si repite, se refresca created_at.
create table if not exists public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing'::text,
  note text,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists landing_leads_email_source_idx
  on public.landing_leads using btree (email, source);

create index if not exists landing_leads_created_at_idx
  on public.landing_leads using btree (created_at desc);

-- 2) RLS: la tabla contiene datos de contacto de terceros, asi que nadie la lee
-- salvo un administrador. La escritura entra unicamente por la RPC de abajo.
alter table public.landing_leads enable row level security;

drop policy if exists landing_leads_admin_read on public.landing_leads;
create policy landing_leads_admin_read on public.landing_leads
  as permissive for select to authenticated
  using (is_admin());

revoke all on public.landing_leads from anon, authenticated;
grant select on public.landing_leads to authenticated;

-- 3) RPC publica: valida el correo, limita a 300 altas por hora para que un bot
-- no llene la tabla, y normaliza source y note.
CREATE OR REPLACE FUNCTION public.submit_landing_lead(p_email text, p_source text DEFAULT 'landing'::text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_recent_count integer;
begin
  if char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'El correo electronico no es valido';
  end if;

  select count(*) into v_recent_count
  from public.landing_leads l
  where l.created_at >= now() - interval '1 hour';
  if v_recent_count >= 300 then
    raise exception 'Estamos recibiendo muchas solicitudes. Intentalo en unos minutos';
  end if;

  insert into public.landing_leads (email, source, note)
  values (
    v_email,
    left(coalesce(nullif(trim(p_source), ''), 'landing'), 80),
    left(nullif(trim(p_note), ''), 500)
  )
  on conflict (email, source) do update set created_at = now();

  return jsonb_build_object('ok', true);
end;
$function$;

grant execute on function public.submit_landing_lead(text, text, text)
  to anon, authenticated, service_role;

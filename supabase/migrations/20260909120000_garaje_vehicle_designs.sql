-- Garaje del alumno: coche por piezas que se compran en la tienda, se montan y
-- se pintan (/alumno/garaje, src/lib/vehicle.ts, 09/09/2026).
--
-- Estos objetos YA EXISTEN en produccion: se aplicaron a mano en el SQL Editor
-- y este archivo los registra en el repo. Todo es idempotente, asi que volver a
-- ejecutarlo sobre la base actual no cambia nada.

-- 1) El garaje es una zona mas de la tienda, junto a habitacion, estudio y jardin.
alter type public.item_zone add value if not exists 'garaje';

-- 2) Cada articulo de la zona garaje describe que pieza del coche es (slot) y
-- cual de sus variantes (variant). El resto de zonas los deja en null.
alter table public.store_items
  add column if not exists vehicle_slot text,
  add column if not exists vehicle_variant text;

-- 3) Un diseno guardado por alumno: piezas montadas, colores y matricula.
create table if not exists public.vehicle_designs (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  design jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

-- RLS: cada alumno solo ve y escribe su propio diseno. La tabla conserva los
-- grants por defecto de Supabase; quien decide el acceso real son las politicas.
alter table public.vehicle_designs enable row level security;

drop policy if exists vehicle_designs_select_own on public.vehicle_designs;
create policy vehicle_designs_select_own on public.vehicle_designs
  as permissive for select to public
  using (student_id = auth.uid());

drop policy if exists vehicle_designs_insert_own on public.vehicle_designs;
create policy vehicle_designs_insert_own on public.vehicle_designs
  as permissive for insert to public
  with check (student_id = auth.uid());

drop policy if exists vehicle_designs_update_own on public.vehicle_designs;
create policy vehicle_designs_update_own on public.vehicle_designs
  as permissive for update to public
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- 4) Lectura: el diseno guardado mas la lista de piezas que el alumno ya posee,
-- en formato "slot:variant".
CREATE OR REPLACE FUNCTION public.my_garage()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_design jsonb;
  v_owned jsonb;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select design into v_design from vehicle_designs where student_id = v_uid;

  select coalesce(
           jsonb_agg(distinct si.vehicle_slot || ':' || si.vehicle_variant),
           '[]'::jsonb
         )
    into v_owned
  from student_inventory inv
  join store_items si on si.id = inv.item_id
  where inv.student_id = v_uid
    and si.vehicle_slot is not null
    and si.vehicle_variant is not null;

  return jsonb_build_object(
    'design', coalesce(v_design, '{}'::jsonb),
    'owned', v_owned
  );
end;
$function$;

-- 5) Guardado: el servidor vuelve a comprobar que cada pieza montada esta
-- comprada, para que el navegador no pueda regalarse piezas. Si la pieza no
-- existe en la tienda se deja pasar (piezas base que vienen de serie).
CREATE OR REPLACE FUNCTION public.save_vehicle_design(p_design jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_slot text;
  v_variant text;
  v_item uuid;
  v_matricula text;
  v_clean jsonb;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  if p_design is null or jsonb_typeof(p_design) <> 'object' then
    raise exception 'Diseño no válido';
  end if;

  if pg_column_size(p_design) > 4000 then
    raise exception 'Diseño demasiado grande';
  end if;

  for v_slot, v_variant in
    select key, value #>> '{}'
    from jsonb_each(coalesce(p_design -> 'parts', '{}'::jsonb))
  loop
    select si.id into v_item
    from store_items si
    where si.zone = 'garaje'
      and si.active
      and si.vehicle_slot = v_slot
      and si.vehicle_variant = v_variant
    limit 1;

    if v_item is not null and not exists (
      select 1 from student_inventory inv
      where inv.student_id = v_uid and inv.item_id = v_item
    ) then
      raise exception 'Todavía no tienes esta pieza en tu garaje';
    end if;
  end loop;

  -- Matricula: como maximo 10 caracteres y solo letras, numeros y espacios.
  v_matricula := upper(btrim(coalesce(p_design ->> 'matricula', '')));
  v_matricula := regexp_replace(v_matricula, '[^A-Z0-9ÁÉÍÓÚÑ ]', '', 'g');
  v_matricula := left(v_matricula, 10);
  v_clean := jsonb_set(p_design, '{matricula}', to_jsonb(v_matricula));

  insert into vehicle_designs (student_id, design, updated_at)
  values (v_uid, v_clean, now())
  on conflict (student_id) do update
    set design = excluded.design, updated_at = now();

  return v_clean;
end;
$function$;

grant execute on function public.my_garage() to anon, authenticated, service_role;
grant execute on function public.save_vehicle_design(jsonb) to anon, authenticated, service_role;

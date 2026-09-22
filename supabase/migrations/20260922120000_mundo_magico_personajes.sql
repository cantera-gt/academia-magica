-- Mundo Magico: el personaje del alumno, que viste y pinta (/alumno/mundo-magico).
--
-- Hermano del garaje y con la misma forma: una fila por alumno con un jsonb
-- libre. Se guarda {hero, outfit, colors, nombre}; el catalogo de personajes,
-- prendas y colores de fabrica vive en el codigo (src/lib/heroes.ts), no aqui,
-- porque son recursos graficos y no datos de negocio.
--
-- Pintar es gratis, igual que en el garaje: no hay items de tienda asociados y
-- por tanto no hay nada que validar contra student_inventory. Lo que paga
-- diamantes es guardar el personaje, via finish_game, como cualquier otro juego.

create table if not exists public.hero_designs (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  design jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

-- RLS: cada alumno solo ve y escribe el suyo.
alter table public.hero_designs enable row level security;

drop policy if exists hero_designs_select_own on public.hero_designs;
create policy hero_designs_select_own on public.hero_designs
  as permissive for select to public
  using (student_id = auth.uid());

drop policy if exists hero_designs_write_own on public.hero_designs;
create policy hero_designs_write_own on public.hero_designs
  as permissive for all to public
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Lectura: el diseno guardado, o un objeto vacio si el alumno no ha entrado aun.
CREATE OR REPLACE FUNCTION public.my_hero()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  v_uid uuid := auth.uid();
  v_design jsonb;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select design into v_design from hero_designs where student_id = v_uid;

  return jsonb_build_object('design', coalesce(v_design, '{}'::jsonb));
end;
$$;

-- Guardado. El nombre del personaje se limpia aqui y no en el navegador: es la
-- unica capa por la que no se puede pasar de largo.
CREATE OR REPLACE FUNCTION public.save_hero_design(p_design jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
declare
  v_uid uuid := auth.uid();
  v_nombre text;
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

  v_nombre := btrim(coalesce(p_design ->> 'nombre', ''));
  v_nombre := regexp_replace(v_nombre, '[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]', '', 'g');
  v_nombre := left(v_nombre, 14);
  v_clean := jsonb_set(p_design, '{nombre}', to_jsonb(v_nombre));

  insert into hero_designs (student_id, design, updated_at)
  values (v_uid, v_clean, now())
  on conflict (student_id) do update
    set design = excluded.design, updated_at = now();

  return v_clean;
end;
$$;

grant execute on function public.my_hero() to anon, authenticated, service_role;
grant execute on function public.save_hero_design(jsonb) to anon, authenticated, service_role;

-- Para revertir:
--   drop function if exists public.save_hero_design(jsonb);
--   drop function if exists public.my_hero();
--   drop table if exists public.hero_designs;

-- Catálogo público mínimo para el formulario de matrícula.
-- Conserva la tabla subjects protegida por RLS y expone solo materias activas.
create or replace function public.get_enrollment_subject_catalog()
returns table (
  id uuid,
  slug text,
  name text,
  category text,
  icon text,
  color text,
  sort_order integer,
  active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.slug, s.name, s.category, s.icon, s.color, s.sort_order, s.active
  from public.subjects s
  where s.active = true
  order by s.sort_order, s.name;
$$;

revoke all on function public.get_enrollment_subject_catalog() from public;
grant execute on function public.get_enrollment_subject_catalog() to anon, authenticated;

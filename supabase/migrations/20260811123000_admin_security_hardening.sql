-- Segunda revision del panel: endurecimiento de permisos y de integridad.

revoke execute on function public.admin_backup_and_delete_student(uuid) from public, anon;
grant execute on function public.admin_backup_and_delete_student(uuid) to authenticated;

-- Es una funcion de trigger interna: ningun cliente necesita invocarla por RPC.
revoke execute on function public.guard_profile_self_update() from public, anon, authenticated;

alter table public.profiles
  drop constraint if exists profiles_diamonds_nonnegative;
alter table public.profiles
  add constraint profiles_diamonds_nonnegative check (diamonds >= 0);

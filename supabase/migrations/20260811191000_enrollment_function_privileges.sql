revoke all on function public.admin_update_enrollment_application(uuid,text,text,text[],text,timestamptz) from public, anon;
grant execute on function public.admin_update_enrollment_application(uuid,text,text,text[],text,timestamptz) to authenticated;

-- La función de envío es el único punto público intencional; no concede lectura de la tabla.
revoke all on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,text,text,text,text) from public;
grant execute on function public.submit_enrollment_application(text,text,text,text,text,text,text,text,text,boolean,boolean,boolean,text,text,text,text) to anon, authenticated;
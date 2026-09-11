-- Barajar las opciones de eleccion multiple, una vez por alumno y ejercicio.
--
-- El problema: el contenido se genero poniendo casi siempre la respuesta
-- correcta la primera. Medido sobre produccion el 10/09/2026:
--   multiple_choice de 3 opciones -> la correcta es la primera en el 92,2 %
--                                    (4.550 de 4.934 ejercicios)
--   multiple_choice de 4 opciones -> 58,2 %  (1.760 de 3.024)
--   multiple_choice de 2 opciones -> 62,5 %  (389 de 622)
-- Un nino que siempre pulse la primera acierta 9 de cada 10 en las de 3
-- opciones sin leer el enunciado. Eso destruye el valor pedagogico y ademas
-- falsea las metricas de progreso.
--
-- La solucion: barajar al servir, no en el contenido. Asi no hay que reescribir
-- 8.600 filas y el arreglo cubre tambien el contenido que se genere en el
-- futuro, aunque el generador siga poniendo la correcta primero.
--
-- El orden se deriva de md5(alumno + ejercicio + posicion original), asi que:
--   - cada nino ve un orden distinto,
--   - el mismo nino ve SIEMPRE el mismo orden en ese ejercicio, aunque recargue
--     la pagina o vuelva otro dia (cambiarlo a media pregunta le confunde).
--
-- Es seguro respecto a la correccion: submit_exercise_attempt compara por el
-- valor de la respuesta (normalize_answer sobre ->>'value'), nunca por la
-- posicion, y esta funcion no devuelve correct_answer.
--
-- No se tocan:
--   - true_false: solo tiene Verdadero/Falso y conviene que el orden sea
--     predecible. Su sesgo es de contenido (el 62,8 % de las afirmaciones son
--     verdaderas) y se arregla reescribiendo enunciados, no barajando.
--   - drag_drop y fill_blank: su formato de opciones no es una lista de
--     alternativas equivalentes.

CREATE OR REPLACE FUNCTION public.playable_topic_exercises(p_topic_id uuid)
 RETURNS TABLE(id uuid, type exercise_type, difficulty integer, prompt jsonb, options jsonb, diamond_reward integer, is_exam boolean, lesson_id uuid, lesson_name text, lesson_sort_order integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_seed text := coalesce(auth.uid()::text, 'anon');
begin
  if not exists (
    select 1
    from topics t
    join student_subjects ss on ss.subject_id = t.subject_id
    where t.id = p_topic_id and ss.student_id = auth.uid()
      and (ss.expires_at is null or ss.expires_at > now())
  ) then
    raise exception 'No tenes esta materia asignada o tu acceso vencio';
  end if;

  return query
    select e.id, e.type, e.difficulty, e.prompt,
           case
             when e.type = 'multiple_choice'
              and jsonb_typeof(e.options) = 'array'
              and jsonb_array_length(e.options) > 1
             then (
               select jsonb_agg(o.opt order by md5(v_seed || e.id::text || o.ord::text))
               from jsonb_array_elements(e.options) with ordinality as o(opt, ord)
             )
             else e.options
           end,
           e.diamond_reward, e.is_exam,
           l.id, l.name, l.sort_order
    from exercises e
    left join lessons l on l.id = e.lesson_id
    where e.topic_id = p_topic_id and e.active = true
    order by e.is_exam, coalesce(l.sort_order, 999), e.difficulty;
end;
$function$;

-- Para volver atras, si hiciera falta: reaplicar esta version, que es la que
-- habia antes del 10/09/2026 (identica salvo el bloque case de options).
--
-- CREATE OR REPLACE FUNCTION public.playable_topic_exercises(p_topic_id uuid)
--  RETURNS TABLE(id uuid, type exercise_type, difficulty integer, prompt jsonb, options jsonb, diamond_reward integer, is_exam boolean, lesson_id uuid, lesson_name text, lesson_sort_order integer)
--  LANGUAGE plpgsql
--  STABLE SECURITY DEFINER
--  SET search_path TO 'public'
-- AS $function$
-- begin
--   if not exists (
--     select 1 from topics t
--     join student_subjects ss on ss.subject_id = t.subject_id
--     where t.id = p_topic_id and ss.student_id = auth.uid()
--       and (ss.expires_at is null or ss.expires_at > now())
--   ) then
--     raise exception 'No tenes esta materia asignada o tu acceso vencio';
--   end if;
--   return query
--     select e.id, e.type, e.difficulty, e.prompt, e.options, e.diamond_reward, e.is_exam,
--            l.id, l.name, l.sort_order
--     from exercises e
--     left join lessons l on l.id = e.lesson_id
--     where e.topic_id = p_topic_id and e.active = true
--     order by e.is_exam, coalesce(l.sort_order, 999), e.difficulty;
-- end;
-- $function$;

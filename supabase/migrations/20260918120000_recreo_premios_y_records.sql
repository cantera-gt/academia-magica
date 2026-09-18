-- Recreo: recalibrar premios, premiar el esfuerzo perdido y devolver la marca
-- personal para que el nino tenga motivo de volver.
--
-- Que estaba mal, medido sobre produccion el 14/09/2026:
--
--   1. La escala de premio era unica para los diez juegos y se basaba en
--      p_moves (menos movimientos, mas premio: <=10 -> 4, <=25 -> 3, resto 2).
--      Casi todos los juegos ya mandan un valor NORMALIZADO de 4 a 40 (por
--      ejemplo atrapa-fruta manda 20 - aciertos*2), pero Puzzle y Laberinto
--      mandaban el numero REAL de movimientos. El puzzle promedia 149, asi
--      que por diseno nunca bajaba de 25: siempre cobraba el minimo. Eso se
--      arregla en el cliente, normalizando esos dos como el resto.
--
--   2. Perder no daba absolutamente nada. Un nino que aguanta varias rondas y
--      falla se iba con las manos vacias.
--      (Nota: Memoria de Colores figuraba con CERO diamantes repartidos, pero
--      revisando las filas la causa no era la dificultad sino el tope global:
--      ese nino llevaba 19 partidas ese dia y el tope son 12. Justo el caso
--      que ahora se le explica en pantalla en vez de dejarlo en silencio.)
--
--   3. game_plays guarda cada partida desde el principio, pero el nino nunca
--      veia su mejor marca. Era la palanca de retorno mas barata y estaba
--      sin usar.
--
-- Esta funcion sustituye a la anterior. Para revertir, ver el bloque
-- comentado al final del archivo.

CREATE OR REPLACE FUNCTION public.finish_game(p_game_code text, p_won boolean, p_moves integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_plays_game int;
  v_plays_total int;
  v_cap_game constant int := 5;    -- por juego
  v_cap_total constant int := 12;  -- global de recreo al dia
  v_reward int := 0;
  v_xp int := 0;
  v_score int := coalesce(p_moves, 20);
  v_prev_best int;
  v_is_record boolean := false;
  v_new_diamonds int;
  v_old_xp int;
  v_new_xp int;
  v_old_level int;
  v_new_level int;
  v_capped boolean;
begin
  select count(*) filter (where game_code = p_game_code), count(*)
    into v_plays_game, v_plays_total
  from game_plays
  where student_id = auth.uid() and played_at::date = current_date;

  -- Mejor marca previa: solo cuentan las partidas ganadas, y menos es mejor.
  select min(moves) into v_prev_best
  from game_plays
  where student_id = auth.uid() and game_code = p_game_code
    and won and moves is not null;

  v_capped := v_plays_game >= v_cap_game or v_plays_total >= v_cap_total;

  if not v_capped then
    if p_won then
      -- Ganar bien paga mas, pero el recreo sigue pagando mucho menos que
      -- estudiar: es un premio, no la via principal para llenar la hucha.
      v_reward := case
        when v_score <= 10 then 4
        when v_score <= 25 then 3
        else 2
      end;
    elsif v_score <= 28 then
      -- Consolacion: perdio, pero llego lejos. Un diamante para que
      -- intentarlo de verdad nunca valga cero.
      v_reward := 1;
    end if;
    v_xp := v_reward;
  end if;

  -- Record solo si gano, mejoro su marca y ya habia jugado antes: la primera
  -- victoria no es un record, es el punto de partida.
  if p_won and p_moves is not null
     and v_prev_best is not null and p_moves < v_prev_best then
    v_is_record := true;
  end if;

  insert into game_plays (student_id, game_code, won, moves, diamonds_earned)
  values (auth.uid(), p_game_code, p_won, p_moves, v_reward);

  select xp_total into v_old_xp from profiles where id = auth.uid();
  v_old_level := student_level(v_old_xp);

  if v_reward > 0 then
    perform set_config('academia.bypass_profile_guard', 'on', true);
    update profiles
       set diamonds = diamonds + v_reward,
           xp_total = xp_total + v_xp
     where id = auth.uid()
    returning diamonds into v_new_diamonds;

    insert into diamond_transactions (student_id, amount, reason, reference_type, reference_id)
    values (auth.uid(), v_reward, case when p_won then 'game_won' else 'game_effort' end, 'game', null);
  else
    select diamonds into v_new_diamonds from profiles where id = auth.uid();
  end if;

  v_new_xp := v_old_xp + v_xp;
  v_new_level := student_level(v_new_xp);

  return jsonb_build_object(
    'diamonds_earned', v_reward,
    'total_diamonds', v_new_diamonds,
    'plays_today', v_plays_game + 1,
    'daily_cap', v_cap_game,
    'plays_today_total', v_plays_total + 1,
    'daily_cap_total', v_cap_total,
    'capped', v_capped,
    'best_moves', least(coalesce(v_prev_best, p_moves), coalesce(p_moves, v_prev_best)),
    'previous_best', v_prev_best,
    'is_record', v_is_record,
    'xp_earned', v_xp,
    'xp_total', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_new_level > v_old_level
  );
end;
$function$;

-- Para revertir: reaplicar la version anterior, que es identica salvo que
-- no premiaba la derrota, no calculaba marca personal ni record, y devolvia
-- menos campos. Esta en el historial de git en el baseline del 18/08.

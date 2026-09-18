import type { SupabaseClient } from "@supabase/supabase-js";

export type FinishGameResult = {
  diamonds_earned: number;
  total_diamonds: number;
  // Tope de este juego concreto.
  plays_today: number;
  daily_cap: number;
  // Tope global de recreo del dia. Existia en el backend desde el principio
  // pero no estaba declarado aqui, asi que la pantalla solo ensenaba el tope
  // por juego: un nino podia llegar a 12 partidas, dejar de ganar diamantes
  // y no entender por que.
  plays_today_total: number;
  daily_cap_total: number;
  capped: boolean;
  // Marca personal: menos es mejor en todos los juegos.
  best_moves: number | null;
  previous_best: number | null;
  is_record: boolean;
  xp_earned: number;
  level: number;
  leveled_up: boolean;
};

// Wrapper fino sobre el RPC generico finish_game. Cualquier minijuego nuevo
// llama esto pasando su propio game_code -- el backend no necesita cambios.
//
// `moves` es una puntuacion normalizada donde MENOS ES MEJOR, con un rango
// util de 4 a 40. Los juegos que no cuentan movimientos de verdad convierten
// su marca a esa escala (por ejemplo: 20 - aciertos * 2). Respetar el rango
// importa: de el dependen el premio y la marca personal.
export async function finishGame(
  supabase: SupabaseClient,
  gameCode: string,
  won: boolean,
  moves: number
): Promise<FinishGameResult | null> {
  const { data } = await supabase.rpc("finish_game", {
    p_game_code: gameCode,
    p_won: won,
    p_moves: moves,
  });
  return (data as FinishGameResult) ?? null;
}

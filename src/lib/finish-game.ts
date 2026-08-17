import type { SupabaseClient } from "@supabase/supabase-js";

export type FinishGameResult = {
  diamonds_earned: number;
  total_diamonds: number;
  plays_today: number;
  daily_cap: number;
};

// Wrapper fino sobre el RPC generico finish_game (ya existe en la base y lo
// usa Memoria Magica). Cualquier minijuego nuevo llama esto pasando su
// propio game_code -- el backend no necesita cambios.
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

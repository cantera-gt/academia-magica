export type UserRole = "admin" | "student";
export type CharacterType = "princess" | "superhero";

export interface MyProfile {
  id: string;
  role: UserRole;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  active_character: CharacterType | null;
  diamonds: number;
  household_id: string;
}

export interface ActiveStudent {
  username: string;
  display_name: string;
  avatar_url: string | null;
  active_character: CharacterType | null;
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  active: boolean;
}

export type ExerciseType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "drag_drop"
  | "ordering"
  | "open_text";

export interface PlayableExercise {
  id: string;
  topic_id: string;
  topic_name: string;
  type: ExerciseType;
  difficulty: number;
  prompt: { text: string; hint?: string };
  options: string[] | null;
  diamond_reward: number;
}

export interface AttemptResult {
  is_correct: boolean;
  diamonds_earned: number;
  correct_answer: { value: string };
  explanation: string | null;
}

export type ItemCategory =
  | "decoracion"
  | "mueble"
  | "mascota"
  | "traje"
  | "accesorio"
  | "fondo";

export interface StoreItem {
  id: string;
  character_type: CharacterType;
  name: string;
  description: string | null;
  category: ItemCategory;
  price_diamonds: number;
  image_url: string | null;
  sort_order: number;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  placed_in_room: boolean;
  position: { x: number; y: number } | null;
  store_items: StoreItem;
}

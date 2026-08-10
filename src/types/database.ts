export type UserRole = "admin" | "student";
export type CharacterGender = "girl" | "boy";

export interface Character {
  id: string;
  gender: CharacterGender;
  display_name: string;
  model_url: string;
  thumbnail_url: string;
  height_m: number;
  sort_order: number;
}

export interface MyProfile {
  id: string;
  role: UserRole;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  gender: CharacterGender | null;
  character_id: string | null;
  diamonds: number;
  household_id: string;
}

export interface ActiveStudent {
  username: string;
  display_name: string;
  avatar_url: string | null;
  gender: CharacterGender | null;
  character_id: string | null;
  thumbnail_url: string | null;
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
  | "fondo"
  | "color_ropa"
  | "extra";

export type GarmentSlot = "chaqueta" | "pantalon" | "gorro";

export type RoomPlacement = "floor" | "wall";

export interface StoreItem {
  id: string;
  gender: CharacterGender;
  name: string;
  description: string | null;
  category: ItemCategory;
  price_diamonds: number;
  image_url: string | null;
  sort_order: number;
  // Solo aplica cuando category === "color_ropa"
  garment_slot: GarmentSlot | null;
  color_hex: string | null;
  // Solo aplica cuando category === "accesorio" (pieza 3D enganchada al esqueleto)
  model_url: string | null;
  bone_target: string | null;
  // Solo aplica cuando category === "extra" (mini-visor, ej. libro)
  content_url: string | null;
  // Solo aplica a objetos de la habitacion 3D (decoracion/mueble/fondo/mascota)
  placement: RoomPlacement;
}

// Posicion 3D dentro de la habitacion (grid). rotationY en radianes.
export interface RoomPosition3D {
  x: number;
  y: number;
  z: number;
  rotationY?: number;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  placed_in_room: boolean;
  // true si es una prenda (color_ropa) o accesorio actualmente puesto en el personaje
  equipped: boolean;
  position: RoomPosition3D | null;
  store_items: StoreItem;
}

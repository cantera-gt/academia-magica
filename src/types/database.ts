export type UserRole = "admin" | "student";
export type CharacterGender = "girl" | "boy";
export type AgeBracket = "4-7" | "7-10" | "10-12";

// Personajes fijos en 2D (imagen unica por personaje, sin personalizacion
// de ropa/color). Se filtran por gender + age_bracket del alumno.
export interface Character {
  id: string;
  gender: CharacterGender;
  display_name: string;
  image_url: string;
  thumbnail_url: string;
  age_min: number;
  age_max: number;
  sort_order: number;
}

export interface MyProfile {
  id: string;
  role: UserRole;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  gender: CharacterGender | null;
  age_bracket: AgeBracket | null;
  character_id: string | null;
  diamonds: number;
  household_id: string;
  birthdate: string | null;
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

// Un tema/subtema de una materia, para el nivel de edad del alumno, con su
// progreso (practica + examen final, estilo Anton "Test" con trofeos)
export interface SubjectTopic {
  topic_id: string;
  name: string;
  sort_order: number;
  recommended_age: number | null;
  prerequisites: string | null;
  submodule: string | null;
  practice_count: number;
  exam_count: number;
  practice_best_pct: number | null;
  exam_best_pct: number | null;
  exam_best_stars: number;
  exam_attempts: number;
  passed: boolean;
  last_played_at: string | null;
}

export interface SubjectTeacher {
  teacher_id: string;
  name: string;
  gender: "mujer" | "hombre";
  nationality: string;
  flag_emoji: string;
  age: number | null;
  image_url: string;
}

export interface MySubjectTeacher extends SubjectTeacher {
  body_image_url: string | null;
  voice_name: string;
  greeting_template: string;
  greeting_es: string | null;
}

export interface TopicDetail {
  id: string;
  subject_id: string;
  name: string;
  recommended_age: number | null;
  prerequisites: string | null;
}

export interface ExerciseOption {
  label: string;
  image?: string;
}

// Zona de destino para ejercicios de arrastrar y soltar (drag_drop).
export interface DropTarget {
  label: string;
  image?: string;
}

export interface ExercisePrompt {
  text: string;
  hint?: string;
  image_url?: string;
  // Pista adicional que solo se muestra despues del primer intento
  // incorrecto (andamiaje adaptativo). Si no esta presente, se usa un
  // mensaje generico de aliento.
  hint_after_fail?: string;
  // "scene" pinta las opciones como fichas grandes de imagen (tocar-escena)
  // en vez de la fila chica de icono+texto por defecto ("grid").
  display_mode?: "grid" | "scene";
  // Solo para type = "drag_drop": la zona donde hay que soltar el objeto.
  drop_target?: DropTarget;
}

export interface PlayableTopicExercise {
  id: string;
  type: ExerciseType;
  difficulty: number;
  prompt: ExercisePrompt;
  options: (string | ExerciseOption)[] | null;
  diamond_reward: number;
  is_exam: boolean;
  lesson_id: string | null;
  lesson_name: string | null;
  lesson_sort_order: number | null;
}

export interface FinishTopicResult {
  practice_pct: number | null;
  exam_pct: number | null;
  stars: number;
  passed: boolean;
  is_first_pass: boolean;
  bonus_diamonds: number;
  total_diamonds: number;
}

export interface SubjectScore {
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  topics_total: number;
  topics_passed: number;
  avg_exam_pct: number | null;
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
  | "extra"
  | "deporte";

export type ItemZone = "habitacion" | "estudio" | "jardin";

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
  // A que espacio 2D pertenece este item (Habitacion / Estudio / Jardin)
  zone: ItemZone;
}

// Posicion 3D dentro de la habitacion (grid). rotationY en radianes.
export interface RoomPosition3D {
  x: number;
  y: number;
  z?: number;
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

// Estadisticas agregadas para el Panel para padres (tiempo, precision,
// racha, diamantes y progreso por materia). Ver RPC public.my_parent_stats().
export interface ParentStatsSubject {
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  subject_color: string | null;
  seconds: number;
  exercises: number;
  accuracy_pct: number | null;
  topics_passed: number;
  expires_at: string | null;
  subscription_status: SubjectSubscriptionStatus;
}

export interface ParentStatsDay {
  day: string;
  seconds: number;
  exercises: number;
}

export interface ParentStats {
  display_name: string;
  diamonds_balance: number;
  generated_at: string;
  total_seconds: number;
  total_exercises: number;
  accuracy_pct: number | null;
  seconds_last_7d: number;
  seconds_last_30d: number;
  diamonds_last_30d: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  topics_passed_total: number;
  achievements_count: number;
  by_subject: ParentStatsSubject[];
  daily_last_14d: ParentStatsDay[];
}

export type SubjectSubscriptionStatus = "activa" | "por_vencer" | "vencida" | "sin_vencimiento";

// Materia asignada a un alumno con su estado de vencimiento (3 meses por
// compra). Ver RPC public.assigned_subjects_with_status().
export interface AssignedSubjectWithStatus extends Subject {
  expires_at: string | null;
  status: SubjectSubscriptionStatus;
}

// Resumen de una orden de compra de materias adicionales, para la pagina de
// pago. Ver RPC public.get_subject_order_summary().
export interface SubjectOrderSummary {
  id: string;
  subject_count: number;
  total_price_usd: number;
  currency: string;
  access_months: number;
  payment_status: string;
  subject_names: string[];
}

// Fila del listado global de suscripciones para el admin. Ver RPC
// public.admin_list_subject_subscriptions().
export interface AdminSubjectSubscription {
  student_id: string;
  student_name: string;
  subject_id: string;
  subject_name: string;
  subject_icon: string | null;
  assigned_at: string;
  expires_at: string | null;
  days_remaining: number | null;
  status: SubjectSubscriptionStatus;
}

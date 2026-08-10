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

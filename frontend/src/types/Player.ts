export type PlayerSex = "MASCULINO" | "FEMENINO";
export type PlayerCategory =
  | "PRIMERA"
  | "SEGUNDA"
  | "TERCERA"
  | "CUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SEPTIMA"
  | "SIN_CATEGORIA";

export interface Player {
  id: number;
  name: string;
  category: PlayerCategory;       // Pádel category
  tenisCategory?: PlayerCategory; // Tenis category
  city?: string;
  sex: PlayerSex;
  birthDate?: string; // YYYY-MM-DD
  phone?: string;
  sports?: string[];
  sport?: string;     // legacy: backend may still return singular
  avatarUrl?: string;
  createdAt: string;
}

export interface PlayerFormData {
  name: string;
  category: PlayerCategory;       // Pádel category
  tenisCategory?: PlayerCategory; // Tenis category
  city?: string;
  sex: PlayerSex;
  birthDate?: string;
  phone?: string;
  sports?: string[];
  avatarUrl?: string;
}

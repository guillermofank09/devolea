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
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string; // YYYY-MM-DD
  phone?: string;
  sport?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface PlayerFormData {
  name: string;
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string;
  phone: string;
  sport?: string;
  avatarUrl?: string;
}

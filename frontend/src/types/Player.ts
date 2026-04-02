export type PlayerSex = "MASCULINO" | "FEMENINO";
export type PlayerCategory =
  | "PRIMERA"
  | "SEGUNDA"
  | "TERCERA"
  | "CUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SEPTIMA";

export interface Player {
  id: number;
  name: string;
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string; // YYYY-MM-DD
  phone?: string;
  createdAt: string;
}

export interface PlayerFormData {
  name: string;
  category: PlayerCategory;
  city: string;
  sex: PlayerSex;
  birthDate: string;
  phone: string;
}

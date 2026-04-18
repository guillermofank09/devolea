export type EquipoSex = "MASCULINO" | "FEMENINO";

export interface Equipo {
  id: number;
  name: string;
  city?: string;
  sex?: EquipoSex;
  sport?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface EquipoFormData {
  name: string;
  city: string;
  sex?: EquipoSex | "";
  sport?: string;
  avatarUrl?: string;
}

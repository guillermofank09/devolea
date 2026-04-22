import type { DaySchedule } from "./ClubProfile";

export type ProfesorSex = "MASCULINO" | "FEMENINO";

export interface Profesor {
  id: number;
  name: string;
  phone?: string;
  hourlyRate?: number;
  sex?: ProfesorSex;
  schedule?: DaySchedule[] | null;
  avatarUrl?: string;
  city?: string;
  sport?: string;
  sports?: string[];
  birthDate?: string;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
  sex?: ProfesorSex | "";
  avatarUrl?: string;
  city?: string;
  sports?: string[];
  birthDate?: string;
}

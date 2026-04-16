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
  sport?: string;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
  sex?: ProfesorSex | "";
  avatarUrl?: string;
  sport?: string;
}

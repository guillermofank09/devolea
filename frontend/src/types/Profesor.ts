import type { DaySchedule } from "./ClubProfile";

export interface Profesor {
  id: number;
  name: string;
  phone?: string;
  hourlyRate?: number;
  schedule?: DaySchedule[] | null;
  createdAt: string;
}

export interface ProfesorFormData {
  name: string;
  phone: string;
}

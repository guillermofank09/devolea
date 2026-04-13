export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ClubProfile {
  id?: number;
  clubName: string;
  logoBase64?: string;
  address: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  businessHoursJson?: string;
  businessHours?: DaySchedule[];
}

export const DEFAULT_HOURS: DaySchedule[] = [
  { day: "Lunes",      isOpen: true,  openTime: "08:00", closeTime: "22:00" },
  { day: "Martes",     isOpen: true,  openTime: "08:00", closeTime: "22:00" },
  { day: "Miércoles",  isOpen: true,  openTime: "08:00", closeTime: "22:00" },
  { day: "Jueves",     isOpen: true,  openTime: "08:00", closeTime: "22:00" },
  { day: "Viernes",    isOpen: true,  openTime: "08:00", closeTime: "22:00" },
  { day: "Sábado",     isOpen: true,  openTime: "09:00", closeTime: "20:00" },
  { day: "Domingo",    isOpen: false, openTime: "09:00", closeTime: "20:00" },
];

export type CourtStatus = "AVAILABLE" | "IN USE" | "NOT AVAILABLE";
export type CourtType = "TECHADA" | "DESCUBIERTA" | "FUTBOL5" | "FUTBOL7" | "FUTBOL9" | "FUTBOL11" | "CEMENTO" | "PARQUET"
export type TimeSlotStatus = "AVAILABLE" | "BOOKED" | "SELECTED";

export interface Court {
  id: number;
  name: string;
  status: CourtStatus;
  type: CourtType;
  sport?: string;
  avalability: DayAvailability[]
}

export interface TimeSlot {
  hour: number; // 8 → 23
  status: TimeSlotStatus
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface CreateCourt {
  name: string;
  type: CourtType;
  sport?: string;
}

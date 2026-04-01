export type CourtStatus = "AVAILABLE" | "IN USE" | "NOT AVAILABLE";
export type CourtType = "TECHADA" | "DESCUBIERTA"
export type TimeSlotStatus = "AVAILABLE" | "BOOKED" | "SELECTED";

export interface Court {
  id: number;
  name: string;
  status: CourtStatus;
  type: CourtType;
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
}

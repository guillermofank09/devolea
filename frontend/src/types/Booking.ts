import type { Court } from "./Court";
import type { Player } from "./Player";
import type { Profesor } from "./Profesor";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export interface Booking {
  id: number;
  court: Court;
  player?: Player | null;
  profesor?: Profesor | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  isRecurring: boolean;
  recurringGroupId: string | null;
  createdAt: string;
}

export interface CreateBookingDto {
  courtId: number;
  playerId?: number;
  profesorId?: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
}

import type { Court } from "./Court";
import type { Player } from "./Player";
import type { Profesor } from "./Profesor";

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "PENDING";

export interface Booking {
  id: number;
  court: Court;
  player?: Player | null;
  profesor?: Profesor | null;
  price?: number | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  isRecurring: boolean;
  recurringGroupId: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  createdAt: string;
}

export interface CreateBookingDto {
  courtId: number;
  playerId?: number;
  profesorId?: number;
  price?: number;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
}

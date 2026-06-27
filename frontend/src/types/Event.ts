export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  courtId: number;
  status: "BOOKED" | "AVAILABLE" | "PENDING";
  color: string;
  isRecurring: boolean;
  recurringGroupId: string | null;
  isTournamentMatch?: boolean;
  tournamentMatchId?: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  courtId: number;
  status: "BOOKED" | "AVAILABLE";
  color: string;
  isRecurring: boolean;
  recurringGroupId: string | null;
}

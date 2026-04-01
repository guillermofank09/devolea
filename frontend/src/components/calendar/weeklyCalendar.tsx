import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { localizer } from "./calendarConfig";
import "../../styles/Calendar.css";
import type { CalendarEvent } from "../../types/Event";
import { useMediaQuery } from "@mui/material";

interface Props {
  events: CalendarEvent[];
  onSelectSlot: (slot: unknown) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const spanishMessages = {
  next: "›",
  previous: "‹",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  showMore: (total: number) => `+${total} más`,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Custom event block ────────────────────────────────────────────────────────

interface EventProps {
  event: CalendarEvent;
}

function EventBlock({ event }: EventProps) {
  const initials = getInitials(event.title);
  const start = event.start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const end   = event.end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const durationH = (event.end.getTime() - event.start.getTime()) / 3_600_000;
  const compact = durationH < 1;

  return (
    <div className={`cal-event ${compact ? "cal-event--compact" : ""}`}>
      <div className="cal-event__avatar">{initials}</div>
      <div className="cal-event__body">
        <span className="cal-event__name">{event.title}</span>
        {!compact && (
          <span className="cal-event__time">{start} – {end}</span>
        )}
      </div>
      {event.isRecurring && (
        <div className="cal-event__repeat" title="Reserva fija semanal">↻</div>
      )}
    </div>
  );
}

// ── Custom toolbar ─────────────────────────────────────────────────────────────

interface ToolbarProps {
  label: string;
  onNavigate: (action: "TODAY" | "PREV" | "NEXT") => void;
  onView: (view: string) => void;
  view: string;
  views: string[];
}

function CustomToolbar({ label, onNavigate, onView, view, views }: ToolbarProps) {
  const viewLabels: Record<string, string> = {
    day: "Día",
    week: "Semana",
    month: "Mes",
    agenda: "Agenda",
  };

  return (
    <div className="cal-toolbar">
      <div className="cal-toolbar__nav">
        <button className="cal-btn cal-btn--icon" onClick={() => onNavigate("PREV")}>‹</button>
        <button className="cal-btn cal-btn--today" onClick={() => onNavigate("TODAY")}>Hoy</button>
        <button className="cal-btn cal-btn--icon" onClick={() => onNavigate("NEXT")}>›</button>
      </div>

      <span className="cal-toolbar__label">{label}</span>

      <div className="cal-toolbar__views">
        {views.map((v) => (
          <button
            key={v}
            className={`cal-btn cal-btn--view ${view === v ? "cal-btn--active" : ""}`}
            onClick={() => onView(v)}
          >
            {viewLabels[v] ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export default function WeeklyCalendar({ events, onSelectSlot, onSelectEvent }: Props) {
  const isMobile = useMediaQuery("(max-width:600px)");

  const eventPropGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      border: "none",
      borderRadius: "8px",
      padding: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    },
  });

  return (
    <div className="calendarWrapper">
      <Calendar
        localizer={localizer}
        culture="es"
        events={events}
        defaultView={isMobile ? Views.DAY : Views.WEEK}
        views={isMobile ? [Views.DAY, Views.WEEK] : [Views.DAY, Views.WEEK, Views.MONTH]}
        messages={spanishMessages}
        step={60}
        timeslots={1}
        selectable
        startAccessor="start"
        endAccessor="end"
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventPropGetter}
        popup
        className="calendar"
        min={new Date(0, 0, 0, 7, 0)}
        max={new Date(0, 0, 0, 23, 0)}
        components={{
          event: EventBlock as any,
          toolbar: CustomToolbar as any,
        }}
      />
    </div>
  );
}


import { useState } from "react";
import { Calendar, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { localizer } from "./calendarConfig";
import "../../styles/Calendar.css";
import type { CalendarEvent } from "../../types/Event";
import { useMediaQuery } from "@mui/material";
import { getInitials } from "../../utils/uiUtils";

interface Props {
  events: CalendarEvent[];
  onSelectSlot: (slot: unknown) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  initialDate?: Date;
  height?: string | number;
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

const DAY_LETTERS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
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
  const compact = durationH < 0.75;

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
  date: Date;
  label: string;
  onNavigate: (action: "TODAY" | "PREV" | "NEXT" | "DATE", newDate?: Date) => void;
  onView: (view: string) => void;
  view: string;
  views: string[];
}

function CustomToolbar({ date, label, onNavigate, onView, view, views }: ToolbarProps) {
  const isMobile = useMediaQuery("(max-width:600px)");

  const viewLabels: Record<string, string> = {
    day: "Día",
    week: "Semana",
    month: "Mes",
    agenda: "Agenda",
  };

  const today = new Date();

  // 7-day strip centred on the currently viewed date
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  return (
    <div className="cal-toolbar">
      {/* Row 1: ‹ [label] › */}
      <div className="cal-toolbar__nav">
        <button className="cal-btn cal-btn--icon" onClick={() => onNavigate("PREV")}>‹</button>
        <span className="cal-toolbar__label">{label}</span>
        <button className="cal-btn cal-btn--icon" onClick={() => onNavigate("NEXT")}>›</button>
      </div>

      {/* Mobile: 7-day quick-access strip */}
      {isMobile && (
        <div className="cal-day-strip">
          {strip.map((d, i) => {
            const isToday = isSameDay(d, today);
            const isActive = isSameDay(d, date);
            return (
              <button
                key={i}
                className={`cal-day-chip ${isToday ? "cal-day-chip--today" : ""} ${isActive ? "cal-day-chip--active" : ""}`}
                onClick={() => onNavigate("DATE", d)}
              >
                <span className="cal-day-chip__letter">{DAY_LETTERS[d.getDay()]}</span>
                <span className="cal-day-chip__num">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Row 2: Hoy + view switcher — hidden on mobile */}
      {!isMobile && (
        <div className="cal-toolbar__controls">
          <button className="cal-btn cal-btn--today" onClick={() => onNavigate("TODAY")}>Hoy</button>
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
      )}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

export default function WeeklyCalendar({ events, onSelectSlot, onSelectEvent, initialDate, height }: Props) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [date, setDate] = useState(initialDate ?? new Date());

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
    <div className="calendarWrapper" style={height !== undefined ? { height } : undefined}>
      <Calendar
        localizer={localizer}
        culture="es"
        events={events}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
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

import { createContext, useContext, useMemo, useState } from "react";
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
  /** Restrict and highlight days within this date range (e.g. tournament start/end) */
  highlightedDateRange?: { start: string; end: string };
  /** ISO timestamps preferred by pair 1 (amber stripes) */
  pair1Slots?: string[];
  /** ISO timestamps preferred by pair 2 (blue stripes) */
  pair2Slots?: string[];
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

// ── Date range context (shared with toolbar) ──────────────────────────────────

interface DateRange { start: Date | null; end: Date | null }
const DateRangeCtx = createContext<DateRange>({ start: null, end: null });

// ── Custom event block ────────────────────────────────────────────────────────

interface EventProps { event: CalendarEvent }

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
  const { start: rangeStart, end: rangeEnd } = useContext(DateRangeCtx);
  const hasRange = !!rangeStart && !!rangeEnd;

  const viewLabels: Record<string, string> = {
    day: "Día",
    week: "Semana",
    month: "Mes",
    agenda: "Agenda",
  };

  const today = new Date();

  // Determine if prev/next are at the boundary
  const step = view === "week" ? 7 : 1;

  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - step);
  prevDate.setHours(0, 0, 0, 0);
  const isPrevDisabled = hasRange && prevDate < rangeStart!;

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + step);
  nextDate.setHours(0, 0, 0, 0);
  const isNextDisabled = hasRange && nextDate > rangeEnd!;

  // Mobile day strip: all tournament days if ≤ 7, else 7 centered on current date
  const strip = useMemo(() => {
    if (hasRange) {
      const days: Date[] = [];
      const d = new Date(rangeStart!);
      d.setHours(0, 0, 0, 0);
      const end = new Date(rangeEnd!);
      end.setHours(0, 0, 0, 0);
      while (d <= end) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      if (days.length <= 7) return days;
      // More than 7 days: show 7 centered on current date, clamped to range
      const center = new Date(date);
      center.setHours(0, 0, 0, 0);
      const result: Date[] = [];
      for (let i = -3; i <= 3; i++) {
        const candidate = new Date(center);
        candidate.setDate(center.getDate() + i);
        if (candidate >= rangeStart! && candidate <= rangeEnd!) {
          result.push(candidate);
        }
      }
      return result;
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - 3 + i);
      return d;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, rangeStart, rangeEnd, hasRange]);

  return (
    <div className="cal-toolbar">
      {/* Row 1: ‹ [label] › */}
      <div className="cal-toolbar__nav">
        <button
          className={`cal-btn cal-btn--icon${isPrevDisabled ? " cal-btn--disabled" : ""}`}
          onClick={() => !isPrevDisabled && onNavigate("PREV")}
          aria-disabled={isPrevDisabled}
        >‹</button>
        <span className="cal-toolbar__label">{label}</span>
        <button
          className={`cal-btn cal-btn--icon${isNextDisabled ? " cal-btn--disabled" : ""}`}
          onClick={() => !isNextDisabled && onNavigate("NEXT")}
          aria-disabled={isNextDisabled}
        >›</button>
      </div>

      {/* Mobile: day strip */}
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
          {!hasRange && (
            <button className="cal-btn cal-btn--today" onClick={() => onNavigate("TODAY")}>Hoy</button>
          )}
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

export default function WeeklyCalendar({ events, onSelectSlot, onSelectEvent, initialDate, height, highlightedDateRange, pair1Slots, pair2Slots }: Props) {
  const isMobile = useMediaQuery("(max-width:600px)");

  const highlightStart = useMemo(
    () => highlightedDateRange ? new Date(highlightedDateRange.start + "T00:00:00") : null,
    [highlightedDateRange?.start],
  );
  const highlightEnd = useMemo(
    () => highlightedDateRange ? new Date(highlightedDateRange.end + "T23:59:59") : null,
    [highlightedDateRange?.end],
  );

  // When a range is provided, start at the tournament start; otherwise use initialDate
  const [date, setDate] = useState(highlightStart ?? initialDate ?? new Date());

  const clampToRange = (d: Date): Date => {
    if (!highlightStart || !highlightEnd) return d;
    if (d < highlightStart) return new Date(highlightStart);
    if (d > highlightEnd) return new Date(highlightEnd);
    return d;
  };

  const isHighlighted = (d: Date) => {
    if (!highlightStart || !highlightEnd) return false;
    return d >= highlightStart && d <= highlightEnd;
  };

  const dayPropGetter = (d: Date) =>
    isHighlighted(d) ? { className: "rbc-day-tournament" } : {};

  const slotPropGetter = (d: Date) => {
    const slotEnd = new Date(d.getTime() + 60 * 60 * 1000);
    const matches = (list: string[] | undefined) =>
      list?.some(s => { const t = new Date(s); return t >= d && t < slotEnd; }) ?? false;
    const in1 = matches(pair1Slots);
    const in2 = matches(pair2Slots);
    if (in1 && in2) return { className: "rbc-slot-preferred-both" };
    if (in1) return { className: "rbc-slot-preferred-pair1" };
    if (in2) return { className: "rbc-slot-preferred-pair2" };
    return isHighlighted(d) ? { className: "rbc-slot-tournament" } : {};
  };

  const eventPropGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      border: "none",
      borderRadius: "8px",
      padding: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    },
  });

  const handleNavigate = (newDate: Date) => {
    setDate(clampToRange(newDate));
  };

  const dateRange = useMemo<DateRange>(
    () => ({ start: highlightStart, end: highlightEnd }),
    [highlightStart, highlightEnd],
  );

  return (
    <DateRangeCtx.Provider value={dateRange}>
      <div className="calendarWrapper" style={height !== undefined ? { height } : undefined}>
        <Calendar
          localizer={localizer}
          culture="es"
          events={events}
          date={date}
          onNavigate={handleNavigate}
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
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
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
    </DateRangeCtx.Provider>
  );
}

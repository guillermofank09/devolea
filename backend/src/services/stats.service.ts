import { Repository } from "typeorm";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";
import { Court } from "../entities/Court";

export interface RevenueEntry {
  label: string;
  revenue: number;
  bookings: number;
  hours: number;
}

export interface CourtOccupancy {
  courtId: number;
  courtName: string;
  bookedHours: number;     // hours booked today
  availableHours: number;  // available hours today (from schedule)
  occupancyPct: number;    // bookedHours / availableHours * 100
  bookings: number;        // number of bookings today
  share: number;           // % of today's total booked hours (for pie slice size)
}

export interface RevenueStats {
  hourlyRate: number;
  classHourlyRate: number;
  daily: RevenueEntry[];
  weekly: RevenueEntry[];
  monthly: RevenueEntry[];
  totals: {
    day: number;
    week: number;
    month: number;
    allTime: number;
  };
  courtOccupancy: CourtOccupancy[];
  occupancySummary: {
    availableHoursPerCourt: number;  // today's available hours per court
    totalBookedHours: number;        // total booked hours today across all courts
    overallOccupancyPct: number;     // overall today's occupancy %
    periodDays: number;              // always 1 (today)
  };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function durationHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 3_600_000;
}

// ── Business-hours helpers ────────────────────────────────────────────────────

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

// JS getDay(): 0=Sunday … 6=Saturday
const DAY_NAME = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function parseHHMM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function availableHoursForDay(date: Date, schedule: DaySchedule[]): number {
  const name = DAY_NAME[date.getDay()];
  const entry = schedule.find((s) => s.day === name);
  if (!entry || !entry.isOpen) return 0;
  return Math.max(parseHHMM(entry.closeTime) - parseHHMM(entry.openTime), 0);
}

// ── Service ───────────────────────────────────────────────────────────────────

export class StatsService {
  constructor(
    private bookingRepo: Repository<Booking>,
    private settingsRepo: Repository<AppSettings>,
    private profileRepo: Repository<ClubProfile>,
    private courtRepo: Repository<Court>
  ) {}

  async getRevenue(): Promise<RevenueStats> {
    const [bookings, settings, profile, allCourts] = await Promise.all([
      this.bookingRepo.find({ where: { status: "CONFIRMED" } }),
      this.settingsRepo.findOneBy({ id: 1 }),
      this.profileRepo.findOneBy({ id: 1 }),
      this.courtRepo.find(),
    ]);

    const hourlyRate = Number(settings?.hourlyRate ?? 0);
    const classHourlyRate = Number(settings?.classHourlyRate ?? 0);
    const now = new Date();
    const todayKey = isoDay(now);

    // Parse business hours schedule
    let schedule: DaySchedule[] = [];
    if (profile?.businessHoursJson) {
      try { schedule = JSON.parse(profile.businessHoursJson); } catch { /* ignore */ }
    }
    if (!schedule.length) {
      schedule = [
        { day: "Lunes",     isOpen: true,  openTime: "08:00", closeTime: "22:00" },
        { day: "Martes",    isOpen: true,  openTime: "08:00", closeTime: "22:00" },
        { day: "Miércoles", isOpen: true,  openTime: "08:00", closeTime: "22:00" },
        { day: "Jueves",    isOpen: true,  openTime: "08:00", closeTime: "22:00" },
        { day: "Viernes",   isOpen: true,  openTime: "08:00", closeTime: "22:00" },
        { day: "Sábado",    isOpen: true,  openTime: "09:00", closeTime: "20:00" },
        { day: "Domingo",   isOpen: false, openTime: "09:00", closeTime: "20:00" },
      ];
    }

    // Available hours today (based on today's day-of-week in the schedule)
    const todayAvailableHours = availableHoursForDay(now, schedule);

    // ── Revenue buckets (all-time) ────────────────────────────────────────────
    const dayMap   = new Map<string, { revenue: number; bookings: number; hours: number }>();
    const weekMap  = new Map<string, { revenue: number; bookings: number; hours: number }>();
    const monthMap = new Map<string, { revenue: number; bookings: number; hours: number }>();

    const addTo = (
      map: Map<string, { revenue: number; bookings: number; hours: number }>,
      key: string,
      hours: number,
      revenue: number
    ) => {
      const e = map.get(key) ?? { revenue: 0, bookings: 0, hours: 0 };
      e.hours += hours;
      e.revenue += revenue;
      e.bookings += 1;
      map.set(key, e);
    };

    // ── Today's bookings per court ────────────────────────────────────────────
    // key: courtId → { hours, bookings }
    const todayCourtMap = new Map<number, { hours: number; bookings: number }>();

    for (const b of bookings) {
      const start = new Date(b.startTime);
      const end   = new Date(b.endTime);
      const hrs   = durationHours(start, end);
      if (hrs <= 0) continue;

      // Revenue: use custom price if set, otherwise rate × hours
      const defaultRate = b.profesor ? classHourlyRate : hourlyRate;
      const revenue = b.price != null ? Number(b.price) : hrs * defaultRate;

      // Revenue accumulators (all-time)
      addTo(dayMap,   isoDay(start),   hrs, revenue);
      addTo(weekMap,  isoWeek(start),  hrs, revenue);
      addTo(monthMap, isoMonth(start), hrs, revenue);

      // Daily court occupancy — only today
      if (isoDay(start) === todayKey) {
        const cid = b.court.id!;
        const ce  = todayCourtMap.get(cid) ?? { hours: 0, bookings: 0 };
        ce.hours    += hrs;
        ce.bookings += 1;
        todayCourtMap.set(cid, ce);
      }
    }

    // ── Build courtOccupancy using ALL courts (even those with 0 today) ───────
    const totalTodayBookedHours = Array.from(todayCourtMap.values())
      .reduce((s, e) => s + e.hours, 0);

    const courtOccupancy: CourtOccupancy[] = allCourts
      .filter(c => c.id !== undefined)
      .map(c => {
        const today = todayCourtMap.get(c.id!) ?? { hours: 0, bookings: 0 };
        return {
          courtId:       c.id!,
          courtName:     c.name ?? `Cancha ${c.id}`,
          bookedHours:   today.hours,
          availableHours: todayAvailableHours,
          occupancyPct:  todayAvailableHours > 0 ? (today.hours / todayAvailableHours) * 100 : 0,
          bookings:      today.bookings,
          share:         totalTodayBookedHours > 0 ? (today.hours / totalTodayBookedHours) * 100 : 0,
        };
      })
      .sort((a, b) => b.occupancyPct - a.occupancyPct);

    // ── Build time-series ─────────────────────────────────────────────────────
    const buildDaily = (): RevenueEntry[] => {
      const result: RevenueEntry[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = isoDay(d);
        result.push({ label: key, ...(dayMap.get(key) ?? { revenue: 0, bookings: 0, hours: 0 }) });
      }
      return result;
    };

    const buildWeekly = (): RevenueEntry[] => {
      const result: RevenueEntry[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i * 7);
        const key = isoWeek(d);
        if (result.length && result[result.length - 1].label === key) continue;
        result.push({ label: key, ...(weekMap.get(key) ?? { revenue: 0, bookings: 0, hours: 0 }) });
      }
      return result;
    };

    const buildMonthly = (): RevenueEntry[] => {
      const result: RevenueEntry[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = isoMonth(d);
        result.push({ label: key, ...(monthMap.get(key) ?? { revenue: 0, bookings: 0, hours: 0 }) });
      }
      return result;
    };

    const weekKey  = isoWeek(now);
    const monthKey = isoMonth(now);
    const allTime  = Array.from(dayMap.values()).reduce((s, e) => s + e.revenue, 0);

    return {
      hourlyRate,
      classHourlyRate,
      daily:   buildDaily(),
      weekly:  buildWeekly(),
      monthly: buildMonthly(),
      totals: {
        day:     dayMap.get(todayKey)?.revenue   ?? 0,
        week:    weekMap.get(weekKey)?.revenue   ?? 0,
        month:   monthMap.get(monthKey)?.revenue ?? 0,
        allTime,
      },
      courtOccupancy,
      occupancySummary: {
        availableHoursPerCourt: todayAvailableHours,
        totalBookedHours:       totalTodayBookedHours,
        overallOccupancyPct:
          todayAvailableHours > 0 && allCourts.length > 0
            ? (totalTodayBookedHours / (todayAvailableHours * allCourts.length)) * 100
            : 0,
        periodDays: 1,
      },
    };
  }
}

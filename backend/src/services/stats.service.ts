import { Repository } from "typeorm";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";

export interface RevenueEntry {
  label: string;
  revenue: number;
  bookings: number;
  hours: number;
}

export interface CourtOccupancy {
  courtId: number;
  courtName: string;
  bookedHours: number;
  availableHours: number;
  occupancyPct: number; // bookedHours / availableHours * 100
  bookings: number;
  share: number;        // % of total booked hours among all courts (for pie slice size)
}

export interface RevenueStats {
  hourlyRate: number;
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
    availableHoursPerCourt: number;
    totalBookedHours: number;
    overallOccupancyPct: number;
    periodDays: number;
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
  const hours = parseHHMM(entry.closeTime) - parseHHMM(entry.openTime);
  return Math.max(hours, 0);
}

/** Sum available hours from startDate to endDate inclusive */
function totalAvailableHours(startDate: Date, endDate: Date, schedule: DaySchedule[]): number {
  let total = 0;
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  while (cur <= end) {
    total += availableHoursForDay(cur, schedule);
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class StatsService {
  constructor(
    private bookingRepo: Repository<Booking>,
    private settingsRepo: Repository<AppSettings>,
    private profileRepo: Repository<ClubProfile>
  ) {}

  async getRevenue(): Promise<RevenueStats> {
    const [bookings, settings, profile] = await Promise.all([
      this.bookingRepo.find({ where: { status: "CONFIRMED" } }),
      this.settingsRepo.findOneBy({ id: 1 }),
      this.profileRepo.findOneBy({ id: 1 }),
    ]);

    const hourlyRate = Number(settings?.hourlyRate ?? 0);
    const now = new Date();

    // Parse business hours schedule
    let schedule: DaySchedule[] = [];
    if (profile?.businessHoursJson) {
      try { schedule = JSON.parse(profile.businessHoursJson); } catch { /* ignore */ }
    }
    // Default: Mon–Sat 08:00–22:00, Sun closed
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

    // ── Revenue buckets ───────────────────────────────────────────────────────
    const dayMap   = new Map<string, { revenue: number; bookings: number; hours: number }>();
    const weekMap  = new Map<string, { revenue: number; bookings: number; hours: number }>();
    const monthMap = new Map<string, { revenue: number; bookings: number; hours: number }>();

    const addTo = (
      map: Map<string, { revenue: number; bookings: number; hours: number }>,
      key: string,
      hours: number
    ) => {
      const e = map.get(key) ?? { revenue: 0, bookings: 0, hours: 0 };
      e.hours += hours;
      e.revenue += hours * hourlyRate;
      e.bookings += 1;
      map.set(key, e);
    };

    // ── Court occupancy accumulators ──────────────────────────────────────────
    const courtMap = new Map<number, { name: string; hours: number; bookings: number }>();
    let earliestDate: Date | null = null;

    for (const b of bookings) {
      const start = new Date(b.startTime);
      const end   = new Date(b.endTime);
      const hrs   = durationHours(start, end);
      if (hrs <= 0) continue;

      // Revenue
      addTo(dayMap,   isoDay(start),   hrs);
      addTo(weekMap,  isoWeek(start),  hrs);
      addTo(monthMap, isoMonth(start), hrs);

      // Court accumulator
      const cid   = b.court.id!;
      const cname = b.court.name ?? `Cancha ${cid}`;
      const ce    = courtMap.get(cid) ?? { name: cname, hours: 0, bookings: 0 };
      ce.hours    += hrs;
      ce.bookings += 1;
      courtMap.set(cid, ce);

      // Track earliest booking date
      if (!earliestDate || start < earliestDate) earliestDate = start;
    }

    // ── Available hours calculation ───────────────────────────────────────────
    const periodStart = earliestDate ?? now;
    const availableHoursPerCourt = totalAvailableHours(periodStart, now, schedule);
    const periodDays = Math.round(
      (now.getTime() - new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()).getTime())
        / 86400000
    ) + 1;

    const totalBookedHours = Array.from(courtMap.values()).reduce((s, e) => s + e.hours, 0);

    const courtOccupancy: CourtOccupancy[] = Array.from(courtMap.entries())
      .map(([courtId, e]) => ({
        courtId,
        courtName: e.name,
        bookedHours: e.hours,
        availableHours: availableHoursPerCourt,
        occupancyPct: availableHoursPerCourt > 0 ? (e.hours / availableHoursPerCourt) * 100 : 0,
        bookings: e.bookings,
        share: totalBookedHours > 0 ? (e.hours / totalBookedHours) * 100 : 0,
      }))
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

    const todayKey  = isoDay(now);
    const weekKey   = isoWeek(now);
    const monthKey  = isoMonth(now);
    const allTime   = Array.from(dayMap.values()).reduce((s, e) => s + e.revenue, 0);

    return {
      hourlyRate,
      daily:   buildDaily(),
      weekly:  buildWeekly(),
      monthly: buildMonthly(),
      totals: {
        day:     dayMap.get(todayKey)?.revenue  ?? 0,
        week:    weekMap.get(weekKey)?.revenue  ?? 0,
        month:   monthMap.get(monthKey)?.revenue ?? 0,
        allTime,
      },
      courtOccupancy,
      occupancySummary: {
        availableHoursPerCourt,
        totalBookedHours,
        overallOccupancyPct:
          availableHoursPerCourt > 0 && courtMap.size > 0
            ? (totalBookedHours / (availableHoursPerCourt * courtMap.size)) * 100
            : 0,
        periodDays,
      },
    };
  }
}

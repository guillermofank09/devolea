import { Repository } from "typeorm";
import { Booking } from "../entities/Booking";
import { AppSettings } from "../entities/AppSettings";
import { ClubProfile } from "../entities/ClubProfile";
import { Court } from "../entities/Court";
import { Profesor } from "../entities/Profesor";
import { Player } from "../entities/Player";
import { Tournament } from "../entities/Tournament";
import { TournamentMatch } from "../entities/TournamentMatch";

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
  bookingTotals: {
    day: number;
    week: number;
    month: number;
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

// ── Profesor billing ──────────────────────────────────────────────────────────

export interface ProfesorBillingEntry {
  profesorId: number;
  name: string;
  ownRate: number | null;
  effectiveRate: number;
  classHourlyRate: number;
  monthlyClasses: number;
  monthlyHours: number;
  monthlyRevenue: number;
  allTimeClasses: number;
  allTimeHours: number;
  allTimeRevenue: number;
}

// ── Player stats ──────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ["PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA","SEXTA","SEPTIMA","SIN_CATEGORIA"] as const;

export interface PlayerCategoryEntry {
  category: string;
  masculino: number;
  femenino: number;
  total: number;
}

// ── Ranking ───────────────────────────────────────────────────────────────────

function isTeamSport(sport?: string | null): boolean {
  if (!sport) return false;
  return sport.startsWith("FUTBOL") || sport === "VOLEY" || sport === "BASQUET";
}

const PHASE_POINTS: Record<string, number> = {
  "Campeón":   100,
  "Final":      70,
  "Semifinal":  50,
  "Cuartos":    30,
  "Octavos":    20,
};

function phaseFromEnd(fromEnd: number): string {
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Cuartos";
  if (fromEnd === 3) return "Octavos";
  return "Fase Grupal";
}

export interface TournamentResult {
  tournamentId: number;
  tournamentName: string;
  phase: string;
  points: number;
}

export interface RankingEntry {
  id: string;
  name: string;
  type: "pair" | "team";
  results: TournamentResult[];
  total: number;
}

export interface RankingResponse {
  sport: string | null;
  category: string | null;
  availableSports: string[];
  availableCategories: string[];
  ranking: RankingEntry[];
}

export class StatsService {
  constructor(
    private bookingRepo: Repository<Booking>,
    private settingsRepo: Repository<AppSettings>,
    private profileRepo: Repository<ClubProfile>,
    private courtRepo: Repository<Court>,
    private profesorRepo: Repository<Profesor>,
    private playerRepo: Repository<Player>,
    private tournamentRepo: Repository<Tournament>,
    private matchRepo: Repository<TournamentMatch>
  ) {}

  async getRevenue(userId: number): Promise<RevenueStats> {
    const [bookings, settings, profile, allCourts] = await Promise.all([
      this.bookingRepo.find({ where: { userId, status: "CONFIRMED" } }),
      this.settingsRepo.findOneBy({ userId }),
      this.profileRepo.findOneBy({ userId }),
      this.courtRepo.find({ where: { userId } }),
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
      bookingTotals: {
        day:   dayMap.get(todayKey)?.bookings   ?? 0,
        week:  weekMap.get(weekKey)?.bookings   ?? 0,
        month: monthMap.get(monthKey)?.bookings ?? 0,
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

  async getProfesorStats(userId: number): Promise<ProfesorBillingEntry[]> {
    const [profesores, bookings, settings] = await Promise.all([
      this.profesorRepo.find({ where: { userId } }),
      this.bookingRepo.find({ where: { userId, status: "CONFIRMED" } }),
      this.settingsRepo.findOneBy({ userId }),
    ]);

    const classHourlyRate = Number(settings?.classHourlyRate ?? 0);
    const now = new Date();
    const currentMonthKey = isoMonth(now);

    // Only bookings linked to a profesor
    const profesorBookings = bookings.filter((b) => b.profesor != null);

    return profesores
      .map((p) => {
        const ownRate = p.hourlyRate != null ? Number(p.hourlyRate) : null;
        const effectiveRate = ownRate ?? classHourlyRate;
        const pBookings = profesorBookings.filter((b) => b.profesor!.id === p.id);

        let monthlyClasses = 0, monthlyHours = 0, monthlyRevenue = 0;
        let allTimeClasses = 0, allTimeHours = 0, allTimeRevenue = 0;

        for (const b of pBookings) {
          const start = new Date(b.startTime);
          const end   = new Date(b.endTime);
          const hrs   = durationHours(start, end);
          if (hrs <= 0) continue;

          const revenue = b.price != null ? Number(b.price) : hrs * effectiveRate;

          allTimeClasses++;
          allTimeHours   += hrs;
          allTimeRevenue += revenue;

          if (isoMonth(start) === currentMonthKey) {
            monthlyClasses++;
            monthlyHours   += hrs;
            monthlyRevenue += revenue;
          }
        }

        return { profesorId: p.id, name: p.name, ownRate, effectiveRate, classHourlyRate, monthlyClasses, monthlyHours, monthlyRevenue, allTimeClasses, allTimeHours, allTimeRevenue };
      })
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
  }

  async getPlayerStats(userId: number): Promise<PlayerCategoryEntry[]> {
    const players = await this.playerRepo.find({ where: { userId } });
    return CATEGORY_ORDER
      .map((cat) => ({
        category: cat,
        masculino: players.filter((p) => p.category === cat && p.sex === "MASCULINO").length,
        femenino:  players.filter((p) => p.category === cat && p.sex === "FEMENINO").length,
        total:     players.filter((p) => p.category === cat).length,
      }))
      .filter((e) => e.total > 0);
  }

  async getRanking(userId: number, sport?: string, category?: string): Promise<RankingResponse> {
    const allTournaments = await this.tournamentRepo.find({
      where: { userId, format: "BRACKET" },
    });

    const availableSports = [...new Set(
      allTournaments.map(t => t.sport).filter((s): s is string => Boolean(s))
    )].sort();
    const availableCategories = [...new Set(allTournaments.map(t => t.category))].sort();

    const tournaments = allTournaments.filter(t =>
      (!sport || t.sport === sport) &&
      (!category || t.category === category)
    );

    const participantMap = new Map<string, Omit<RankingEntry, "total">>();

    const pairName = (pair: any): string => {
      const n1: string = pair?.player1?.name ?? "?";
      const n2: string | undefined = pair?.player2?.name;
      return n2 ? `${n1} / ${n2}` : n1;
    };

    for (const t of tournaments) {
      const matches = await this.matchRepo.find({
        where: { tournament: { id: t.id } },
      });
      if (!matches.length) continue;

      const completedMatches = matches.filter(m => m.status === "COMPLETED");
      if (!completedMatches.length) continue;

      const totalRounds = Math.max(...matches.map(m => m.round));
      const teamMode = isTeamSport(t.sport);

      // Track highest round each participant was eliminated in
      const eliminated = new Map<number, { round: number; name: string; key: string }>();
      let championId: number | null = null;
      let championName = "";
      let championKey = "";

      for (const match of completedMatches) {
        if (teamMode) {
          const p1 = match.team1;
          const p2 = match.team2;
          if (!p1 || !p2 || match.winnerId == null) continue;

          const loserId = match.winnerId === p1.id ? p2.id : p1.id;
          const loserName = match.winnerId === p1.id ? p2.equipo.name : p1.equipo.name;
          const loserKey = `team-${loserId}`;

          const prev = eliminated.get(loserId);
          if (!prev || prev.round < match.round) {
            eliminated.set(loserId, { round: match.round, name: loserName, key: loserKey });
          }

          if (match.round === totalRounds) {
            championId = match.winnerId;
            const winner = match.winnerId === p1.id ? p1 : p2;
            championName = winner.equipo.name;
            championKey = `team-${championId}`;
          }
        } else {
          const p1 = match.pair1;
          const p2 = match.pair2;
          if (!p1 || !p2 || match.winnerId == null) continue;

          const loserId = match.winnerId === p1.id ? p2.id : p1.id;
          const loserName = match.winnerId === p1.id ? pairName(p2) : pairName(p1);
          const loserKey = `pair-${loserId}`;

          const prev = eliminated.get(loserId);
          if (!prev || prev.round < match.round) {
            eliminated.set(loserId, { round: match.round, name: loserName, key: loserKey });
          }

          if (match.round === totalRounds) {
            championId = match.winnerId;
            const winner = match.winnerId === p1.id ? p1 : p2;
            championName = pairName(winner);
            championKey = `pair-${championId}`;
          }
        }
      }

      if (championId != null) {
        const entry = participantMap.get(championKey) ?? {
          id: championKey, name: championName, type: teamMode ? "team" : "pair", results: [],
        };
        entry.results.push({ tournamentId: t.id, tournamentName: t.name, phase: "Campeón", points: 100 });
        participantMap.set(championKey, entry);
      }

      for (const [, { round, name, key }] of eliminated) {
        const fromEnd = totalRounds - round;
        const phase = phaseFromEnd(fromEnd);
        const points = PHASE_POINTS[phase] ?? 10;
        const entry = participantMap.get(key) ?? {
          id: key, name, type: teamMode ? "team" : "pair", results: [],
        };
        entry.results.push({ tournamentId: t.id, tournamentName: t.name, phase, points });
        participantMap.set(key, entry);
      }
    }

    const ranking: RankingEntry[] = Array.from(participantMap.values())
      .map(p => ({ ...p, total: p.results.reduce((s, r) => s + r.points, 0) }))
      .sort((a, b) => b.total - a.total);

    return { sport: sport ?? null, category: category ?? null, availableSports, availableCategories, ranking };
  }
}

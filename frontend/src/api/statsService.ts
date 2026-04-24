import axios from "axios";
import { API_BASE } from "./config";

const API = `${API_BASE}/api`;

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
  occupancyPct: number;
  bookings: number;
  share: number;
}

export interface OccupancySummary {
  availableHoursPerCourt: number;
  totalBookedHours: number;
  overallOccupancyPct: number;
  periodDays: number;
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
  bookingTotals: {
    day: number;
    week: number;
    month: number;
  };
  courtOccupancy: CourtOccupancy[];
  occupancySummary: OccupancySummary;
}

export async function fetchRevenue(): Promise<RevenueStats> {
  const { data } = await axios.get<RevenueStats>(`${API}/stats/revenue`);
  return data;
}

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

export async function fetchProfesorStats(): Promise<ProfesorBillingEntry[]> {
  const { data } = await axios.get<ProfesorBillingEntry[]>(`${API}/stats/profesores`);
  return data;
}

export interface PlayerCategoryEntry {
  category: string;
  masculino: number;
  femenino: number;
  total: number;
}

export async function fetchPlayerStats(): Promise<PlayerCategoryEntry[]> {
  const { data } = await axios.get<PlayerCategoryEntry[]>(`${API}/stats/players`);
  return data;
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

export async function fetchRanking(sport?: string, category?: string): Promise<RankingResponse> {
  const params: Record<string, string> = {};
  if (sport) params.sport = sport;
  if (category) params.category = category;
  const { data } = await axios.get<RankingResponse>(`${API}/stats/ranking`, { params });
  return data;
}

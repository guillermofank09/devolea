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

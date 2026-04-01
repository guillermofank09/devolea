import axios from "axios";

const API = "http://localhost:3001/api";

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

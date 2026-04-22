import axios from "axios";
import type { Tournament, TournamentDetail } from "../types/Tournament";
import type { DaySchedule } from "../types/ClubProfile";
import { API_BASE } from "./config";

export interface PublicProfesor {
  id: number;
  name: string;
  phone: string | null;
  sex: "MASCULINO" | "FEMENINO" | null;
  avatarUrl: string | null;
  sport: string | null;
  schedule: DaySchedule[] | null;
}

const BASE = `${API_BASE}/api`;

export interface PublicProfile {
  clubName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  logoBase64?: string | null;  // legacy
  logoUrl?: string | null;     // new
  phone?: string | null;
  businessHours: DaySchedule[];
  courtsBySport?: Record<string, string[]>;
  showTournaments: boolean;
  showCourts: boolean;
  showProfesores: boolean;
}

export const fetchPublicProfile = (username: string): Promise<PublicProfile> =>
  axios.get(`${BASE}/public/${username}`).then(r => r.data);

export interface PaginatedTournaments {
  data: Tournament[];
  total: number;
  page: number;
  totalPages: number;
  availableSports: string[];
}

export const fetchPublicTournaments = (
  username: string,
  params: { page?: number; search?: string; sport?: string } = {},
): Promise<PaginatedTournaments> =>
  axios.get(`${BASE}/public/${username}/tournaments`, { params }).then(r => r.data);

export const fetchPublicTournamentDetail = (username: string, tournamentId: number): Promise<TournamentDetail> =>
  axios.get(`${BASE}/public/${username}/tournaments/${tournamentId}`).then(r => r.data);

export interface PublicCourt {
  id: number;
  name: string;
  type: string;
  status: string;
  sport: string;
}

export interface PublicBookingSlot {
  courtId: number;
  startTime: string;
  endTime: string;
}

export interface PublicCourtsData {
  courts: PublicCourt[];
  bookings: PublicBookingSlot[];
  total: number;
  totalPages: number;
  availableSports: string[];
}

export const fetchPublicCourts = (
  username: string,
  from: string,
  to: string,
  params: { page?: number; sport?: string } = {},
): Promise<PublicCourtsData> =>
  axios.get(`${BASE}/public/${username}/courts`, { params: { from, to, ...params } }).then(r => r.data);

export interface PaginatedProfesores {
  data: PublicProfesor[];
  total: number;
  page: number;
  totalPages: number;
}

export const fetchPublicProfesores = (
  username: string,
  params: { page?: number; search?: string } = {},
): Promise<PaginatedProfesores> =>
  axios.get(`${BASE}/public/${username}/profesores`, { params }).then(r => r.data);

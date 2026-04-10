import axios from "axios";
import type { Tournament, TournamentDetail } from "../types/Tournament";
import type { DaySchedule } from "../types/ClubProfile";
import { API_BASE } from "./config";

export interface PublicProfesor {
  id: number;
  name: string;
  phone: string | null;
  schedule: DaySchedule[] | null;
}

const BASE = `${API_BASE}/api`;

export interface PublicProfile {
  clubName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  logoBase64?: string | null;
  businessHours: DaySchedule[];
  showTournaments: boolean;
  showCourts: boolean;
  showProfesores: boolean;
}

export const fetchPublicProfile = (username: string): Promise<PublicProfile> =>
  axios.get(`${BASE}/public/${username}`).then(r => r.data);

export const fetchPublicTournaments = (username: string): Promise<Tournament[]> =>
  axios.get(`${BASE}/public/${username}/tournaments`).then(r => r.data);

export const fetchPublicTournamentDetail = (username: string, tournamentId: number): Promise<TournamentDetail> =>
  axios.get(`${BASE}/public/${username}/tournaments/${tournamentId}`).then(r => r.data);

export interface PublicCourt {
  id: number;
  name: string;
  type: string;
  status: string;
}

export interface PublicBookingSlot {
  courtId: number;
  startTime: string;
  endTime: string;
}

export interface PublicCourtsData {
  courts: PublicCourt[];
  bookings: PublicBookingSlot[];
}

export const fetchPublicCourts = (username: string, from: string, to: string): Promise<PublicCourtsData> =>
  axios.get(`${BASE}/public/${username}/courts`, { params: { from, to } }).then(r => r.data);

export const fetchPublicProfesores = (username: string): Promise<PublicProfesor[]> =>
  axios.get(`${BASE}/public/${username}/profesores`).then(r => r.data);

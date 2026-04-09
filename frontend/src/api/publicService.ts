import axios from "axios";
import type { Tournament, TournamentDetail } from "../types/Tournament";
import type { DaySchedule } from "../types/ClubProfile";
import { API_BASE } from "./config";

const BASE = `${API_BASE}/api`;

export interface PublicProfile {
  clubName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  logoBase64?: string | null;
  businessHours: DaySchedule[];
}

export const fetchPublicProfile = (username: string): Promise<PublicProfile> =>
  axios.get(`${BASE}/public/${username}`).then(r => r.data);

export const fetchPublicTournaments = (username: string): Promise<Tournament[]> =>
  axios.get(`${BASE}/public/${username}/tournaments`).then(r => r.data);

export const fetchPublicTournamentDetail = (username: string, tournamentId: number): Promise<TournamentDetail> =>
  axios.get(`${BASE}/public/${username}/tournaments/${tournamentId}`).then(r => r.data);

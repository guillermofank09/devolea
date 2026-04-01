import axios from "axios";
import type { Tournament, TournamentDetail, TournamentFormData, Pair, TournamentMatch } from "../types/Tournament";

const BASE = "http://localhost:3001/api";

export const fetchTournaments = (): Promise<Tournament[]> =>
  axios.get(`${BASE}/tournaments`).then(r => r.data);

export const fetchTournamentById = (id: number): Promise<TournamentDetail> =>
  axios.get(`${BASE}/tournaments/${id}`).then(r => r.data);

export const createTournament = (data: TournamentFormData): Promise<Tournament> =>
  axios.post(`${BASE}/tournaments`, data).then(r => r.data);

export const updateTournament = (id: number, data: Partial<TournamentFormData>): Promise<Tournament> =>
  axios.put(`${BASE}/tournaments/${id}`, data).then(r => r.data);

export const deleteTournament = (id: number): Promise<void> =>
  axios.delete(`${BASE}/tournaments/${id}`).then(() => undefined);

export const addPair = (tournamentId: number, player1Id: number, player2Id: number): Promise<Pair> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/pairs`, { player1Id, player2Id }).then(r => r.data);

export const removePair = (tournamentId: number, pairId: number): Promise<void> =>
  axios.delete(`${BASE}/tournaments/${tournamentId}/pairs/${pairId}`).then(() => undefined);

export const generateMatches = (tournamentId: number, startTime: string): Promise<TournamentMatch[]> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/generate`, { startTime }).then(r => r.data);

export const triggerNextRound = (tournamentId: number, startTime: string): Promise<TournamentMatch[]> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/next-round`, { startTime }).then(r => r.data);

export const updateMatch = (matchId: number, data: {
  scheduledAt?: string | null;
  pair1Id?: number | null;
  pair2Id?: number | null;
  winnerId?: number | null;
  result?: string;
  status?: string;
}): Promise<TournamentMatch> =>
  axios.put(`${BASE}/tournaments/matches/${matchId}`, data).then(r => r.data);

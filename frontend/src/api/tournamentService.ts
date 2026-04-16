import axios from "axios";
import type { Tournament, TournamentDetail, TournamentFormData, Pair, TournamentMatch } from "../types/Tournament";
import { API_BASE } from "./config";

const BASE = `${API_BASE}/api`;

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

export const addPair = (tournamentId: number, player1Id: number, player2Id: number, opts?: {
  player1InscriptionPaid?: boolean;
  player2InscriptionPaid?: boolean;
  preferredStartTimes?: string[] | null;
}): Promise<Pair> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/pairs`, { player1Id, player2Id, ...opts }).then(r => r.data);

export const removePair = (tournamentId: number, pairId: number): Promise<void> =>
  axios.delete(`${BASE}/tournaments/${tournamentId}/pairs/${pairId}`).then(() => undefined);

export const updatePair = (tournamentId: number, pairId: number, dto: {
  player1Id?: number;
  player2Id?: number;
  player1InscriptionPaid?: boolean;
  player2InscriptionPaid?: boolean;
  preferredStartTimes?: string[] | null;
}): Promise<Pair> =>
  axios.patch(`${BASE}/tournaments/${tournamentId}/pairs/${pairId}`, dto).then(r => r.data);

export const resetMatches = (tournamentId: number): Promise<void> =>
  axios.delete(`${BASE}/tournaments/${tournamentId}/matches`).then(() => undefined);

export const generateMatches = (tournamentId: number, startTime: string, courtIds?: number[], matchDuration?: number, format?: string): Promise<TournamentMatch[]> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/generate`, { startTime, courtIds, matchDuration, format }).then(r => r.data);

export const triggerNextRound = (tournamentId: number, startTime: string, matchDuration?: number): Promise<TournamentMatch[]> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/next-round`, { startTime, matchDuration }).then(r => r.data);

export const triggerRepechage = (tournamentId: number): Promise<TournamentMatch[]> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/repechage`).then(r => r.data);

export const createPlaceholderMatch = (tournamentId: number, round: number, matchNumber: number): Promise<TournamentMatch> =>
  axios.post(`${BASE}/tournaments/${tournamentId}/placeholder-match`, { round, matchNumber }).then(r => r.data);

export const fetchMatchesByCourt = (courtId: number): Promise<TournamentMatch[]> =>
  axios.get(`${BASE}/tournaments/matches/court/${courtId}`).then(r => r.data);

export const updateMatch = (matchId: number, data: {
  scheduledAt?: string | null;
  pair1Id?: number | null;
  pair2Id?: number | null;
  winnerId?: number | null;
  result?: string;
  status?: string;
  courtId?: number | null;
  liveStatus?: string | null;
  delayedUntil?: string | null;
}): Promise<TournamentMatch> =>
  axios.put(`${BASE}/tournaments/matches/${matchId}`, data).then(r => r.data);

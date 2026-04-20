import type { Player } from "./Player";
import type { Equipo } from "./Equipo";

export type TournamentStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type TournamentFormat = "ROUND_ROBIN" | "BRACKET";
export type TournamentCategory = "PRIMERA" | "SEGUNDA" | "TERCERA" | "CUARTA" | "QUINTA" | "SEXTA" | "SEPTIMA" | "SIN_CATEGORIA";
export type TournamentSex = "MASCULINO" | "FEMENINO" | "MIXTO";
export type MatchStatus = "PENDING" | "COMPLETED" | "BYE";
export type MatchLiveStatus = "IN_PLAY" | "DELAYED" | "EARLY";

export interface TournamentTeam {
  id: number;
  equipo: Equipo;
}

export interface Tournament {
  id: number;
  name: string;
  category: TournamentCategory;
  sex: TournamentSex;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  format?: TournamentFormat;
  sport?: string;
  createdAt: string;
}

export interface TournamentFormData {
  name: string;
  category: TournamentCategory;
  sex: TournamentSex;
  startDate: string;
  endDate: string;
  sport?: string;
}

export interface Pair {
  id: number;
  player1: Player;
  player2: Player | null;
  player1InscriptionPaid: boolean;
  player2InscriptionPaid: boolean;
  preferredStartTimes?: string[];
}

export interface MatchGoal {
  playerName: string;
  teamId: number;
  minute: number;
}

export interface TournamentMatch {
  id: number;
  pair1?: Pair | null;
  pair2?: Pair | null;
  team1?: TournamentTeam | null;
  team2?: TournamentTeam | null;
  court?: { id: number; name: string } | null;
  scheduledAt?: string | null;
  round: number;
  matchNumber: number;
  status: MatchStatus;
  winnerId?: number | null;
  result?: string | null;
  goals?: MatchGoal[] | null;
  isRepechage?: boolean;
  liveStatus?: MatchLiveStatus | null;
  delayedUntil?: string | null;
  tournament?: { id: number; name: string };
}

export interface TournamentDetail extends Tournament {
  pairs: Pair[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
}

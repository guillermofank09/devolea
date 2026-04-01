import type { Player } from "./Player";

export type TournamentStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type TournamentFormat = "ROUND_ROBIN" | "BRACKET";
export type TournamentCategory = "PRIMERA" | "SEGUNDA" | "TERCERA" | "CUARTA" | "QUINTA" | "SEXTA" | "SEPTIMA";
export type MatchStatus = "PENDING" | "COMPLETED" | "BYE";

export interface Tournament {
  id: number;
  name: string;
  category: TournamentCategory;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  format?: TournamentFormat;
  createdAt: string;
}

export interface TournamentFormData {
  name: string;
  category: TournamentCategory;
  startDate: string;
  endDate: string;
}

export interface Pair {
  id: number;
  player1: Player;
  player2: Player;
}

export interface TournamentMatch {
  id: number;
  pair1?: Pair | null;
  pair2?: Pair | null;
  scheduledAt?: string | null;
  round: number;
  matchNumber: number;
  status: MatchStatus;
  winnerId?: number | null;
  result?: string | null;
}

export interface TournamentDetail extends Tournament {
  pairs: Pair[];
  matches: TournamentMatch[];
}

import type { Player } from "./Player";

export type TournamentStatus = "DRAFT" | "ACTIVE" | "COMPLETED";
export type TournamentFormat = "ROUND_ROBIN" | "BRACKET";
export type TournamentCategory = "PRIMERA" | "SEGUNDA" | "TERCERA" | "CUARTA" | "QUINTA" | "SEXTA" | "SEPTIMA" | "SIN_CATEGORIA";
export type TournamentSex = "MASCULINO" | "FEMENINO" | "MIXTO";
export type MatchStatus = "PENDING" | "COMPLETED" | "BYE";
export type MatchLiveStatus = "IN_PLAY" | "DELAYED" | "EARLY";

export interface Tournament {
  id: number;
  name: string;
  category: TournamentCategory;
  sex: TournamentSex;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  format?: TournamentFormat;
  createdAt: string;
}

export interface TournamentFormData {
  name: string;
  category: TournamentCategory;
  sex: TournamentSex;
  startDate: string;
  endDate: string;
}

export interface Pair {
  id: number;
  player1: Player;
  player2: Player;
  player1InscriptionPaid: boolean;
  player2InscriptionPaid: boolean;
  preferredStartTimes?: string[];
}

export interface TournamentMatch {
  id: number;
  pair1?: Pair | null;
  pair2?: Pair | null;
  court?: { id: number; name: string } | null;
  scheduledAt?: string | null;
  round: number;
  matchNumber: number;
  status: MatchStatus;
  winnerId?: number | null;
  result?: string | null;
  isRepechage?: boolean;
  liveStatus?: MatchLiveStatus | null;
  delayedUntil?: string | null;
  tournament?: { id: number; name: string };
}

export interface TournamentDetail extends Tournament {
  pairs: Pair[];
  matches: TournamentMatch[];
}

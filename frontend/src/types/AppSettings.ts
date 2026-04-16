export interface AppSettings {
  id?: number;
  hourlyRate: number;
  classHourlyRate: number;
  shareSchedules: boolean;
  showTournaments: boolean;
  showCourts: boolean;
  showProfesores: boolean;
  tournamentMatchDuration: number;
  tournamentSetsCount: number;
  sportPricesJson?: string;
  sportClassPricesJson?: string;
  sportPrices?: Record<string, number>;
  sportClassPrices?: Record<string, number>;
  tournamentDurationsJson?: string;
  tournamentDurations?: Record<string, number>;
  tournamentSetsJson?: string;
  tournamentSets?: Record<string, number>;
}

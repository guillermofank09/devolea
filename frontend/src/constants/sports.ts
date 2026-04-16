export type Sport = "PADEL" | "TENIS" | "FUTBOL" | "VOLEY" | "BASQUET";

export const SPORTS: { value: Sport; label: string }[] = [
  { value: "PADEL",   label: "Pádel" },
  { value: "TENIS",   label: "Tenis" },
  { value: "FUTBOL",  label: "Fútbol" },
  { value: "VOLEY",   label: "Vóley" },
  { value: "BASQUET", label: "Básquet" },
];

export const SPORT_LABEL: Record<Sport, string> = Object.fromEntries(
  SPORTS.map(s => [s.value, s.label])
) as Record<Sport, string>;

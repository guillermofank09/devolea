import { useState, useMemo } from "react";
import {
  Grid,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { Court, CourtStatus } from "../../types/Court";
import type { Booking } from "../../types/Booking";
import type { AppSettings } from "../../types/AppSettings";
import { fetchSettings } from "../../api/settingsService";
import { SPORT_LABEL } from "../../constants/sports";
import CourtCard from "./CourtCard";
import EmptyState from "../../components/common/EmptyState";

type FilterStatus = CourtStatus | "ALL";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "ALL",           label: "Todas" },
  { value: "AVAILABLE",     label: "Disponibles" },
  { value: "IN USE",        label: "En Uso" },
  { value: "NOT AVAILABLE", label: "No Disponibles" },
];

export default function CourtList({
  onSelect,
  courts,
  todayBookings = [],
}: {
  onSelect: (court: Court) => void;
  courts: Court[];
  todayBookings?: Booking[];
}) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [sportFilter, setSportFilter] = useState<string | null>(null);

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  // Derive unique sports present in courts
  const availableSports = useMemo(() => {
    const sports = courts.map((c) => c.sport).filter(Boolean) as string[];
    return [...new Set(sports)];
  }, [courts]);

  const filtered = courts.filter((c) => {
    if (filter !== "ALL" && c.status !== filter) return false;
    if (sportFilter && c.sport !== sportFilter) return false;
    return true;
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} {filtered.length === 1 ? "cancha" : "canchas"}
          </Typography>

          {availableSports.length > 1 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label="Todos"
                size="small"
                variant={sportFilter === null ? "filled" : "outlined"}
                onClick={() => setSportFilter(null)}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
              {availableSports.map((sport) => (
                <Chip
                  key={sport}
                  label={SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport}
                  size="small"
                  variant={sportFilter === sport ? "filled" : "outlined"}
                  onClick={() => setSportFilter(sport === sportFilter ? null : sport)}
                  sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                />
              ))}
            </Box>
          )}
        </Box>

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => val && setFilter(val)}
          size="small"
          sx={{ flexWrap: "wrap" }}
        >
          {FILTER_OPTIONS.map((opt) => (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        {filtered.map((court: Court) => (
          <Grid key={court.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <CourtCard
              court={court}
              onSelect={onSelect}
              hourlyRate={settings?.hourlyRate}
              todayBookings={todayBookings.filter((b) => b.court.id === court.id)}
            />
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <EmptyState message="No hay canchas con ese filtro." />
      )}
    </Box>
  );
}

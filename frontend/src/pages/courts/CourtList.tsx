import { useState } from "react";
import {
  Grid,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { Court, CourtStatus } from "../../types/Court";
import type { AppSettings } from "../../types/AppSettings";
import { fetchSettings } from "../../api/settingsService";
import CourtCard from "./CourtCard";

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
}: {
  onSelect: (court: Court) => void;
  courts: Court[];
}) {
  const [filter, setFilter] = useState<FilterStatus>("ALL");

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  const filtered =
    filter === "ALL" ? courts : courts.filter((c) => c.status === filter);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {filtered.length} {filtered.length === 1 ? "cancha" : "canchas"}
        </Typography>
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
            <CourtCard court={court} onSelect={onSelect} hourlyRate={settings?.hourlyRate} />
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">
            No hay canchas con ese estado.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

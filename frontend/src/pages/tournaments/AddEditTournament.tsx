import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTournament, updateTournament } from "../../api/tournamentService";
import type { Tournament, TournamentCategory, TournamentSex, TournamentFormData } from "../../types/Tournament";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { fetchCourts } from "../../api/courtService";
import type { Court } from "../../types/Court";
import PageLoader from "../../components/common/PageLoader";

const toDate = (s: string): Date | null => (s ? parseISO(s) : null);
const fromDate = (d: Date | null): string => (d ? format(d, "yyyy-MM-dd") : "");

export function isTeamSport(sport?: string | null): boolean {
  if (!sport) return false;
  return sport.startsWith("FUTBOL") || sport === "VOLEY" || sport === "BASQUET";
}

export const SPORT_LABELS: Record<string, string> = {
  PADEL: "Pádel", TENIS: "Tenis",
  FUTBOL: "Fútbol", FUTBOL5: "Fútbol 5", FUTBOL7: "Fútbol 7", FUTBOL9: "Fútbol 9", FUTBOL11: "Fútbol 11",
  VOLEY: "Voley", BASQUET: "Básquet",
};

const SEX_OPTIONS: { value: TournamentSex; label: string }[] = [
  { value: "MIXTO",     label: "Mixto" },
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO",  label: "Femenino" },
];

const CATEGORIES: { value: TournamentCategory; label: string }[] = [
  { value: "SIN_CATEGORIA", label: "Sin Categoría" },
  { value: "PRIMERA",       label: "1ra" },
  { value: "SEGUNDA",       label: "2da" },
  { value: "TERCERA",       label: "3ra" },
  { value: "CUARTA",        label: "4ta" },
  { value: "QUINTA",        label: "5ta" },
  { value: "SEXTA",         label: "6ta" },
  { value: "SEPTIMA",       label: "7ma" },
];

const EMPTY: TournamentFormData = {
  name: "",
  category: "SIN_CATEGORIA",
  sex: "MIXTO",
  startDate: "",
  endDate: "",
  sport: "",
};


interface Props {
  open: boolean;
  onClose: () => void;
  tournament?: Tournament | null;
  hasMatches?: boolean;
}

export default function AddEditTournament({ open, onClose, tournament, hasMatches = false }: Props) {
  const [form, setForm] = useState<TournamentFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!tournament;
  const { user } = useAuth();
  // Use configured sports, fall back to all available sports if none configured
  const ALL_SPORTS = ["PADEL", "TENIS", "FUTBOL", "VOLEY", "BASQUET"];
  const configuredSports = user?.sports ?? [];
  const sports = configuredSports.length > 0 ? configuredSports : ALL_SPORTS;
  const hasFutbol = sports.includes("FUTBOL");

  const { data: courts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open && hasFutbol,
  });

  // Build sport options: expand FUTBOL into specific subtypes found in courts
  const sportOptions: { value: string; label: string }[] = [];
  for (const s of sports) {
    if (s === "FUTBOL") {
      const futbolTypes = [...new Set(
        courts.filter(c => c.sport === "FUTBOL").map(c => c.type as string)
      )].filter(t => t.startsWith("FUTBOL")).sort();
      if (futbolTypes.length > 0) {
        futbolTypes.forEach(t => sportOptions.push({ value: t, label: SPORT_LABELS[t] ?? t }));
      } else {
        sportOptions.push({ value: "FUTBOL", label: "Fútbol" });
      }
    } else {
      sportOptions.push({ value: s, label: SPORT_LABELS[s] ?? s });
    }
  }

  useEffect(() => {
    if (tournament) {
      setForm({
        name: tournament.name,
        category: tournament.category,
        sex: tournament.sex ?? "MIXTO",
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        sport: tournament.sport ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [tournament, open]);

  const set = (field: keyof TournamentFormData, value: string) =>
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "startDate" && next.endDate && next.endDate < value) {
        next.endDate = "";
      }
      if (field === "sport" && value) {
        const prevAutoName = prev.sport ? `Torneo ${SPORT_LABELS[prev.sport] ?? prev.sport}` : "";
        if (!prev.name.trim() || prev.name === prevAutoName) {
          next.name = `Torneo ${SPORT_LABELS[value] ?? value}`;
        }
      }
      if (field === "sport" && value && value !== "PADEL" && value !== "TENIS") {
        next.category = "SIN_CATEGORIA";
      }
      return next;
    });

  const mutation = useMutation({
    mutationFn: (data: TournamentFormData) =>
      isEditing ? updateTournament(tournament!.id, data) : createTournament(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentsData"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournament!.id)] });
      }
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al guardar el torneo");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  const isValid = form.name.trim() && form.startDate && form.endDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? "Editar torneo" : "Agregar torneo"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {sportOptions.length > 0 && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Deporte</FormLabel>
                <Select
                  fullWidth size="small"
                  value={form.sport ?? ""}
                  onChange={e => set("sport", e.target.value)}
                  disabled={isEditing && hasMatches}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {sportOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {isTeamSport(form.sport) && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    Los equipos competirán en este torneo (en vez de parejas)
                  </Typography>
                )}
              </Box>
            )}

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Nombre del torneo</FormLabel>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ej: Torneo de Otoño 2026"
                autoFocus
                sx={FORM_INPUT_SX}
              />
            </Box>

            {(() => {
              const showCategory = !form.sport || form.sport === "PADEL" || form.sport === "TENIS";
              return (
                <Box sx={{ display: "grid", gridTemplateColumns: showCategory ? { xs: "1fr", sm: "1fr 1fr" } : "1fr", gap: 2 }}>
                  {showCategory && (
                    <Box>
                      <FormLabel sx={FORM_LABEL_SX}>Categoría</FormLabel>
                      <Select
                        fullWidth
                        size="small"
                        value={form.category}
                        onChange={e => set("category", e.target.value)}
                        sx={{ height: 40, fontSize: "0.875rem" }}
                      >
                        {CATEGORIES.map(c => (
                          <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                  )}
                  <Box>
                    <FormLabel sx={FORM_LABEL_SX}>Sexo</FormLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={form.sex}
                      onChange={e => set("sex", e.target.value)}
                      sx={{ height: 40, fontSize: "0.875rem" }}
                    >
                      {SEX_OPTIONS.map(s => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
              );
            })()}

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                  <FormLabel sx={FORM_LABEL_SX}>Fecha de inicio</FormLabel>
                  <DatePicker
                    value={toDate(form.startDate)}
                    onChange={d => set("startDate", fromDate(d))}
                    slotProps={{
                      textField: { fullWidth: true, size: "small", sx: FORM_INPUT_SX },
                    }}
                  />
                </Box>
                <Box>
                  <FormLabel sx={FORM_LABEL_SX}>Fecha de fin</FormLabel>
                  <DatePicker
                    value={toDate(form.endDate)}
                    onChange={d => set("endDate", fromDate(d))}
                    minDate={toDate(form.startDate) ?? undefined}
                    slotProps={{
                      textField: { fullWidth: true, size: "small", sx: FORM_INPUT_SX },
                    }}
                  />
                </Box>
              </Box>
            </LocalizationProvider>

            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button
            onClick={onClose}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!isValid || mutation.isPending}
            fullWidth={fullScreen}
            startIcon={mutation.isPending ? <PageLoader size={14} /> : undefined}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {mutation.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

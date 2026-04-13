import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTournament, updateTournament } from "../../api/tournamentService";
import type { Tournament, TournamentCategory, TournamentSex, TournamentFormData } from "../../types/Tournament";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";

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
};

const dateSx = {
  ...FORM_INPUT_SX,
  "& input[type='date']::-webkit-calendar-picker-indicator": {
    opacity: 0.5,
    cursor: "pointer",
    "&:hover": { opacity: 1 },
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  tournament?: Tournament | null;
}

export default function AddEditTournament({ open, onClose, tournament }: Props) {
  const [form, setForm] = useState<TournamentFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!tournament;

  useEffect(() => {
    if (tournament) {
      setForm({
        name: tournament.name,
        category: tournament.category,
        sex: tournament.sex ?? "MIXTO",
        startDate: tournament.startDate,
        endDate: tournament.endDate,
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
      return next;
    });

  const mutation = useMutation({
    mutationFn: (data: TournamentFormData) =>
      isEditing ? updateTournament(tournament!.id, data) : createTournament(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentsData"] });
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

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
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

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Fecha de inicio</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                  sx={dateSx}
                />
              </Box>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Fecha de fin</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.endDate}
                  onChange={e => set("endDate", e.target.value)}
                  inputProps={{ min: form.startDate || undefined }}
                  sx={dateSx}
                />
              </Box>
            </Box>

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
            startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {mutation.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

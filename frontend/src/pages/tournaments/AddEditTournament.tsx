import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTournament, updateTournament } from "../../api/tournamentService";
import type { Tournament, TournamentCategory, TournamentFormData } from "../../types/Tournament";

const CATEGORIES: { value: TournamentCategory; label: string }[] = [
  { value: "PRIMERA", label: "1ra" },
  { value: "SEGUNDA", label: "2da" },
  { value: "TERCERA", label: "3ra" },
  { value: "CUARTA", label: "4ta" },
  { value: "QUINTA", label: "5ta" },
  { value: "SEXTA", label: "6ta" },
  { value: "SEPTIMA", label: "7ma" },
];

const EMPTY: TournamentFormData = {
  name: "",
  category: "CUARTA",
  startDate: "",
  endDate: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  tournament?: Tournament | null;
}

export default function AddEditTournament({ open, onClose, tournament }: Props) {
  const [form, setForm] = useState<TournamentFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isEditing = !!tournament;

  useEffect(() => {
    if (tournament) {
      setForm({
        name: tournament.name,
        category: tournament.category,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [tournament, open]);

  const set = (field: keyof TournamentFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? "Editar torneo" : "Agregar torneo"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 0.5 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="tournament-name">Nombre del torneo</FormLabel>
              <OutlinedInput
                id="tournament-name"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ej: Torneo de Otoño 2026"
                autoFocus
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="tournament-category">Categoría</FormLabel>
              <Select
                id="tournament-category"
                value={form.category}
                onChange={e => set("category", e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="tournament-start">Fecha de inicio</FormLabel>
                <OutlinedInput
                  id="tournament-start"
                  type="date"
                  value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel htmlFor="tournament-end">Fecha de fin</FormLabel>
                <OutlinedInput
                  id="tournament-end"
                  type="date"
                  value={form.endDate}
                  onChange={e => set("endDate", e.target.value)}
                />
              </FormControl>
            </Box>

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!isValid || mutation.isPending}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {mutation.isPending ? <CircularProgress size={18} /> : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

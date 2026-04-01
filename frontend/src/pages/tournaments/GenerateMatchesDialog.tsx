import { useState } from "react";
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
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateMatches } from "../../api/tournamentService";

interface Props {
  open: boolean;
  onClose: () => void;
  pairCount: number;
  tournamentId: number;
  onGenerated: () => void;
}

export default function GenerateMatchesDialog({ open, onClose, pairCount, tournamentId, onGenerated }: Props) {
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const format = pairCount <= 4 ? "Round Robin" : "Llaves (Bracket)";
  const formatDesc =
    pairCount <= 4
      ? `Con ${pairCount} parejas se jugará un torneo de todos contra todos (${(pairCount * (pairCount - 1)) / 2} partidos).`
      : `Con ${pairCount} parejas se jugará un torneo de eliminación directa. Los cruces de ronda 1 se generan ahora.`;

  const mutation = useMutation({
    mutationFn: () => generateMatches(tournamentId, new Date(startTime).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onGenerated();
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al generar los cruces");
    },
  });

  const handleClose = () => {
    setStartTime("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Generar cruces</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: "grey.100" }}>
            <Typography variant="body2" fontWeight={700} mb={0.5}>
              Formato: {format}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDesc}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <FormLabel htmlFor="generate-start">Fecha y hora de inicio</FormLabel>
            <OutlinedInput
              id="generate-start"
              type="datetime-local"
              value={startTime}
              onChange={e => {
                setStartTime(e.target.value);
                setError(null);
              }}
            />
          </FormControl>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!startTime || mutation.isPending}
          onClick={() => mutation.mutate()}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {mutation.isPending ? <CircularProgress size={18} /> : "Generar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

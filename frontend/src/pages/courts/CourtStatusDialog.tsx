import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCourtStatus } from "../../api/courtService";
import type { Court } from "../../types/Court";

const STATUS_CONFIG: Record<
  Court["status"],
  { label: string; color: "success" | "error" | "default"; description: string }
> = {
  AVAILABLE:       { label: "Disponible",    color: "success", description: "Sin turnos activos en este momento." },
  "IN USE":        { label: "En Uso",        color: "error",   description: "Tiene un turno activo en este momento." },
  "NOT AVAILABLE": { label: "No Disponible", color: "default", description: "Bloqueada manualmente." },
};

interface Props {
  court: Court;
  open: boolean;
  onClose: () => void;
}

export default function CourtStatusDialog({ court, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const isManual = court.status === "NOT AVAILABLE";
  const cfg = STATUS_CONFIG[court.status];

  const mutation = useMutation({
    mutationFn: (status: Court["status"]) => updateCourtStatus(court.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      onClose();
    },
  });

  const handleToggle = () => {
    mutation.mutate(isManual ? "AVAILABLE" : "NOT AVAILABLE");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Estado de {court.name}</DialogTitle>
      <DialogContent>
        {/* Current status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700 }} />
          <Typography variant="body2" color="text.secondary">
            {cfg.description}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* Manual override toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: isManual ? "error.light" : "divider",
            backgroundColor: isManual ? "error.50" : "transparent",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <BlockIcon
              fontSize="small"
              sx={{ mt: 0.3, color: isManual ? "error.main" : "text.disabled" }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Bloquear manualmente
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Marcá la cancha como no disponible sin importar las reservas del día.
              </Typography>
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={isManual}
                onChange={handleToggle}
                disabled={mutation.isPending}
                color="error"
                size="small"
              />
            }
            label=""
            sx={{ m: 0, flexShrink: 0 }}
          />
        </Box>

        {!isManual && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            El estado se actualiza automáticamente según las reservas del día.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

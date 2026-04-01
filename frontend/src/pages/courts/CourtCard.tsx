import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RoofingIcon from "@mui/icons-material/Roofing";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Court } from "../../types/Court";
import { deleteCourt } from "../../api/courtService";
import CourtStatusDialog from "./CourtStatusDialog";
import DeleteCourt from "./DeleteCourt";

interface Props {
  court: Court;
  onSelect: (court: Court) => void;
  hourlyRate?: number;
}

const STATUS_CONFIG: Record<
  Court["status"],
  { label: string; borderColor: string; chipColor: "success" | "error" | "default" }
> = {
  AVAILABLE:       { label: "Disponible",    borderColor: "#4caf50", chipColor: "success" },
  "IN USE":        { label: "En Uso",        borderColor: "#f44336", chipColor: "error"   },
  "NOT AVAILABLE": { label: "No Disponible", borderColor: "#9e9e9e", chipColor: "default" },
};

const TYPE_CONFIG: Record<Court["type"], { label: string; icon: React.ReactNode }> = {
  TECHADA:     { label: "Techada · Iluminada",     icon: <RoofingIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  DESCUBIERTA: { label: "Descubierta · Iluminada", icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
};

export default function CourtCard({ court, onSelect, hourlyRate }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { name, status, type } = court;
  const { label, borderColor, chipColor } = STATUS_CONFIG[status] ?? STATUS_CONFIG["AVAILABLE"];
  const typeInfo = TYPE_CONFIG[type];

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourt(court.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
    },
  });

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1.5px solid",
          borderColor: "divider",
          borderLeft: `4px solid ${borderColor}`,
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: "0 4px 14px rgba(0,0,0,0.10)" },
        }}
      >
        <CardContent sx={{ px: 2, pt: 1.75, pb: "0 !important" }}>
          {/* Name + status chip */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>
              {name}
            </Typography>
            <Chip
              label={label}
              color={chipColor}
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20, flexShrink: 0 }}
            />
          </Box>

          {/* Court type */}
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5, color: "text.secondary" }}>
            {typeInfo?.icon}
            <Typography variant="caption" color="text.secondary">
              {typeInfo?.label ?? type}
            </Typography>
          </Box>

          {/* Hourly rate */}
          {hourlyRate != null && hourlyRate > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              ${hourlyRate}/hora
            </Typography>
          )}
        </CardContent>

        <Divider sx={{ mx: 2, my: 1.25 }} />

        <CardActions sx={{ px: 2, pb: 1.75, pt: 0, gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CalendarMonthIcon sx={{ fontSize: "0.9rem !important" }} />}
            onClick={() => onSelect(court)}
            disabled={status === "NOT AVAILABLE"}
            fullWidth
            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.6 }}
          >
            Ver Horarios
          </Button>

          <Tooltip title="Cambiar estado">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setStatusOpen(true); }}
              sx={{
                flexShrink: 0,
                color: "text.secondary",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                p: 0.55,
                "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
              }}
            >
              <SettingsIcon sx={{ fontSize: "0.95rem" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar cancha">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
              sx={{
                flexShrink: 0,
                color: "error.main",
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                p: 0.55,
                "&:hover": { borderColor: "error.light", bgcolor: "error.50" },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: "0.95rem" }} />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>

      <CourtStatusDialog
        court={court}
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
      />

      <DeleteCourt
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={() => deleteMutation.mutate()}
      />
    </>
  );
}

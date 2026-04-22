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
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SportsVolleyballIcon from "@mui/icons-material/SportsVolleyball";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Court } from "../../types/Court";
import type { Booking } from "../../types/Booking";
import { deleteCourt } from "../../api/courtService";
import { SPORT_LABEL } from "../../constants/sports";
import CourtStatusDialog from "./CourtStatusDialog";
import DeleteCourt from "./DeleteCourt";

interface Props {
  court: Court;
  onSelect: (court: Court) => void;
  hourlyRate?: number;
  todayBookings?: Booking[];
}

const STATUS_CONFIG: Record<
  Court["status"],
  { label: string; borderColor: string; chipColor: "success" | "error" | "default" }
> = {
  AVAILABLE:       { label: "Disponible",    borderColor: "#4caf50", chipColor: "success" },
  "IN USE":        { label: "En Uso",        borderColor: "#f44336", chipColor: "error"   },
  "NOT AVAILABLE": { label: "No Disponible", borderColor: "#9e9e9e", chipColor: "default" },
};

// Sport badge config — icon + palette per sport
const SPORT_CHIP: Record<string, { icon: React.ReactElement; bg: string; color: string }> = {
  PADEL:    { icon: <SportsTennisIcon />,    bg: "#fff8e1", color: "#c07700" },
  TENIS:    { icon: <SportsTennisIcon />,    bg: "#f1f8e9", color: "#2e7d32" },
  FUTBOL:   { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL5:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL7:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL9:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL11: { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  VOLEY:    { icon: <SportsVolleyballIcon />, bg: "#e3f2fd", color: "#0d47a1" },
  BASQUET:  { icon: <SportsBasketballIcon />, bg: "#fff3e0", color: "#bf360c" },
};

const TYPE_CONFIG: Partial<Record<Court["type"], { label: string; icon: React.ReactNode }>> = {
  TECHADA:     { label: "Techada · Iluminada",     icon: <RoofingIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  DESCUBIERTA: { label: "Descubierta · Iluminada", icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  FUTBOL5:     { label: "Fútbol 5",   icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  FUTBOL7:     { label: "Fútbol 7",   icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  FUTBOL9:     { label: "Fútbol 9",   icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  FUTBOL11:    { label: "Fútbol 11",  icon: <WbSunnyIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  CEMENTO:     { label: "Cemento",    icon: <RoofingIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
  PARQUET:     { label: "Parquet",    icon: <RoofingIcon sx={{ fontSize: 13, mr: 0.5 }} /> },
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function CourtCard({ court, onSelect, hourlyRate, todayBookings = [] }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { name, status, type, sport } = court;
  const { label, borderColor, chipColor } = STATUS_CONFIG[status] ?? STATUS_CONFIG["AVAILABLE"];
  const typeInfo = TYPE_CONFIG[type];

  const now = new Date();
  const busyBooking = todayBookings.find(
    (b) => new Date(b.startTime) <= now && new Date(b.endTime) > now,
  );
  const nextBooking = todayBookings.find((b) => new Date(b.startTime) > now);

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
          borderRadius: 3,
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

          {/* Court type + sport */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
              {typeInfo?.icon}
              <Typography variant="caption" color="text.secondary">
                {typeInfo?.label ?? type}
              </Typography>
            </Box>
            {sport && (() => {
              const cfg = SPORT_CHIP[sport];
              return (
                <Chip
                  icon={cfg?.icon}
                  label={SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    bgcolor: cfg?.bg ?? "rgba(245,173,39,0.12)",
                    color: cfg?.color ?? "#b07d00",
                    "& .MuiChip-icon": { fontSize: 15, color: "inherit", ml: "6px" },
                    "& .MuiChip-label": { px: "8px" },
                  }}
                />
              );
            })()}
          </Box>

          {/* Hourly rate */}
          {hourlyRate != null && hourlyRate > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              ${hourlyRate}/hora
            </Typography>
          )}

          {/* Real-time occupancy */}
          {busyBooking ? (
            <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "#d32f2f", fontWeight: 600 }}>
              Ocupada hasta {fmtTime(new Date(busyBooking.endTime))}
            </Typography>
          ) : nextBooking ? (
            <Tooltip
              title={nextBooking.player?.name ?? nextBooking.profesor?.name ?? ""}
              arrow
              disableHoverListener={!nextBooking.player?.name && !nextBooking.profesor?.name}
            >
              <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "text.secondary", cursor: "default" }}>
                Próxima: {fmtTime(new Date(nextBooking.startTime))}
              </Typography>
            </Tooltip>
          ) : null}
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
              aria-label="Cambiar estado de la cancha"
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
              aria-label="Eliminar cancha"
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

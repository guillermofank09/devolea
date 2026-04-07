import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBookingsByProfesor, cancelBooking, cancelBookingGroup } from "../../api/bookingService";
import WeeklyCalendar from "../../components/calendar/weeklyCalendar";
import type { CalendarEvent } from "../../types/Event";
import type { Booking } from "../../types/Booking";
import type { Profesor } from "../../types/Profesor";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 40%)`;
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

interface Props {
  profesor: Profesor | null;
  open: boolean;
  onClose: () => void;
}

export default function ProfesorScheduleModal({ profesor, open, onClose }: Props) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: bookings = [], isFetching } = useQuery<Booking[]>({
    queryKey: ["profesorBookings", profesor?.id],
    queryFn: () => fetchBookingsByProfesor(profesor!.id),
    enabled: open && !!profesor,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesorBookings", profesor?.id] });
      setSelectedBooking(null);
    },
  });

  const cancelGroupMutation = useMutation({
    mutationFn: (groupId: string) => cancelBookingGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesorBookings", profesor?.id] });
      setSelectedBooking(null);
    },
  });

  const events: CalendarEvent[] = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        title: b.court.name ?? `Cancha ${b.court.id}`,
        start: new Date(b.startTime),
        end: new Date(b.endTime),
        courtId: b.court.id!,
        status: "BOOKED",
        color: stringToColor(b.court.name ?? "cancha"),
        isRecurring: b.isRecurring,
        recurringGroupId: b.recurringGroupId,
      })),
    [bookings]
  );

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(bookings.find((b) => b.id === event.id) ?? null);
  };

  if (!profesor) return null;

  return (
    <>
      <Dialog
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        open={open}
        onClose={onClose}
        PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <CalendarMonthIcon color="action" fontSize="small" />
                <Typography variant={isMobile ? "subtitle1" : "h6"} component="span" fontWeight={700} noWrap>
                  {profesor.name}
                </Typography>
                {isFetching && <CircularProgress size={16} />}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Horarios de clases reservados · hacé clic en un bloque para cancelar
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <WeeklyCalendar
              events={events}
              onSelectSlot={() => {}}
              onSelectEvent={handleSelectEvent}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Booking detail / cancel dialog */}
      <Dialog
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {selectedBooking && (() => {
          const start = new Date(selectedBooking.startTime);
          const end   = new Date(selectedBooking.endTime);
          const durationH = (end.getTime() - start.getTime()) / 3_600_000;
          const color = stringToColor(selectedBooking.court.name ?? "cancha");
          return (
            <>
              <Box sx={{ bgcolor: color, px: 3, pt: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={800} color="#fff" noWrap>
                    {selectedBooking.court.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    Clase de {profesor.name}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSelectedBooking(null)}
                  size="small"
                  sx={{ color: "rgba(255,255,255,0.8)", flexShrink: 0 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75, bgcolor: "#fafafa", borderRadius: 2, border: "1.5px solid", borderColor: "divider", mb: 2 }}>
                  <CalendarMonthIcon sx={{ color: color, fontSize: 20, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                      {formatDate(start)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(start)} – {formatTime(end)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${durationH % 1 === 0 ? durationH : durationH.toFixed(1)}h`}
                    size="small"
                    sx={{ ml: "auto", fontWeight: 700, bgcolor: color, color: "#fff", fontSize: "0.72rem" }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {selectedBooking.court.name}
                  </Typography>
                </Box>
                {selectedBooking.isRecurring && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, p: 1.25, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                    <RepeatIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      Clase fija semanal · se repite todas las semanas
                    </Typography>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1, flexDirection: isMobile ? "column" : "row" }}>
                <Button onClick={() => setSelectedBooking(null)} fullWidth={isMobile} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
                  Cerrar
                </Button>
                {selectedBooking.isRecurring && selectedBooking.recurringGroupId && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth={isMobile}
                    disabled={cancelGroupMutation.isPending || cancelMutation.isPending}
                    onClick={() => cancelGroupMutation.mutate(selectedBooking.recurringGroupId!)}
                    startIcon={cancelGroupMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <RepeatIcon sx={{ fontSize: 15 }} />}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600 }}
                  >
                    {cancelGroupMutation.isPending ? "Cancelando serie…" : "Cancelar toda la serie"}
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  fullWidth={isMobile}
                  disabled={cancelMutation.isPending || cancelGroupMutation.isPending}
                  onClick={() => cancelMutation.mutate(selectedBooking.id)}
                  startIcon={cancelMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                >
                  {cancelMutation.isPending ? "Cancelando…" : selectedBooking.isRecurring ? "Solo esta fecha" : "Cancelar clase"}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </>
  );
}

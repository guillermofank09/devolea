import { useMemo, useState } from "react";
import {
  Avatar,
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
import { fetchBookingsByCourt, cancelBooking, cancelBookingGroup } from "../../api/bookingService";
import WeeklyCalendar from "../../components/calendar/weeklyCalendar";
import type { CalendarEvent } from "../../types/Event";
import type { Booking } from "../../types/Booking";
import type { Court } from "../../types/Court";
import BookingDialog from "./BookingDialog";

const STATUS_LABEL: Record<Court["status"], string> = {
  AVAILABLE:       "Disponible",
  "IN USE":        "En Uso",
  "NOT AVAILABLE": "No Disponible",
};

const STATUS_COLOR: Record<Court["status"], "success" | "default" | "error"> = {
  AVAILABLE:       "success",
  "IN USE":        "error",
  "NOT AVAILABLE": "default",
};

const TYPE_LABEL: Record<Court["type"], string> = {
  TECHADA: "Techada",
  DESCUBIERTA: "Descubierta",
};

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 40%)`;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

interface SlotInfo { start: Date; end: Date }

const CourtView = ({
  court,
  isOpen,
  handleClose,
}: {
  court: Court;
  isOpen: boolean;
  handleClose: () => void;
}) => {
  const [pendingSlot, setPendingSlot] = useState<SlotInfo | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: bookings = [], isFetching } = useQuery<Booking[]>({
    queryKey: ["bookingsData", court.id],
    queryFn: () => fetchBookingsByCourt(court.id),
    enabled: isOpen,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingsData", court.id] });
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      setSelectedBooking(null);
    },
  });

  const cancelGroupMutation = useMutation({
    mutationFn: (groupId: string) => cancelBookingGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingsData", court.id] });
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      setSelectedBooking(null);
    },
  });

  const events: CalendarEvent[] = useMemo(
    () =>
      bookings.map((b) => {
        const displayName = b.player?.name ?? b.profesor?.name ?? "Clase";
        return {
          id: b.id,
          title: displayName,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          courtId: court.id,
          status: "BOOKED",
          color: stringToColor(displayName),
          isRecurring: b.isRecurring,
          recurringGroupId: b.recurringGroupId,
        };
      }),
    [bookings, court.id]
  );

  const handleSelectSlot = (slot: unknown) => setPendingSlot(slot as SlotInfo);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(bookings.find((b) => b.id === event.id) ?? null);
  };

  return (
    <>
      {/* ── Main schedule dialog ── */}
      <Dialog
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1, px: isMobile ? 2 : 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <CalendarMonthIcon color="action" fontSize="small" />
                <Typography variant={isMobile ? "subtitle1" : "h6"} component="span" fontWeight={700} noWrap>
                  {court.name}
                </Typography>
                <Chip
                  label={STATUS_LABEL[court.status]}
                  color={STATUS_COLOR[court.status]}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                {!isMobile && (
                  <Chip label={TYPE_LABEL[court.type] ?? court.type} variant="outlined" size="small" />
                )}
                {isFetching && <CircularProgress size={16} />}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {isMobile
                  ? "Tocá un horario para reservar"
                  : "Hacé clic en un horario libre para reservar · Hacé clic en una reserva para cancelarla"}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small" sx={{ mt: -0.5, flexShrink: 0 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <WeeklyCalendar
              events={events}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Booking form dialog ── */}
      <BookingDialog
        open={!!pendingSlot}
        onClose={() => setPendingSlot(null)}
        slot={pendingSlot}
        courtId={court.id}
        onBooked={() => setPendingSlot(null)}
      />

      {/* ── Booking detail / cancel dialog ── */}
      <Dialog
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {selectedBooking && (() => {
          const start = new Date(selectedBooking.startTime);
          const end   = new Date(selectedBooking.endTime);
          const durationH = (end.getTime() - start.getTime()) / 3_600_000;
          const isProfesorBooking = !!selectedBooking.profesor && !selectedBooking.player;
          const displayName = selectedBooking.player?.name ?? selectedBooking.profesor?.name ?? "Clase";
          const color = stringToColor(displayName);
          return (
            <>
              {/* Colored top banner */}
              <Box
                sx={{
                  bgcolor: color,
                  px: 3,
                  pt: 2.5,
                  pb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    width: 46,
                    height: 46,
                    fontWeight: 800,
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(displayName)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800} color="#fff" noWrap>
                    {displayName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    {isProfesorBooking
                      ? `Clase · ${selectedBooking.profesor?.phone ?? "Profesor"}`
                      : `${selectedBooking.player?.city ?? ""} · Cat. ${selectedBooking.player?.category ?? ""}`}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setSelectedBooking(null)}
                  size="small"
                  sx={{ ml: "auto", color: "rgba(255,255,255,0.8)", flexShrink: 0 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
                {/* Date / time row */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.75,
                    bgcolor: "#fafafa",
                    borderRadius: 2,
                    border: "1.5px solid",
                    borderColor: "divider",
                    mb: 2,
                  }}
                >
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
                    sx={{
                      ml: "auto",
                      fontWeight: 700,
                      bgcolor: color,
                      color: "#fff",
                      fontSize: "0.72rem",
                    }}
                  />
                </Box>

                {/* Court row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {court.name} · {TYPE_LABEL[court.type] ?? court.type}
                  </Typography>
                </Box>

                {/* Recurring badge */}
                {selectedBooking.isRecurring && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <RepeatIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      Reserva fija semanal · se repite todas las semanas
                    </Typography>
                  </Box>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5, gap: 1, flexDirection: isMobile ? "column" : "row" }}>
                {selectedBooking.isRecurring && selectedBooking.recurringGroupId && (
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth={isMobile}
                    disabled={cancelGroupMutation.isPending || cancelMutation.isPending}
                    onClick={() => cancelGroupMutation.mutate(selectedBooking.recurringGroupId!)}
                    startIcon={
                      cancelGroupMutation.isPending
                        ? <CircularProgress size={14} color="inherit" />
                        : <RepeatIcon sx={{ fontSize: 15 }} />
                    }
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
                  {cancelMutation.isPending
                    ? "Cancelando…"
                    : selectedBooking.isRecurring
                    ? selectedBooking.profesor ? "Solo esta clase" : "Solo esta fecha"
                    : selectedBooking.profesor ? "Cancelar esta clase" : "Cancelar reserva"}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </>
  );
};

export default CourtView;

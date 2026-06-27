import { useState } from "react";
import type { Court } from "../../types/Court";
import type { Booking } from "../../types/Booking";
import CourtList from "./CourtList";
import CourtView from "./CourtView";
import AddEditCourt from "./AddEditCourt";
import PageHeader from "../../components/common/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourts } from "../../api/courtService";
import { fetchTodayBookings, fetchPendingBookings, confirmBooking, cancelBooking, buildConfirmWaUrl } from "../../api/bookingService";
import { Alert, Box, Button, Chip, CircularProgress, Divider, Fab, IconButton, Paper, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmptyState from "../../components/common/EmptyState";
import CardGridSkeleton from "../../components/common/CardGridSkeleton";

export default function Courts() {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { isPending, error, data } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
  });

  const { data: todayBookings = [] } = useQuery<Booking[]>({
    queryKey: ["todayBookings"],
    queryFn: fetchTodayBookings,
    refetchInterval: 60_000,
  });

  const { data: pendingBookings = [] } = useQuery<Booking[]>({
    queryKey: ["pendingBookings"],
    queryFn: fetchPendingBookings,
    refetchInterval: 30_000,
  });

  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCourt(null);
  };

  const hasData = data && data.length > 0;

  const renderContent = () => {
    if (isPending) return <CardGridSkeleton cards={8} />;
    if (error) return <Alert severity="error">{String(error)}</Alert>;
    if (!data || data.length === 0) {
      return (
        <EmptyState
          message="Todavía no hay canchas registradas. Agregá la primera."
          action={<AddEditCourt />}
        />
      );
    }
    return <CourtList onSelect={handleSelectCourt} courts={data} todayBookings={todayBookings} />;
  };

  const now = new Date();
  const busyNow = todayBookings.filter(
    (b) => new Date(b.startTime) <= now && new Date(b.endTime) > now,
  );
  const upcoming = todayBookings.find((b) => new Date(b.startTime) > now);

  return (
    <Box>
      <PageHeader
        title="Canchas"
        subtitle="Administrá las canchas disponibles del club"
        action={hasData && !isMobile ? <AddEditCourt /> : undefined}
      />

      {pendingBookings.length > 0 && <PendingReservationsPanel bookings={pendingBookings} />}

      {hasData && todayBookings.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            border: "1.5px solid",
            borderColor: "divider",
            borderRadius: 3,
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            mb: 3,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeIcon sx={{ fontSize: 16, color: busyNow.length > 0 ? "error.main" : "success.main" }} />
            <Typography variant="body2" fontWeight={600}>
              {busyNow.length > 0
                ? `${busyNow.length} ${busyNow.length === 1 ? "cancha ocupada" : "canchas ocupadas"} ahora`
                : "Todas libres ahora"}
            </Typography>
          </Stack>

          <Chip
            icon={<EventNoteIcon sx={{ fontSize: "0.85rem !important" }} />}
            label={`${todayBookings.length} ${todayBookings.length === 1 ? "reserva" : "reservas"} hoy`}
            size="small"
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />

          {upcoming && (
            <Typography variant="caption" color="text.secondary">
              Próxima:{" "}
              <strong>
                {upcoming.court.name} ·{" "}
                {new Date(upcoming.startTime).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </strong>
            </Typography>
          )}
        </Paper>
      )}

      {renderContent()}

      {isMobile && hasData && (
        <Fab
          aria-label="Agregar cancha"
          onClick={() => setAddOpen(true)}
          sx={{ position: "fixed", bottom: 24, right: 24, bgcolor: "#111", color: "#fff", "&:hover": { bgcolor: "#333" }, zIndex: 1200 }}
        >
          <AddIcon />
        </Fab>
      )}

      {isMobile && (
        <AddEditCourt controlled={{ open: addOpen, onClose: () => setAddOpen(false) }} />
      )}

      {selectedCourt && (
        <CourtView court={selectedCourt} isOpen={open} handleClose={handleClose} />
      )}
    </Box>
  );
}

function PendingReservationsPanel({ bookings }: { bookings: Booking[] }) {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pendingBookings"] });
    queryClient.invalidateQueries({ queryKey: ["bookingsData"] });
    queryClient.invalidateQueries({ queryKey: ["todayBookings"] });
    queryClient.invalidateQueries({ queryKey: ["courtsData"] });
  };

  const confirmMut = useMutation({
    mutationFn: (b: Booking) => confirmBooking(b.id),
    onMutate: (b) => setActingId(b.id),
    onSettled: () => setActingId(null),
    onSuccess: (_data, b) => {
      const phone = b.guestPhone ?? b.player?.phone;
      if (phone) {
        const url = buildConfirmWaUrl(phone, b.court.name, new Date(b.startTime));
        window.open(url, "_blank", "noopener,noreferrer");
      }
      invalidate();
    },
  });

  const cancelMut = useMutation({
    mutationFn: (b: Booking) => cancelBooking(b.id),
    onMutate: (b) => setActingId(b.id),
    onSettled: () => setActingId(null),
    onSuccess: invalidate,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1.5px solid",
        borderColor: "#fde68a",
        bgcolor: "#fffbeb",
        borderRadius: 3,
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <HourglassEmptyIcon sx={{ fontSize: 18, color: "#b45309" }} />
        <Typography variant="body2" fontWeight={700} sx={{ color: "#92400e" }}>
          Reservas pendientes
        </Typography>
        <Chip
          label={bookings.length}
          size="small"
          sx={{ fontWeight: 700, bgcolor: "#fbbf24", color: "#7c2d12", height: 20 }}
        />
      </Stack>
      <Divider sx={{ mb: 1 }} />
      <Stack divider={<Divider flexItem />} spacing={0}>
        {bookings.map((b) => {
          const start = new Date(b.startTime);
          const dateLabel = start.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
          const timeLabel = start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
          const guestName = b.guestName ?? b.player?.name ?? "Sin nombre";
          const guestPhone = b.guestPhone ?? b.player?.phone ?? null;
          const isActing = actingId === b.id;
          return (
            <Box key={b.id} sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, py: 1 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {guestName} {b.player && <Chip label="Jugador del club" size="small" sx={{ height: 16, fontSize: "0.6rem", ml: 0.5 }} />}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.court.name} · {dateLabel} {timeLabel} hs
                  {guestPhone && <> · <a href={`https://wa.me/${guestPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#16a34a", textDecoration: "none" }}><WhatsAppIcon sx={{ fontSize: 11, verticalAlign: "middle" }} /> +{guestPhone}</a></>}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Rechazar">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isActing}
                      onClick={() => cancelMut.mutate(b)}
                    >
                      {isActing && cancelMut.isPending ? <CircularProgress size={14} /> : <CloseIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={isActing}
                  onClick={() => confirmMut.mutate(b)}
                  startIcon={isActing && confirmMut.isPending ? <CircularProgress size={12} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700, fontSize: "0.72rem", py: 0.4 }}
                >
                  Confirmar
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

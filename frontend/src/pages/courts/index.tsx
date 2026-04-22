import { useState } from "react";
import type { Court } from "../../types/Court";
import type { Booking } from "../../types/Booking";
import CourtList from "./CourtList";
import CourtView from "./CourtView";
import AddEditCourt from "./AddEditCourt";
import PageHeader from "../../components/common/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchCourts } from "../../api/courtService";
import { fetchTodayBookings } from "../../api/bookingService";
import { Alert, Box, Chip, Fab, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
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

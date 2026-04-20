import { useState } from "react";
import type { Court } from "../../types/Court";
import CourtList from "./CourtList";
import CourtView from "./CourtView";
import AddEditCourt from "./AddEditCourt";
import PageHeader from "../../components/common/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchCourts } from "../../api/courtService";
import { Alert, Box, Fab, useMediaQuery, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
    return <CourtList onSelect={handleSelectCourt} courts={data} />;
  };

  return (
    <Box>
      <PageHeader
        title="Canchas"
        subtitle="Administrá las canchas disponibles del club"
        action={hasData && !isMobile ? <AddEditCourt /> : undefined}
      />

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

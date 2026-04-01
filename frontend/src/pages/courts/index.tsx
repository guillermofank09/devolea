import { useState } from "react";
import type { Court } from "../../types/Court";
import CourtList from "./CourtList";
import CourtView from "./CourtView";
import AddEditCourt from "./AddEditCourt";
import PageHeader from "../../components/common/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchCourts } from "../../api/courtService";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

export default function Courts() {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [open, setOpen] = useState(false);

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

  const renderContent = () => {
    if (isPending) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{String(error)}</Alert>;
    if (!data || data.length === 0) {
      return (
        <Box mt={6} textAlign="center">
          <Typography variant="body1" pb={3} color="text.secondary">
            Todavía no hay canchas registradas. Agregá la primera.
          </Typography>
          <AddEditCourt />
        </Box>
      );
    }
    return <CourtList onSelect={handleSelectCourt} courts={data} />;
  };

  return (
    <Box>
      <PageHeader
        title="Canchas"
        subtitle="Administrá las canchas disponibles del club"
        action={data && data.length > 0 ? <AddEditCourt /> : undefined}
      />
      {renderContent()}

      {selectedCourt && (
        <CourtView court={selectedCourt} isOpen={open} handleClose={handleClose} />
      )}
    </Box>
  );
}

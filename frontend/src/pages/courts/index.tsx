import { useState } from "react";
import type { Court } from "../../types/Court";
import CourtList from "./CourtList";
import CourtView from "./CourtView";
import AddEditCourt from "./AddEditCourt";
import PageHeader from "../../components/common/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchCourts } from "../../api/courtService";
import { Alert, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import PageLoader from "../../components/common/PageLoader";

export default function Courts() {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [open, setOpen] = useState(false);
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
    if (isPending) return <PageLoader />;
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
        action={hasData ? <AddEditCourt compact={isMobile} /> : undefined}
      />

      {renderContent()}

      {selectedCourt && (
        <CourtView court={selectedCourt} isOpen={open} handleClose={handleClose} />
      )}
    </Box>
  );
}

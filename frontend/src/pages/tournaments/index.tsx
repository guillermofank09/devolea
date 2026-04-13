import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTournaments, deleteTournament } from "../../api/tournamentService";
import PageLoader from "../../components/common/PageLoader";
import EmptyState from "../../components/common/EmptyState";
import type { Tournament, TournamentCategory, TournamentSex, TournamentStatus } from "../../types/Tournament";
import PageHeader from "../../components/common/PageHeader";
import AddEditTournament from "./AddEditTournament";
import DeleteDialog from "../../components/common/DeleteDialog";

const CATEGORY_LABEL: Record<TournamentCategory, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "S/C",
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  COMPLETED: "Finalizado",
};

const SEX_LABEL: Record<TournamentSex, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  MIXTO: "Mixto",
};

const STATUS_COLOR: Record<TournamentStatus, "default" | "success" | "primary"> = {
  DRAFT: "default",
  ACTIVE: "success",
  COMPLETED: "primary",
};

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function Tournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tournament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { isPending, error, data } = useQuery<Tournament[]>({
    queryKey: ["tournamentsData"],
    queryFn: fetchTournaments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentsData"] });
      setDeleteTarget(null);
    },
  });

  const addButton = (
    <Button
      variant="contained"
      startIcon={isMobile ? undefined : <AddIcon />}
      onClick={() => setAddOpen(true)}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        ...(isMobile ? { minWidth: 44, px: 1.5 } : { whiteSpace: "nowrap" }),
      }}
    >
      {isMobile ? <AddIcon /> : "Agregar torneo"}
    </Button>
  );

  return (
    <Box>
      <PageHeader
        title="Torneos"
        subtitle="Administrá los torneos del club"
        action={addButton}
      />

      {isPending && <PageLoader />}
      {error && <Alert severity="error">{String(error)}</Alert>}

      {data && data.length === 0 && (
        <EmptyState
          message="Todavía no hay torneos registrados. Agregá el primero."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Agregar torneo
            </Button>
          }
        />
      )}

      {data && data.length > 0 && (
        <Grid container spacing={2}>
          {data.map(tournament => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tournament.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, flex: 1, mr: 1 }}>
                      {tournament.name}
                    </Typography>
                    <Tooltip title="Eliminar torneo">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(tournament);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                    <Chip
                      label={`Cat. ${CATEGORY_LABEL[tournament.category]}`}
                      size="small"
                      color="info"
                      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                    />
                    {tournament.sex && (
                      <Chip
                        label={SEX_LABEL[tournament.sex] ?? tournament.sex}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                    <Chip
                      label={STATUS_LABEL[tournament.status]}
                      size="small"
                      color={STATUS_COLOR[tournament.status]}
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                    {tournament.format && (
                      <Chip
                        label={tournament.format === "ROUND_ROBIN" ? "Round Robin" : "Llaves"}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {formatDateRange(tournament.startDate, tournament.endDate)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/tournaments/${tournament.id}`);
                    }}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                  >
                    Ver detalle
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AddEditTournament open={addOpen} onClose={() => setAddOpen(false)} />
      <AddEditTournament open={!!editTarget} onClose={() => setEditTarget(null)} tournament={editTarget} />
      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar torneo"
        description={`¿Estás seguro de que querés eliminar el torneo "${deleteTarget?.name ?? ""}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}

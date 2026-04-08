import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  InputAdornment,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers, deletePlayer } from "../../api/playerService";
import type { Player } from "../../types/Player";
import PlayerTable from "./PlayerTable";
import AddEditPlayer from "./AddEditPlayer";
import DeleteDialog from "../../components/common/DeleteDialog";
import PageHeader from "../../components/common/PageHeader";
import TableSkeleton from "../../components/common/TableSkeleton";

export default function Players() {
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { isPending, isFetching, error, data } = useQuery<Player[]>({
    queryKey: ["playersData", search],
    queryFn: () => fetchPlayers(search || undefined),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playersData"] });
      setDeleteTarget(null);
    },
  });

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player);
    setAddEditOpen(true);
  };

  const handleCloseForm = () => {
    setAddEditOpen(false);
    setSelectedPlayer(null);
  };

  // Desktop: search + button inside PageHeader
  const desktopAction = (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <OutlinedInput
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar jugador..."
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        }
        endAdornment={
          search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch("")} edge="end" aria-label="Limpiar búsqueda">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
        sx={{ borderRadius: 2, backgroundColor: "white", minWidth: 220 }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setAddEditOpen(true)}
        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
      >
        Agregar jugador
      </Button>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Gestioná los jugadores registrados en el club"
        action={isMobile ? undefined : desktopAction}
      />

      {/* Mobile: search full width */}
      {isMobile && (
        <Box sx={{ mb: 2.5, mt: -2 }}>
          <OutlinedInput
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            endAdornment={
              search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")} edge="end" aria-label="Limpiar búsqueda">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            sx={{ borderRadius: 2, backgroundColor: "white" }}
          />
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="default"
          aria-label="Agregar jugador"
          onClick={() => setAddEditOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "#111",
            color: "#fff",
            "&:hover": { bgcolor: "#333" },
            zIndex: 1200,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {isPending && <TableSkeleton rows={7} columns={5} />}
      {error && <Alert severity="error">{String(error)}</Alert>}
      {data && (
        <>
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {data.length} {data.length === 1 ? "jugador" : "jugadores"}
            </Typography>
            {isFetching && !isPending && <CircularProgress size={14} sx={{ color: "text.disabled" }} />}
          </Box>
          <PlayerTable
            players={data}
            onEdit={handleEdit}
            onDelete={(p) => setDeleteTarget(p)}
          />
        </>
      )}

      <AddEditPlayer
        open={addEditOpen}
        onClose={handleCloseForm}
        player={selectedPlayer}
      />

      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar jugador"
        description={`¿Estás seguro de que querés eliminar a ${deleteTarget?.name ?? "este jugador"}? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}

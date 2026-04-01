import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers, deletePlayer } from "../../api/playerService";
import type { Player } from "../../types/Player";
import PlayerTable from "./PlayerTable";
import AddEditPlayer from "./AddEditPlayer";
import DeleteConfirmation from "../courts/DeleteCourt";
import PageHeader from "../../components/common/PageHeader";

export default function Players() {
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { isPending, error, data } = useQuery<Player[]>({
    queryKey: ["playersData", search],
    queryFn: () => fetchPlayers(search || undefined),
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

      {/* Mobile: search + button below the title, full width */}
      {isMobile && (
        <Box sx={{ display: "flex", gap: 1, mb: 2.5, mt: -2 }}>
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
            sx={{ borderRadius: 2, backgroundColor: "white", flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => setAddEditOpen(true)}
            sx={{ borderRadius: 2, minWidth: 44, px: 1.5, flexShrink: 0 }}
          >
            <AddIcon />
          </Button>
        </Box>
      )}

      {isPending && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{String(error)}</Alert>}
      {data && (
        <>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {data.length} {data.length === 1 ? "jugador" : "jugadores"}
            </Typography>
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

      <DeleteConfirmation
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}

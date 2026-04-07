import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  OutlinedInput,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfesores, deleteProfesor } from "../../api/profesorService";
import PageLoader from "../../components/common/PageLoader";
import type { Profesor } from "../../types/Profesor";
import ProfesorTable from "./ProfesorTable";
import AddEditProfesor from "./AddEditProfesor";
import ProfesorScheduleModal from "./ProfesorScheduleModal";
import DeleteConfirmation from "../courts/DeleteCourt";
import PageHeader from "../../components/common/PageHeader";

export default function Profesores() {
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [selected, setSelected] = useState<Profesor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profesor | null>(null);
  const [scheduleProfesor, setScheduleProfesor] = useState<Profesor | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { isPending, error, data } = useQuery<Profesor[]>({
    queryKey: ["profesoresData", search],
    queryFn: () => fetchProfesores(search || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProfesor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesoresData"] });
      setDeleteTarget(null);
    },
  });

  const handleEdit = (p: Profesor) => { setSelected(p); setAddEditOpen(true); };
  const handleCloseForm = () => { setAddEditOpen(false); setSelected(null); };

  const desktopAction = (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      <OutlinedInput
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar profesor..."
        startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
        sx={{ borderRadius: 2, backgroundColor: "white", minWidth: 220 }}
      />
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setAddEditOpen(true)}
        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
      >
        Agregar profesor
      </Button>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Profesores"
        subtitle="Gestioná los profesores del club y sus horarios de clases"
        action={isMobile ? undefined : desktopAction}
      />

      {isMobile && (
        <Box sx={{ display: "flex", gap: 1, mb: 2.5, mt: -2 }}>
          <OutlinedInput
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar profesor..."
            startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
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

      {isPending && <PageLoader />}
      {error && <Alert severity="error">{String(error)}</Alert>}
      {data && (
        <>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {data.length} {data.length === 1 ? "profesor" : "profesores"}
            </Typography>
          </Box>
          <ProfesorTable
            profesores={data}
            onEdit={handleEdit}
            onDelete={(p) => setDeleteTarget(p)}
            onSchedule={(p) => setScheduleProfesor(p)}
          />
        </>
      )}

      <AddEditProfesor open={addEditOpen} onClose={handleCloseForm} profesor={selected} />

      <DeleteConfirmation
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <ProfesorScheduleModal
        profesor={scheduleProfesor}
        open={!!scheduleProfesor}
        onClose={() => setScheduleProfesor(null)}
      />
    </Box>
  );
}

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourt } from "../../api/courtService";
import type { Court, CourtType, CreateCourt } from "../../types/Court";

const labelSx = { mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" };
const fieldSx = { "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" } };

const AddEditCourt = ({
  isEditing = false,
  courtNumber = 1,
  compact = false,
}: {
  isEditing?: boolean;
  courtNumber?: number;
  compact?: boolean;
}) => {
  const [name, setName] = useState(`Cancha ${courtNumber}`);
  const [type, setCourtType] = useState<CourtType>("TECHADA");
  const [open, setOpen] = useState(isEditing);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const mutation = useMutation<Court, { message: string }, CreateCourt>({
    mutationFn: createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({ name, type });
  };

  return (
    <>
      {!open && !isEditing && (
        <Button
          variant="contained"
          startIcon={compact ? undefined : <AddIcon />}
          onClick={handleClickOpen}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            ...(compact ? { minWidth: 44, px: 1.5 } : {}),
          }}
        >
          {compact ? <AddIcon /> : "Agregar cancha"}
        </Button>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {isEditing ? "Editar Cancha" : "Agregar Cancha"}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

              <Box>
                <FormLabel sx={labelSx}>Nombre</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Cancha 1"
                  autoFocus
                  sx={fieldSx}
                />
              </Box>

              <Box>
                <FormLabel sx={labelSx}>Tipo</FormLabel>
                <Select
                  fullWidth
                  size="small"
                  value={type}
                  onChange={e => setCourtType(e.target.value as CourtType)}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value="TECHADA">Techada · Iluminada</MenuItem>
                  <MenuItem value="DESCUBIERTA">Descubierta · Iluminada</MenuItem>
                </Select>
              </Box>

              {mutation.isError && (
                <Typography variant="body2" color="error">
                  Ocurrió un error al guardar la cancha. Intentá de nuevo.
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
            <Button
              onClick={handleClose}
              fullWidth={fullScreen}
              sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              fullWidth={fullScreen}
              startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
            >
              {mutation.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddEditCourt;

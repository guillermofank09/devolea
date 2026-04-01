import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  OutlinedInput,
  MenuItem,
  Select,
  Typography,
  DialogContentText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourt } from "../../api/courtService";
import type { Court, CourtType, CreateCourt } from "../../types/Court";

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
  const queryClient = useQueryClient();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const mutation = useMutation<Court, { message: string }, CreateCourt>({
    mutationFn: createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error al crear la cancha:", error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({ name, type });
  };

  return (
    <>
      {mutation.isPending && <CircularProgress size={24} />}
      {mutation.isError && (
        <Typography variant="body2" color="error" mt={1}>
          Ocurrió un error al guardar la cancha. Intentá de nuevo.
        </Typography>
      )}

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

      <Dialog maxWidth="sm" fullWidth open={open} onClose={handleClose}>
        <DialogTitle>
          {isEditing ? "Editar Cancha" : "Agregar Nueva Cancha"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Ingresá los datos de la cancha y hacé clic en Guardar.
            </DialogContentText>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="name">Nombre</FormLabel>
                <OutlinedInput
                  id="name"
                  value={name}
                  placeholder="Nombre de la cancha"
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>
            </Box>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="courtType">Tipo</FormLabel>
                <Select
                  id="courtType"
                  value={type}
                  onChange={(e) => setCourtType(e.target.value as CourtType)}
                >
                  <MenuItem value="TECHADA">Techada · Iluminada</MenuItem>
                  <MenuItem value="DESCUBIERTA">Descubierta · Iluminada</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} sx={{ textTransform: "none" }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={mutation.isPending || !name.trim()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {isEditing ? "Guardar" : "Agregar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default AddEditCourt;

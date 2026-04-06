import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfesor, updateProfesor } from "../../api/profesorService";
import type { Profesor, ProfesorFormData } from "../../types/Profesor";
import PhoneField from "../../components/common/PhoneField";

const labelSx = { mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" };
const fieldSx = { "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" } };

const EMPTY: ProfesorFormData = { name: "", phone: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  profesor?: Profesor | null;
}

export default function AddEditProfesor({ open, onClose, profesor }: Props) {
  const [form, setForm] = useState<ProfesorFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!profesor;

  useEffect(() => {
    if (profesor) {
      setForm({ name: profesor.name, phone: profesor.phone ?? "" });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [profesor, open]);

  const mutation = useMutation({
    mutationFn: (data: ProfesorFormData) =>
      isEditing ? updateProfesor(profesor!.id, data) : createProfesor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesoresData"] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al guardar el profesor");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? "Editar profesor" : "Agregar profesor"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <Box>
              <FormLabel sx={labelSx}>Nombre</FormLabel>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                autoFocus
                sx={fieldSx}
              />
            </Box>

            <PhoneField
              value={form.phone}
              onChange={(val) => setForm(p => ({ ...p, phone: val }))}
            />

            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button
            onClick={onClose}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!form.name.trim() || mutation.isPending}
            fullWidth={fullScreen}
            startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {mutation.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

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
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfesor, updateProfesor } from "../../api/profesorService";
import type { Profesor, ProfesorFormData } from "../../types/Profesor";

const labelSx = { mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" };
const fieldSx = { "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" } };

const EMPTY: ProfesorFormData = { name: "", phone: "", email: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  profesor?: Profesor | null;
}

export default function AddEditProfesor({ open, onClose, profesor }: Props) {
  const [form, setForm] = useState<ProfesorFormData>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isEditing = !!profesor;

  useEffect(() => {
    if (profesor) {
      setForm({ name: profesor.name, phone: profesor.phone ?? "", email: profesor.email ?? "" });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [profesor, open]);

  const set = (field: keyof ProfesorFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

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
      PaperProps={{ sx: { borderRadius: 3 } }}
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
                onChange={e => set("name", e.target.value)}
                placeholder="Ej: Juan Pérez"
                autoFocus
                sx={fieldSx}
              />
            </Box>

            <Box>
              <FormLabel sx={labelSx}>Teléfono (opcional)</FormLabel>
              <TextField
                fullWidth
                size="small"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="Ej: +54 9 11 1234-5678"
                inputMode="tel"
                sx={fieldSx}
              />
            </Box>

            <Box>
              <FormLabel sx={labelSx}>Email (opcional)</FormLabel>
              <TextField
                fullWidth
                size="small"
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="Ej: juan@email.com"
                sx={fieldSx}
              />
            </Box>

            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={onClose}
            sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!form.name.trim() || mutation.isPending}
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

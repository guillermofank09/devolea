import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormLabel,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfesor, updateProfesor } from "../../api/profesorService";
import type { Profesor, ProfesorFormData } from "../../types/Profesor";
import type { DaySchedule } from "../../types/ClubProfile";
import { DEFAULT_HOURS } from "../../types/ClubProfile";
import PhoneField from "../../components/common/PhoneField";
import BusinessHoursEditor from "../../components/common/BusinessHoursEditor";
import AvatarUpload from "../../components/common/AvatarUpload";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { SPORT_LABEL } from "../../constants/sports";

const EMPTY: ProfesorFormData = { name: "", phone: "", sex: "", avatarUrl: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  profesor?: Profesor | null;
}

export default function AddEditProfesor({ open, onClose, profesor }: Props) {
  const { user } = useAuth();
  const clubSports = user?.sports ?? ["PADEL"];

  const [form, setForm] = useState<ProfesorFormData>(EMPTY);
  const [hourlyRateStr, setHourlyRateStr] = useState("");
  const [sport, setSport] = useState<string>(clubSports[0] ?? "PADEL");
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!profesor;

  useEffect(() => {
    if (profesor) {
      setForm({ name: profesor.name, phone: profesor.phone ?? "", sex: profesor.sex ?? "", avatarUrl: profesor.avatarUrl ?? "" });
      setHourlyRateStr(profesor.hourlyRate != null ? String(profesor.hourlyRate) : "");
      setSport(profesor.sport ?? clubSports[0] ?? "PADEL");
      setSchedule(profesor.schedule?.length ? profesor.schedule : DEFAULT_HOURS);
    } else {
      setForm(EMPTY);
      setHourlyRateStr("");
      setSport(clubSports[0] ?? "PADEL");
      setSchedule(DEFAULT_HOURS);
    }
    setError(null);
  }, [profesor, open]);

  const mutation = useMutation({
    mutationFn: (data: ProfesorFormData) => {
      const payload = {
        ...data,
        sex: data.sex || undefined,
        avatarUrl: data.avatarUrl || undefined,
        hourlyRate: hourlyRateStr ? Number(hourlyRateStr) : undefined,
        sport,
        schedule,
      };
      return isEditing ? updateProfesor(profesor!.id, payload) : createProfesor(payload);
    },
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

            {/* Avatar */}
            <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
              <AvatarUpload
                name={form.name}
                value={form.avatarUrl}
                onChange={(url) => setForm(p => ({ ...p, avatarUrl: url }))}
                disabled={mutation.isPending}
              />
            </Box>

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Nombre</FormLabel>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                autoFocus
                disabled={mutation.isPending}
                sx={FORM_INPUT_SX}
              />
            </Box>

            <PhoneField
              value={form.phone}
              onChange={(val) => setForm(p => ({ ...p, phone: val }))}
              disabled={mutation.isPending}
            />

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Sexo</FormLabel>
              <ToggleButtonGroup
                value={form.sex || null}
                exclusive
                onChange={(_, val) => setForm(p => ({ ...p, sex: val ?? "" }))}
                size="small"
                fullWidth
                disabled={mutation.isPending}
                sx={{
                  height: 40,
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderColor: "divider",
                    color: "text.secondary",
                    transition: "all 0.15s",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "#F5AD27",
                    color: "#111",
                    borderColor: "#F5AD27",
                    "&:hover": { bgcolor: "#e09b18" },
                  },
                }}
              >
                <ToggleButton value="MASCULINO">Masculino</ToggleButton>
                <ToggleButton value="FEMENINO">Femenino</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {clubSports.length > 1 && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Deporte</FormLabel>
                <ToggleButtonGroup
                  exclusive
                  value={sport}
                  onChange={(_, v) => { if (v) setSport(v); }}
                  size="small"
                  disabled={mutation.isPending}
                  sx={{ flexWrap: "wrap", gap: 0.5 }}
                >
                  {clubSports.map(s => (
                    <ToggleButton
                      key={s}
                      value={s}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "8px !important",
                        border: "1.5px solid !important",
                        px: 1.5,
                        "&.Mui-selected": {
                          bgcolor: "rgba(245,173,39,0.15)",
                          borderColor: "#F5AD27 !important",
                          color: "#b07d00",
                        },
                      }}
                    >
                      {SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Precio por hora</FormLabel>
              <TextField
                fullWidth
                size="small"
                type="text"
                inputMode="decimal"
                value={hourlyRateStr}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v))
                    setHourlyRateStr(v.replace(/^0+(\d)/, "$1"));
                }}
                placeholder="0"
                disabled={mutation.isPending}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                }}
                helperText="Tarifa propia del profesor. Si se deja vacío se usa el precio general de clases."
                sx={FORM_INPUT_SX}
              />
            </Box>

            <Box>
              <Divider sx={{ mb: 2 }} />
              <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1.5 }}>Horarios de clases</FormLabel>
              <BusinessHoursEditor
                value={schedule}
                onChange={setSchedule}
                disabled={mutation.isPending}
              />
            </Box>

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

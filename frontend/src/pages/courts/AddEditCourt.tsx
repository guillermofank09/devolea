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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourt } from "../../api/courtService";
import type { Court, CourtType, CreateCourt } from "../../types/Court";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { SPORT_LABEL } from "../../constants/sports";

// Types available per sport
const COURT_TYPES_BY_SPORT: Record<string, { value: CourtType; label: string }[]> = {
  PADEL:   [{ value: "TECHADA", label: "Techada · Iluminada" }, { value: "DESCUBIERTA", label: "Descubierta · Iluminada" }],
  TENIS:   [{ value: "TECHADA", label: "Techada · Iluminada" }, { value: "DESCUBIERTA", label: "Descubierta · Iluminada" }],
  FUTBOL:  [{ value: "FUTBOL5", label: "Fútbol 5" }, { value: "FUTBOL7", label: "Fútbol 7" }, { value: "FUTBOL9", label: "Fútbol 9" }, { value: "FUTBOL11", label: "Fútbol 11" }],
  VOLEY:   [{ value: "CEMENTO", label: "Cemento" }, { value: "PARQUET", label: "Parquet" }],
  BASQUET: [{ value: "CEMENTO", label: "Cemento" }, { value: "PARQUET", label: "Parquet" }],
};

function defaultType(sport: string): CourtType {
  return COURT_TYPES_BY_SPORT[sport]?.[0]?.value ?? "TECHADA";
}

const TOGGLE_BTN_SX = {
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
} as const;

const AddEditCourt = ({
  isEditing = false,
  courtNumber = 1,
  compact = false,
}: {
  isEditing?: boolean;
  courtNumber?: number;
  compact?: boolean;
}) => {
  const { user } = useAuth();
  const sports = user?.sports ?? ["PADEL"];

  const [name, setName] = useState(`Cancha ${courtNumber}`);
  const [sport, setSport] = useState<string>(sports[0] ?? "PADEL");
  const [type, setCourtType] = useState<CourtType>(defaultType(sports[0] ?? "PADEL"));
  const [open, setOpen] = useState(isEditing);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  function handleSportChange(newSport: string) {
    setSport(newSport);
    setCourtType(defaultType(newSport));
  }

  const typeOptions = COURT_TYPES_BY_SPORT[sport] ?? COURT_TYPES_BY_SPORT.PADEL;

  const mutation = useMutation<Court, { message: string }, CreateCourt>({
    mutationFn: createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate({ name, type, sport });
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
                <FormLabel sx={FORM_LABEL_SX}>Nombre</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Cancha 1"
                  autoFocus
                  disabled={mutation.isPending}
                  sx={FORM_INPUT_SX}
                />
              </Box>

              {sports.length > 1 && (
                <Box>
                  <FormLabel sx={FORM_LABEL_SX}>Deporte</FormLabel>
                  <ToggleButtonGroup
                    exclusive
                    value={sport}
                    onChange={(_, v) => { if (v) handleSportChange(v); }}
                    size="small"
                    disabled={mutation.isPending}
                    sx={{ flexWrap: "wrap", gap: 0.5 }}
                  >
                    {sports.map(s => (
                      <ToggleButton key={s} value={s} sx={TOGGLE_BTN_SX}>
                        {SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              )}

              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Tipo</FormLabel>
                <Select
                  fullWidth
                  size="small"
                  value={type}
                  onChange={e => setCourtType(e.target.value as CourtType)}
                  disabled={mutation.isPending}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  {typeOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
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

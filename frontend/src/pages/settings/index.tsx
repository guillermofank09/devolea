import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "../../api/settingsService";
import type { AppSettings } from "../../types/AppSettings";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box sx={{ color: "#F5AD27" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const qc = useQueryClient();

  const { data, isPending, isError } = useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    retry: 1,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appSettings"] });
      setSnack(true);
    },
  });

  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [classHourlyRate, setClassHourlyRate] = useState<string>("");
  const [shareSchedules, setShareSchedules] = useState<boolean>(false);
  const [tournamentMatchDuration, setTournamentMatchDuration] = useState<string>("60");
  const [tournamentSetsCount, setTournamentSetsCount] = useState<number>(3);
  const [snack, setSnack] = useState(false);

  useEffect(() => {
    if (!data) return;
    const rate = Number(data.hourlyRate);
    const classRate = Number(data.classHourlyRate);
    setHourlyRate(rate > 0 ? String(rate) : "");
    setClassHourlyRate(classRate > 0 ? String(classRate) : "");
    setShareSchedules(data.shareSchedules ?? false);
    setTournamentMatchDuration(String(data.tournamentMatchDuration ?? 60));
    setTournamentSetsCount(data.tournamentSetsCount ?? 3);
  }, [data]);

  function handleSave() {
    mutation.mutate({
      hourlyRate: Number(hourlyRate) || 0,
      classHourlyRate: Number(classHourlyRate) || 0,
      shareSchedules,
      tournamentMatchDuration: Number(tournamentMatchDuration) || 60,
      tournamentSetsCount,
    });
  }

  function makePriceHandler(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
        setter(raw.replace(/^0+(\d)/, "$1"));
      }
    };
  }

  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Ajustes" subtitle="Configuración general de la aplicación" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudo conectar con el servidor. Verificá que el backend esté corriendo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={640}>
      <PageHeader title="Ajustes" subtitle="Configuración general de la aplicación" />

      {/* ── Precios ── */}
      <Section icon={<MonetizationOnOutlinedIcon />} title="Precios">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Precio por hora (general)
            </Typography>
            <TextField
              type="text"
              inputMode="decimal"
              size="small"
              value={hourlyRate}
              onChange={makePriceHandler(setHourlyRate)}
              placeholder="0"
              inputProps={{ min: 0, step: 0.5 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
              }}
              helperText="Se aplica a reservas de jugadores"
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Precio por hora (clase con profesor)
            </Typography>
            <TextField
              type="text"
              inputMode="decimal"
              size="small"
              value={classHourlyRate}
              onChange={makePriceHandler(setClassHourlyRate)}
              placeholder="0"
              inputProps={{ min: 0, step: 0.5 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
              }}
              helperText="Se aplica cuando se reserva una clase con profesor"
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
          </Box>
        </Box>
      </Section>

      {/* ── Disponibilidad ── */}
      <Section icon={<ShareOutlinedIcon />} title="Disponibilidad">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Switch
            checked={shareSchedules}
            onChange={(e) => setShareSchedules(e.target.checked)}
            sx={{
              "& .MuiSwitch-thumb": { bgcolor: shareSchedules ? "#F5AD27" : undefined },
              "& .MuiSwitch-track": { bgcolor: shareSchedules ? "rgba(245,173,39,0.4) !important" : undefined },
            }}
          />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Compartir horarios disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permite que los clientes vean los turnos disponibles de las canchas.
            </Typography>
          </Box>
        </Box>
      </Section>

      {/* ── Torneos ── */}
      <Section icon={<EmojiEventsOutlinedIcon />} title="Torneos">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Duración de partidos
            </Typography>
            <TextField
              type="text"
              inputMode="numeric"
              size="small"
              value={tournamentMatchDuration}
              onChange={e => {
                const v = e.target.value;
                if (v === "" || /^\d+$/.test(v)) setTournamentMatchDuration(v);
              }}
              placeholder="60"
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">min</InputAdornment> },
                formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
              }}
              helperText="Tiempo por partido de torneo"
              sx={{ width: { xs: "100%", sm: 200 } }}
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Cantidad de sets
            </Typography>
            <ToggleButtonGroup
              value={tournamentSetsCount}
              exclusive
              onChange={(_, val) => { if (val !== null) setTournamentSetsCount(val); }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 2 },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "#F5AD27",
                  color: "#111",
                  "&:hover": { bgcolor: "#e09b18" },
                },
              }}
            >
              <ToggleButton value={1}>Mejor de 1</ToggleButton>
              <ToggleButton value={3}>Mejor de 3</ToggleButton>
              <ToggleButton value={5}>Mejor de 5</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Section>

      {/* ── Save ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        {mutation.isError && (
          <Typography variant="body2" color="error" alignSelf="center">
            Error al guardar. Intentá de nuevo.
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={
            mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />
          }
          disabled={mutation.isPending}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 4 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </Box>

      <Snackbar
        open={snack}
        autoHideDuration={3000}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnack(false)} sx={{ borderRadius: 2 }}>
          Ajustes guardados correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
}

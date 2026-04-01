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
  Typography,
} from "@mui/material";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "../../api/settingsService";
import type { AppSettings } from "../../types/AppSettings";
import PageHeader from "../../components/common/PageHeader";

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

  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [shareSchedules, setShareSchedules] = useState<boolean>(false);
  const [snack, setSnack] = useState(false);

  useEffect(() => {
    if (!data) return;
    setHourlyRate(Number(data.hourlyRate) ?? 0);
    setShareSchedules(data.shareSchedules ?? false);
  }, [data]);

  function handleSave() {
    mutation.mutate({ hourlyRate, shareSchedules });
  }

  if (isPending) {
    return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  }

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
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
          Precio por hora
        </Typography>
        <TextField
          type="number"
          size="small"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(Number(e.target.value))}
          inputProps={{ min: 0, step: 0.5 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
            formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
          }}
          helperText="Este precio se mostrará en cada cancha"
          sx={{ width: 200 }}
        />
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
